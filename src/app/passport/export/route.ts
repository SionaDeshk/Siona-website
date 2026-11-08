import { allRecords } from "@/lib/passport/records";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { z } from "zod";
import { authenticated } from "@/lib/passport/server";
import { ceTotal } from "@/lib/passport/validation";
export async function GET(request: Request) {
  const { db, user } = await authenticated();
  const params = new URL(request.url).searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const from = params.get("from") || `${today.slice(0, 4)}-01-01`;
  const to = params.get("to") || today;
  if (
    !z.iso.date().safeParse(from).success ||
    !z.iso.date().safeParse(to).success ||
    from > to
  )
    return new Response("Invalid date range", { status: 400 });
  const results = await Promise.all(
    ["licenses", "ce_entries", "certifications"].map((kind) =>
      allRecords(db, `passport_${kind}`, user.id),
    ),
  );
  if (results.some((r) => r.error))
    return new Response("Export unavailable", { status: 503 });
  const [licenses, ce, certifications] = results.map((r) => r.data || []);
  const filtered = ce.filter(
    (e) => String(e.completed_on) >= from && String(e.completed_on) <= to,
  );
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  let page = pdf.addPage();
  let y = page.getHeight() - 50;
  const line = (value: string) => {
    // Standard PDF font supports ASCII; wrap all user content to avoid clipping.
    const safe = value.replace(/[^\x20-\x7e]/g, "?");
    for (let i = 0; i < Math.max(1, safe.length); i += 88) {
      if (y < 45) {
        page = pdf.addPage();
        y = page.getHeight() - 50;
      }
      page.drawText(safe.slice(i, i + 88), {
        x: 45,
        y,
        size: 11,
        font,
        color: rgb(0.1, 0.2, 0.18),
      });
      y -= 18;
    }
  };
  line("SIONA PASSPORT - SELF-REPORTED CREDENTIAL SUMMARY");
  line(
    `Generated ${today}. Information and documents are NOT verified by Siona.`,
  );
  line("This summary is not proof of licensure or CE eligibility.");
  line("");
  line("LICENSES");
  licenses.forEach((r) =>
    line(
      `${r.jurisdiction} | ${r.license_type} | ${r.license_number || "-"} | Issued ${r.issued_on || "-"} | Expires ${r.expires_on || "-"} | ${r.status}`,
    ),
  );
  line("");
  line(`CONTINUING EDUCATION: ${from} through ${to}`);
  line(
    `Total: ${ceTotal(
      ce.map((e) => ({
        hours: Number(e.hours),
        completed_on: String(e.completed_on),
      })),
      from,
      to,
    ).toFixed(2)} hours. Jurisdiction acceptance must be checked separately.`,
  );
  filtered.forEach((r) =>
    line(
      `${r.title} | ${r.provider} | ${r.hours} hours | ${r.completed_on} | ${r.accreditation || "-"}`,
    ),
  );
  line("");
  line("CERTIFICATIONS");
  certifications.forEach((r) =>
    line(
      `${r.name} | ${r.issuer || "-"} | Issued ${r.issued_on || "-"} | Expires ${r.expires_on || "-"}`,
    ),
  );
  return new Response(Buffer.from(await pdf.save()), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="siona-passport.pdf"',
      "Cache-Control": "private, no-store",
    },
  });
}
