import { saveCredential } from "./actions";
type Row = Record<string, string | number | null>;
export function CredentialForm({
  kind,
  row,
}: {
  kind: "licenses" | "ce_entries" | "certifications";
  row?: Row;
}) {
  const fields =
    kind === "licenses"
      ? [
          "jurisdiction",
          "license_type",
          "license_number",
          "issued_on",
          "expires_on",
        ]
      : kind === "ce_entries"
        ? ["title", "provider", "hours", "completed_on", "accreditation"]
        : ["name", "issuer", "issued_on", "expires_on"];
  return (
    <form action={saveCredential} className="credential-form">
      <input type="hidden" name="kind" value={kind} />
      {row && <input type="hidden" name="id" value={String(row.id)} />}
      {fields.map((field) => (
        <label key={field}>
          {field.replaceAll("_", " ")}
          <input
            name={field}
            defaultValue={
              row?.[field] ?? (field === "license_type" ? "RN" : "")
            }
            type={
              field.endsWith("_on")
                ? "date"
                : field === "hours"
                  ? "number"
                  : "text"
            }
            required={[
              "jurisdiction",
              "license_type",
              "title",
              "provider",
              "hours",
              "completed_on",
              "name",
            ].includes(field)}
            maxLength={200}
            min={field === "hours" ? "0.01" : undefined}
            max={field === "hours" ? "1000" : undefined}
            step={field === "hours" ? "0.01" : undefined}
          />
        </label>
      ))}
      {kind === "licenses" && (
        <label>
          Status
          <select name="status" defaultValue={row?.status ?? "self_reported"}>
            <option value="self_reported">Self reported</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
          </select>
        </label>
      )}
      <button>
        Save{" "}
        {kind === "ce_entries"
          ? "learning"
          : kind === "licenses"
            ? "license"
            : "certification"}
      </button>
    </form>
  );
}
