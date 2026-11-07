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
const client = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
const a = client(), b = client();
const suffix = randomUUID();
const owned = {};
const check = (result, context) => { if (result.error) throw new Error(`${context}: ${result.error.message}`); return result.data; };
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
  const aId = await login(a,'A'); await login(b,'B');
  const fixtures = [
    ['passport_licenses',{jurisdiction:'AK',license_type:'RN',license_number:`TEST-${suffix}`}],
    ['passport_ce_entries',{title:`TEST-${suffix}`,provider:'Isolation test',hours:1,completed_on:'2026-11-07'}],
    ['passport_certifications',{name:`TEST-${suffix}`,issuer:'Isolation test'}],
  ];
  for (const [table,values] of fixtures) {
    const row = check(await a.from(table).insert({user_id:aId,...values}).select('id').single(),`A insert ${table}`);
    owned[table] = row.id;
    await assertHidden(table,row.id);
    console.log(`PASS: ${table} cannot be read, changed or deleted by B`);
  }
  const path = `${aId}/isolation-${suffix}.txt`;
  // Bucket only accepts PDF/JPEG/PNG; use a minimal PDF fixture.
  const pdf = new TextEncoder().encode('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n');
  check(await a.storage.from('passport-private').upload(path,pdf,{contentType:'application/pdf',upsert:false}), 'A upload');
  owned.path = path;
  const metadata = check(await a.from('passport_documents').insert({user_id:aId,storage_path:path,original_filename:'isolation-test.pdf',mime_type:'application/pdf',bytes:pdf.length}).select('id').single(),'A document metadata');
  owned.passport_documents=metadata.id;
  await assertHidden('passport_documents',metadata.id);
  const read = await b.storage.from('passport-private').download(path);
  assert.ok(read.error, 'SECURITY FAILURE: B downloaded A file');
  const signed = await b.storage.from('passport-private').createSignedUrl(path,60);
  assert.ok(signed.error, 'SECURITY FAILURE: B generated signed URL for A file');
  const remove = await b.storage.from('passport-private').remove([path]);
  assert.ok(remove.error || !remove.data?.length, 'SECURITY FAILURE: B removed A file');
  const stillThere = await a.storage.from('passport-private').download(path);
  assert.ifError(stillThere.error);
  console.log('PASS: B cannot access, sign or delete A storage object');
  console.log('PASS: all isolation checks completed');
} finally {
  if (owned.passport_documents) await a.from('passport_documents').delete().eq('id',owned.passport_documents);
  if (owned.path) await a.storage.from('passport-private').remove([owned.path]);
  for (const table of ['passport_licenses','passport_ce_entries','passport_certifications']) {
    if (owned[table]) await a.from(table).delete().eq('id',owned[table]);
  }
  await Promise.all([a.auth.signOut(),b.auth.signOut()]);
}
