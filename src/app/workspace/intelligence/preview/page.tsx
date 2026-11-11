import { notFound } from "next/navigation";
import Link from "next/link";
import { Workspace } from "@/components/intelligence/workspace";
import { previewData, previewUserId } from "@/lib/intelligence/demo";
import styles from "@/components/intelligence/device-explainer.module.css";
export default function Preview() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <>
      <div className={styles.entry}>
        <Link href="/workspace/intelligence/preview/device-information">
          Open the knee-device information prototype →
        </Link>
      </div>
      <Workspace
        userId={previewUserId}
        role="viewer"
        displayName="Synthetic preview"
        previewData={previewData}
      />
    </>
  );
}
