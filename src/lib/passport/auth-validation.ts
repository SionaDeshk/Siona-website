import { z } from "zod";
export const recoveryEmailSchema = z.string().trim().max(254).pipe(z.email());
export const newPasswordSchema = z
  .object({
    password: z.string().min(8).max(128),
    confirm_password: z.string().min(8).max(128),
  })
  .refine((value) => value.password === value.confirm_password, {
    message: "Passwords must match",
    path: ["confirm_password"],
  });
// The callback accepts only these internal destinations, never arbitrary URLs.
export function callbackDestination(next: string | null) {
  return next === "/passport/reset-password" ? next : "/passport/app";
}
export function recoveryCallback(siteUrl: string | undefined) {
  if (!siteUrl) return null;
  try {
    const url = new URL(siteUrl);
    if (
      url.username ||
      url.password ||
      (url.protocol !== "https:" &&
        !(
          url.protocol === "http:" &&
          ["localhost", "127.0.0.1"].includes(url.hostname)
        ))
    )
      return null;
    const callback = new URL("/passport/auth/callback", url.origin);
    callback.searchParams.set("next", "/passport/reset-password");
    return callback.toString();
  } catch {
    return null;
  }
}
