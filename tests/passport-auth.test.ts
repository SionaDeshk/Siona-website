import assert from "node:assert/strict";
import { test } from "node:test";
import {
  callbackDestination,
  newPasswordSchema,
  recoveryCallback,
  recoveryEmailSchema,
} from "../src/lib/passport/auth-validation";
test("recovery callback redirects only to explicitly allowed internal destinations", () => {
  assert.equal(
    callbackDestination("/passport/reset-password"),
    "/passport/reset-password",
  );
  for (const value of [
    null,
    "https://evil.example",
    "//evil.example",
    "/passport/reset-password?next=https://evil.example",
    "/passport/app/../reset-password",
    "javascript:alert(1)",
  ])
    assert.equal(callbackDestination(value), "/passport/app");
});
test("recovery URL uses the configured origin and rejects unsafe or malformed origins", () => {
  const callback = recoveryCallback("https://preview.example/path?ignored=yes");
  assert.ok(callback);
  const url = new URL(callback);
  assert.equal(url.origin, "https://preview.example");
  assert.equal(url.pathname, "/passport/auth/callback");
  assert.equal(url.searchParams.get("next"), "/passport/reset-password");
  assert.ok(recoveryCallback("http://localhost:3000"));
  for (const value of [
    undefined,
    "",
    "bad url",
    "http://public.example",
    "https://user:secret@example.com",
    "javascript:alert(1)",
  ])
    assert.equal(recoveryCallback(value), null);
});
test("new passwords must match and satisfy the application length limit", () => {
  assert.equal(
    newPasswordSchema.safeParse({
      password: "long-enough",
      confirm_password: "long-enough",
    }).success,
    true,
  );
  assert.equal(
    newPasswordSchema.safeParse({
      password: "long-enough",
      confirm_password: "different-one",
    }).success,
    false,
  );
  assert.equal(
    newPasswordSchema.safeParse({
      password: "short",
      confirm_password: "short",
    }).success,
    false,
  );
  assert.equal(
    newPasswordSchema.safeParse({
      password: "x".repeat(129),
      confirm_password: "x".repeat(129),
    }).success,
    false,
  );
  assert.equal(
    recoveryEmailSchema.parse(" nurse@example.com "),
    "nurse@example.com",
  );
  assert.equal(recoveryEmailSchema.safeParse("invalid").success, false);
});
