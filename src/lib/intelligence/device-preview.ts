export const devicePreviewPath =
  "/workspace/intelligence/preview/device-information";

/** Deployment mode comes from server environment, never a URL or request header. */
export function devicePreviewMode(
  nodeEnv: string | undefined,
  vercelEnv: string | undefined,
) {
  if (vercelEnv === "production") return "disabled";
  if (nodeEnv === "development") return "development";
  if (nodeEnv === "production" && vercelEnv === "preview") return "protected";
  return "disabled";
}

/** A fixed destination only: arbitrary return URLs cannot enter the sign-in flow. */
export function isDevicePreviewDestination(
  destination: unknown,
  nodeEnv: string | undefined,
  vercelEnv: string | undefined,
) {
  return (
    destination === "device-preview" &&
    devicePreviewMode(nodeEnv, vercelEnv) === "protected"
  );
}
