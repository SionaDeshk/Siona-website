// Match the standard Helvetica font's supported export characters. Measure each
// line, including unbroken identifiers, rather than assuming a character width.
export function wrapPdfText(
  value: string,
  width: number,
  measure: (text: string) => number,
) {
  const safe = value.replace(/[^\x20-\x7e]/g, "?");
  const lines: string[] = [];
  let line = "";
  for (const character of safe) {
    if (line && measure(line + character) > width) {
      lines.push(line);
      line = "";
    }
    line += character;
  }
  lines.push(line);
  return lines;
}
