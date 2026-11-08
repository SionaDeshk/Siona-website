import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  apiError,
  enforceOrigin,
  requireMember,
  AccessError,
} from "@/lib/intelligence/auth";
import { readLimitedBody } from "@/lib/intelligence/body";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const bucket = "intel-supplier-documents";

export async function POST(request: Request) {
  try {
    enforceOrigin(request);
    const { db } = await requireMember(true);
    let body: Uint8Array<ArrayBuffer>;
    try {
      body = await readLimitedBody(request, 4_300_000);
    } catch {
      throw new AccessError(413, "Maximum file size is 4 MB.");
    }
    const form = await new Response(body, {
        headers: { "Content-Type": request.headers.get("content-type") || "" },
      }).formData(),
      file = form.get("file"),
      supplier = z.uuid().parse(form.get("supplier_id"));
    if (!(file instanceof File) || file.size < 1 || file.size > 4_194_304)
      throw new AccessError(
        400,
        "Choose a PDF, PNG, JPEG, or text file, up to 4 MB.",
      );
    const bytes = Buffer.from(await file.arrayBuffer());
    let type: string, extension: string;
    if (bytes.subarray(0, 5).toString() === "%PDF-") {
      type = "application/pdf";
      extension = "pdf";
    } else if (
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ) {
      type = "image/png";
      extension = "png";
    } else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
      type = "image/jpeg";
      extension = "jpg";
    } else if (file.type === "text/plain" && !bytes.includes(0)) {
      new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      type = "text/plain";
      extension = "txt";
    } else
      throw new AccessError(
        400,
        "File contents do not match a supported document type.",
      );
    const path = `${supplier}/${randomUUID()}.${extension}`;
    const upload = await db.storage
      .from(bucket)
      .upload(path, bytes, { contentType: type, upsert: false });
    if (upload.error) throw upload.error;
    const record = await db
      .from("intel_documents")
      .insert({
        supplier_id: supplier,
        name: file.name.replace(/[\r\n<>]/g, "").slice(0, 180),
        storage_path: path,
        content_type: type,
        bytes: file.size,
      });
    if (record.error) {
      await db.storage.from(bucket).remove([path]);
      throw record.error;
    }
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(request: Request) {
  try {
    const { db } = await requireMember();
    const id = z.uuid().parse(new URL(request.url).searchParams.get("id"));
    const record = await db
      .from("intel_documents")
      .select("storage_path,name")
      .eq("id", id)
      .single();
    if (record.error) throw record.error;
    const signed = await db.storage
      .from(bucket)
      .createSignedUrl(record.data.storage_path, 60, {
        download: record.data.name,
      });
    if (signed.error) throw signed.error;
    return Response.redirect(signed.data.signedUrl, 303);
  } catch (error) {
    return apiError(error);
  }
}
