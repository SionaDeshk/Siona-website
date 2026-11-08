// Run only against a disposable Supabase project with two dedicated test accounts.
// Required env: PASSPORT_TEST_SUPABASE_URL, PASSPORT_TEST_PUBLISHABLE_KEY,
// PASSPORT_TEST_USER_A_EMAIL, PASSPORT_TEST_USER_A_PASSWORD,
// PASSPORT_TEST_USER_B_EMAIL, PASSPORT_TEST_USER_B_PASSWORD.
// Example: node scripts/test-passport-isolation.mjs
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';

const required = ['PASSPORT_TEST_SUPABASE_URL','PASSPORT_TEST_PUBLISHABLE_KEY','PASSPORT_TEST_USER_A_EMAIL','PASSPORT_TEST_USER_A_PASSWORD','PASSPORT_TEST_USER_B_EMAIL','PASSPORT_TEST_USER_B_PASSWORD'];
for (const key of required) if (!process.env[key]) throw new Error(`Missing ${key}. No tests executed.`);
assert.notEqual(process.env.PASSPORT_TEST_USER_A_EMAIL, process.env.PASSPORT_TEST_USER_B_EMAIL, 'Use distinct accounts');
const url = process.env.PASSPORT_TEST_SUPABASE_URL;
const key = process.env.PASSPORT_TEST_PUBLISHABLE_KEY;
let endpoint;
try { endpoint = new URL(url); } catch { throw new Error('Invalid disposable project URL; value withheld'); }
assert.ok(endpoint.protocol === 'https:' && !endpoint.username && !endpoint.password && endpoint.pathname === '/', 'Use the HTTPS root URL of the confirmed disposable Supabase project');
// Reject privileged credentials before making any network requests.
let role;
try { role = JSON.parse(Buffer.from(key.split('.')[1] || '', 'base64url').toString()).role; } catch { /* Modern publishable keys are not JWTs. */ }
assert.ok(key.startsWith('sb_publishable_') || role === 'anon', 'Use a publishable or legacy anon key, never a secret/service-role key');
const client = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
const a = client(), b = client();
const suffix = randomUUID();
const owned = {};
const check = (result, context) => { if (result.error) throw new Error(`${context} failed`); return result.data; };
let failed = false;
async function login(c, prefix) {
  const data = check(await c.auth.signInWithPassword({email:process.env[`PASSPORT_TEST_USER_${prefix}_EMAIL`],password:process.env[`PASSPORT_TEST_USER_${prefix}_PASSWORD`]}), `Login ${prefix}`);
  assert.ok(data.user?.id, `Login ${prefix} failed`);
  return data.user.id;
}
async function assertHidden(table, id) {
  const rows = check(await b.from(table).select('id').eq('id',id), `B read ${table}`);
  assert.equal(rows.length,0,`SECURITY FAILURE: B can read A's ${table}`);
  const changed = check(await b.from(table).update({created_at:'2000-01-01T00:00:00Z'}).eq('id',id).select('id'), `B update ${table}`);
  assert.equal(changed.length,0,`SECURITY FAILURE: B can update A's ${table}`);
  const deleted = check(await b.from(table).delete().eq('id',id).select('id'), `B delete ${table}`);
  assert.equal(deleted.length,0,`SECURITY FAILURE: B can delete A's ${table}`);
}
try {
  const aId = await login(a,'A'); const bId = await login(b,'B');
  assert.notEqual(aId, bId, 'Use two distinct authenticated users');
  owned.userId = aId;
  const fixtures = [
    ['passport_licenses',{jurisdiction:'AK',license_type:'RN',license_number:`TEST-${suffix}`}],
    ['passport_ce_entries',{title:`TEST-${suffix}`,provider:'Isolation test',hours:1,completed_on:'2026-11-07'}],
    ['passport_certifications',{name:`TEST-${suffix}`,issuer:'Isolation test'}],
  ];
  for (const [table,values] of fixtures) {
    const id = randomUUID();
    owned[table] = id; // Track before mutation, including ambiguous network outcomes.
    const row = check(await a.from(table).insert({id,user_id:aId,...values}).select('id').single(),`A insert ${table}`);
    await assertHidden(table,row.id);
    console.log(`PASS: ${table} cannot be read, changed or deleted by B`);
  }
  const path = `${aId}/isolation-${suffix}.pdf`;
  // Bucket only accepts PDF/JPEG/PNG; use a minimal PDF fixture.
  const pdf = new TextEncoder().encode('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n');
  owned.path = path;
  check(await a.storage.from('passport-private').upload(path,pdf,{contentType:'application/pdf',upsert:false}), 'A upload');
  owned.passport_documents = randomUUID();
  const metadata = check(await a.from('passport_documents').insert({id:owned.passport_documents,user_id:aId,storage_path:path,original_filename:'isolation-test.pdf',mime_type:'application/pdf',bytes:pdf.length}).select('id').single(),'A document metadata');
  owned.passport_documents=metadata.id;
  await assertHidden('passport_documents',metadata.id);
  const read = await b.storage.from('passport-private').download(path);
  assert.ok(read.error, 'SECURITY FAILURE: B downloaded A file');
  const signed = await b.storage.from('passport-private').createSignedUrl(path,60);
  assert.ok(signed.error, 'SECURITY FAILURE: B generated signed URL for A file');
  const remove = await b.storage.from('passport-private').remove([path]);
  assert.ok(remove.error || !remove.data?.length, 'SECURITY FAILURE: B removed A file');
  const stillThere = await a.storage.from('passport-private').download(path);
  assert.ok(!stillThere.error, 'A must still be able to download the fixture');
  console.log('PASS: B cannot access, sign or delete A storage object');
} catch {
  // Never print raw SDK errors, assertion objects, sessions, tokens or inputs.
  failed = true;
  console.error('FAIL: isolation checks did not complete. No credentials or response details are logged.');
} finally {
  let cleanupFailed = false;
  const cleanup = async (operation, label) => {
    try {
      const result = await operation();
      if (result.error) throw new Error('Cleanup failed');
    } catch {
      cleanupFailed = true;
      console.error(`CLEANUP FAILED: ${label}. Inspect only this run's disposable fixtures.`);
    }
  };
  if (owned.passport_documents) await cleanup(() => a.from('passport_documents').delete().eq('id',owned.passport_documents).eq('user_id',owned.userId), 'document metadata');
  if (owned.path) await cleanup(() => a.storage.from('passport-private').remove([owned.path]), 'storage fixture');
  for (const table of ['passport_licenses','passport_ce_entries','passport_certifications']) {
    if (owned[table]) await cleanup(() => a.from(table).delete().eq('id',owned[table]).eq('user_id',owned.userId), table);
  }
  // Verify cleanup; APIs may return success with zero affected rows under RLS.
  for (const table of ['passport_documents','passport_licenses','passport_ce_entries','passport_certifications']) {
    if (owned[table]) await cleanup(async () => {
      const result = await a.from(table).select('id').eq('id',owned[table]).eq('user_id',owned.userId);
      return {error: result.error || (result.data?.length ? new Error('Fixture remains') : null)};
    }, `${table} removal verification`);
  }
  if (owned.path) await cleanup(async () => {
    const result = await a.storage.from('passport-private').list(owned.userId, {search: owned.path.split('/')[1]});
    return {error: result.error || (result.data?.some(file => file.name === owned.path.split('/')[1]) ? new Error('Fixture remains') : null)};
  }, 'storage removal verification');
  await Promise.all([cleanup(() => a.auth.signOut(), 'A sign out'), cleanup(() => b.auth.signOut(), 'B sign out')]);
  if (cleanupFailed) failed = true;
}
if (failed) process.exitCode = 1;
else console.log('PASS: all isolation checks and fixture cleanup completed');
