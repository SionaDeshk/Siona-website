import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
// Share the reviewed fixture lifecycle and redacted diagnostics with the CLI.
// Normal unit checks never contact a remote project, even if credentials exist.
test(
  "live Supabase two-account isolation and cleanup",
  {
    skip: process.env.PASSPORT_RUN_LIVE_TESTS !== "1",
  },
  () => {
    const result = spawnSync(
      process.execPath,
      [
        fileURLToPath(
          new URL("../scripts/test-passport-isolation.mjs", import.meta.url),
        ),
      ],
      {
        env: process.env,
        encoding: "utf8",
        // Keep enough time for cleanup; do not interrupt a run mid-mutation.
      },
    );
    assert.equal(
      result.status,
      0,
      "Live isolation test failed. Run the standalone script for redacted stage/cleanup diagnostics.",
    );
  },
);
