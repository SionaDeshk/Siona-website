import { notFound } from "next/navigation";
import { CommerceWorkspace } from "@/components/commerce/workspace";
import { commerceDemo } from "@/lib/commerce/demo";
export default function Preview() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <CommerceWorkspace
      role="admin"
      displayName="Preview operator"
      previewData={commerceDemo()}
    />
  );
}
