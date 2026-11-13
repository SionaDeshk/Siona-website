import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { DeviceExplainer } from "@/components/intelligence/device-explainer";
import { AccessError, requireMember } from "@/lib/intelligence/auth";
import { devicePreviewMode } from "@/lib/intelligence/device-preview";

export const metadata: Metadata = {
  title: "Knee replacement, explained — Siona Device Guide",
};

export default async function DeviceInformationPreview() {
  const mode = devicePreviewMode(process.env.NODE_ENV, process.env.VERCEL_ENV);
  if (mode === "disabled") notFound();
  if (mode === "protected") {
    try {
      await requireMember();
    } catch (error) {
      if (!(error instanceof AccessError)) throw error;
      if (error.status === 401)
        redirect("/workspace/login?preview=device-information");
      if (error.status === 403) notFound();
      // A missing connection/schema must never turn off the membership gate.
      return (
        <main
          id="main"
          style={{ padding: "48px", maxWidth: "700px", margin: "auto" }}
        >
          <h1>Preview connection unavailable</h1>
          <p>
            This preview needs the existing workspace authentication
            configuration. Restore its Preview connection settings; do not
            repeat database or administrator setup.
          </p>
        </main>
      );
    }
  }
  return <DeviceExplainer hostedPreview={mode === "protected"} />;
}
