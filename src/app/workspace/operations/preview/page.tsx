import { notFound } from "next/navigation";
import { OperationsWorkspace } from "@/components/operations/workspace";
import { demoData } from "@/lib/operations/demo";
export default function Preview() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <OperationsWorkspace
      role="admin"
      displayName="Preview operator"
      previewData={demoData()}
    />
  );
}
