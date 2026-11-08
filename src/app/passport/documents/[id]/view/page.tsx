import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { authenticated } from "@/lib/passport/server";
import { idSchema, ownsPath } from "@/lib/passport/validation";
export const dynamic = "force-dynamic";
export default async function DocumentPreview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { db, user } = await authenticated();
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const { data: document } = await db
    .from("passport_documents")
    .select("storage_path,original_filename,mime_type")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!document || !ownsPath(user.id, document.storage_path)) notFound();
  const supported = ["application/pdf", "image/png", "image/jpeg"].includes(
    document.mime_type,
  );
  const result = supported
    ? await db.storage
        .from("passport-private")
        .createSignedUrl(document.storage_path, 60)
    : null;
  const url = result?.data?.signedUrl;
  return (
    <main id="main" className="passport-shell">
      <Link href={`/passport/app#document-${id}`}>
        ← Back to credential vault
      </Link>
      <section className="passport-card preview-card">
        <h1>Document preview</h1>
        <h2>{document.original_filename}</h2>
        <p>
          Private, self-reported document. This preview is not verified by
          Siona. Access expires after 60 seconds; refresh the preview if it
          stops loading.
        </p>
        {url ? (
          document.mime_type === "application/pdf" ? (
            <iframe
              src={url}
              title={`PDF preview: ${document.original_filename}`}
              referrerPolicy="no-referrer"
              className="document-preview"
            />
          ) : (
            <Image
              src={url}
              alt={`Preview of ${document.original_filename}`}
              width={1200}
              height={1200}
              unoptimized
              referrerPolicy="no-referrer"
              className="document-image"
            />
          )
        ) : (
          <p role="status" className="notice">
            Preview unavailable. Try refreshing or downloading your document.
          </p>
        )}
        <div className="preview-actions">
          <a href={`/passport/documents/${id}/view`}>Refresh preview</a>
          <a href={`/passport/documents/${id}`}>Download privately</a>
          {url && (
            <a href={url} target="_blank" rel="noreferrer">
              Open temporary preview in a new tab ↗
            </a>
          )}
        </div>
        <small>
          If your browser cannot display PDFs here, use the download link.
          Anyone possessing a temporary preview URL can access it until it
          expires; do not share it.
        </small>
      </section>
    </main>
  );
}
