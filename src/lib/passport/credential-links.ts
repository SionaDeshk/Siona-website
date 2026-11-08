export type PassportRow = Record<string, string | number | null>;
export type CredentialOption = { value: string; label: string; href: string };
const kinds = ["licenses", "ce_entries", "certifications"] as const;
const linkFields = ["license_id", "ce_entry_id", "certification_id"] as const;
export function credentialOptions(rows: PassportRow[][]): CredentialOption[] {
  return kinds.flatMap((kind, index) =>
    (rows[index] || []).map((row) => ({
      value: `${kind}:${row.id}`,
      label:
        index === 0
          ? `License · ${row.jurisdiction} ${row.license_type}${row.license_number ? ` · ${row.license_number}` : ""}`
          : index === 1
            ? `CE · ${row.title} · ${row.completed_on}`
            : `Certification · ${row.name}${row.issuer ? ` · ${row.issuer}` : ""}`,
      href: `#credential-${row.id}`,
    })),
  );
}
export function documentCredentialKey(document: PassportRow) {
  const index = linkFields.findIndex((field) => Boolean(document[field]));
  return index < 0 ? null : `${kinds[index]}:${document[linkFields[index]]}`;
}
export function groupLinkedDocuments(documents: PassportRow[]) {
  const grouped = new Map<string, PassportRow[]>();
  for (const document of documents) {
    const key = documentCredentialKey(document);
    if (key) grouped.set(key, [...(grouped.get(key) || []), document]);
  }
  return grouped;
}
