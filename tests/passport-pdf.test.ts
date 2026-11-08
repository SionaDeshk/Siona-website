import assert from "node:assert/strict";
import { test } from "node:test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { wrapPdfText } from "../src/lib/passport/pdf-text";
test("PDF wraps wide characters and unbroken identifiers within the printable area", async () => {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const measure = (text: string) => font.widthOfTextAtSize(text, 11);
  const original = "W".repeat(200) + " - " + "i".repeat(200);
  const lines = wrapPdfText(original, 505, measure);
  assert.ok(lines.length > 1);
  assert.equal(lines.join(""), original);
  assert.ok(lines.every((line) => measure(line) <= 505));
  assert.deepEqual(wrapPdfText("", 505, measure), [""]);
  assert.deepEqual(wrapPdfText("Nurse ☀", 505, measure), ["Nurse ?"]);
});
