import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
const names = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "PASSPORT_TEST_EMAIL_A",
  "PASSPORT_TEST_PASSWORD_A",
  "PASSPORT_TEST_EMAIL_B",
  "PASSPORT_TEST_PASSWORD_B",
];
test(
  "live Supabase prevents second account from accessing rows, links and files",
  { skip: !names.every((n) => process.env[n]) },
  async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!,
      key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const a = createClient(url, key, { auth: { persistSession: false } }),
      b = createClient(url, key, { auth: { persistSession: false } });
    const authA = await a.auth.signInWithPassword({
      email: process.env.PASSPORT_TEST_EMAIL_A!,
      password: process.env.PASSPORT_TEST_PASSWORD_A!,
    });
    const authB = await b.auth.signInWithPassword({
      email: process.env.PASSPORT_TEST_EMAIL_B!,
      password: process.env.PASSPORT_TEST_PASSWORD_B!,
    });
    assert.ifError(authA.error);
    assert.ifError(authB.error);
    const owner = authA.data.user!.id,
      other = authB.data.user!.id;
    assert.notEqual(owner, other);
    const id = crypto.randomUUID(),
      path = `${owner}/${crypto.randomUUID()}.pdf`;
    try {
      assert.ifError(
        (
          await a
            .from("passport_ce_entries")
            .insert({
              id,
              user_id: owner,
              title: "Synthetic isolation test",
              provider: "Test",
              hours: 1,
              completed_on: "2026-01-01",
            })
        ).error,
      );
      assert.deepEqual(
        (await b.from("passport_ce_entries").select("*").eq("id", id)).data,
        [],
      );
      assert.deepEqual(
        (
          await b
            .from("passport_ce_entries")
            .update({ title: "Unauthorized" })
            .eq("id", id)
            .select()
        ).data,
        [],
      );
      assert.deepEqual(
        (await b.from("passport_ce_entries").delete().eq("id", id).select())
          .data,
        [],
      );
      assert.ok(
        (
          await b
            .from("passport_ce_entries")
            .insert({
              user_id: owner,
              title: "Unauthorized",
              provider: "Test",
              hours: 1,
              completed_on: "2026-01-01",
            })
        ).error,
      );
      assert.ifError(
        (
          await a.storage
            .from("passport-private")
            .upload(path, Buffer.from("%PDF-1.7\nsynthetic"), {
              contentType: "application/pdf",
            })
        ).error,
      );
      assert.ok(
        (await b.storage.from("passport-private").createSignedUrl(path, 60))
          .error,
      );
      assert.ok(
        (
          await b.storage
            .from("passport-private")
            .upload(
              `${owner}/${crypto.randomUUID()}.pdf`,
              Buffer.from("%PDF-1.7"),
              { contentType: "application/pdf" },
            )
        ).error,
      );
      assert.ok(
        (
          await b
            .from("passport_documents")
            .insert({
              user_id: other,
              storage_path: `${other}/${crypto.randomUUID()}.pdf`,
              original_filename: "synthetic.pdf",
              mime_type: "application/pdf",
              bytes: 10,
              ce_entry_id: id,
            })
        ).error,
      );
      assert.ifError(
        (await a.storage.from("passport-private").createSignedUrl(path, 60))
          .error,
      );
    } finally {
      await a.storage.from("passport-private").remove([path]);
      await a
        .from("passport_ce_entries")
        .delete()
        .eq("id", id)
        .eq("user_id", owner);
      await Promise.all([a.auth.signOut(), b.auth.signOut()]);
    }
  },
);
