import { notFound } from "next/navigation";
import { Workspace } from "@/components/intelligence/workspace";
import { previewData, previewUserId } from "@/lib/intelligence/demo";
export default function Preview() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Workspace
      userId={previewUserId}
      role="viewer"
      displayName="Synthetic preview"
      previewData={previewData}
    />
  );
}
