import {
  channels,
  productKinds,
  requestStages,
  states,
  transitions,
  type Operation,
  type OperationsData,
} from "@/lib/operations/model";

export type FormAction = Operation["action"];
export type Editor = { action: FormAction; record?: Record<string, unknown> };
export type Field = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: [string, string][];
  value?: string;
};
export const formTitles: Record<FormAction, string> = {
  practice_access: "Practice account access",
  practice_offer: "Publish a practice catalog entry",
  practice_update: "Publish a practice update",
  practice: "Practice details",
  practice_review: "Review practice onboarding",
  product: "Product details",
  eligibility: "Review product eligibility",
  request: "New coordination request",
  transition: "Update coordination",
};
export function fieldsFor(editor: Editor, data: OperationsData): Field[] {
  const field = (
    key: string,
    label: string,
    type = "text",
    required = true,
    options?: [string, string][],
    value?: string,
  ): Field => ({ key, label, type, required, options, value });
  const choices = (values: readonly string[]): [string, string][] =>
    values.map((s) => [s, s]);
  const stateOptions = choices(states);
  switch (editor.action) {
    case "practice_access":
      return [
        field(
          "practice_id",
          "Practice location",
          "select",
          true,
          data.practices.map((p) => [p.id, `${p.legal_name} · ${p.state}`]),
        ),
        field("email", "Existing Auth account email", "email"),
        field("role", "Practice permission", "select", true, [
          ["requester", "Submit and view requests"],
          ["viewer", "View only"],
        ]),
        field("active", "Access status", "select", true, [
          ["true", "Active"],
          ["false", "Disabled"],
        ]),
      ];
    case "practice_offer":
      return [
        field("state", "Publication state", "select", true, stateOptions),
        field("status", "Publication status", "select", true, [
          ["Paused", "Paused"],
          ["Published", "Published"],
        ]),
        field(
          "title",
          "Practice-visible title",
          "text",
          true,
          undefined,
          String(editor.record?.title || editor.record?.name || ""),
        ),
        field(
          "summary",
          "Practice-visible description",
          "textarea",
          true,
          undefined,
          String(editor.record?.summary || ""),
        ),
        field("valid_until", "Publication valid through", "date"),
        field(
          "review_notes",
          "Internal publication review (at least 20 characters)",
          "textarea",
        ),
      ];
    case "practice_update":
      return [
        field(
          "body",
          "Update visible to the practice — business information only",
          "textarea",
        ),
      ];
    case "practice":
      return [
        field("legal_name", "Legal practice name"),
        field("state", "Practice state", "select", true, stateOptions),
        field("business_email", "Operations email", "email"),
        field("website", "Practice website", "url", false),
        field("scope", "Service scope and onboarding requirements", "textarea"),
      ];
    case "practice_review":
      return [
        field(
          "status",
          "Onboarding status",
          "select",
          true,
          choices(["Onboarding", "Ready", "Hold"]),
        ),
        field(
          "evidence_url",
          "Credential / agreement evidence URL",
          "url",
          false,
        ),
        field("valid_until", "Review valid through", "date", false),
        field(
          "notes",
          "Review findings (at least 20 characters)",
          "textarea",
          true,
          undefined,
          String(editor.record?.review_notes || ""),
        ),
      ];
    case "product":
      return [
        field("name", "Product or service name"),
        field("sku", "Internal SKU"),
        field(
          "supplier_id",
          "Supplier from Evo",
          "select",
          true,
          data.suppliers.map((s) => [
            s.id,
            data.organizations.find((o) => o.id === s.organization_id)
              ?.legal_name || "Supplier record",
          ]),
        ),
        field(
          "kind",
          "Product classification",
          "select",
          true,
          choices(productKinds),
        ),
        field("unit", "Request unit (e.g. case of 100)"),
        field("description", "Intended use and product scope", "textarea"),
      ];
    case "eligibility":
      return [
        field("state", "Review state", "select", true, stateOptions),
        field("channel", "Sales channel", "select", true, choices(channels)),
        field(
          "status",
          "Eligibility status",
          "select",
          true,
          choices(["Hold", "Approved"]),
        ),
        field("evidence_url", "Product / channel review evidence URL", "url"),
        field("valid_until", "Review valid through", "date"),
        field(
          "notes",
          "Review findings and permitted scope (at least 20 characters)",
          "textarea",
        ),
      ];
    case "request":
      return [
        field("channel", "Request channel", "select", true, choices(channels)),
        field(
          "practice_id",
          "Practice (clinician channel only)",
          "select",
          false,
          data.practices.map((p) => [p.id, `${p.legal_name} · ${p.state}`]),
        ),
        field(
          "product_id",
          "Product / service",
          "select",
          true,
          data.products.map((p) => [p.id, `${p.name} · ${p.unit}`]),
        ),
        field("state", "Destination state", "select", true, stateOptions),
        field("quantity", "Quantity", "number", true, undefined, "1"),
        field("needed_on", "Requested date", "date"),
        field(
          "notes",
          "Business requirements — no patient details",
          "textarea",
        ),
      ];
    case "transition": {
      const current = String(
        editor.record?.stage,
      ) as (typeof requestStages)[number];
      const next = transitions[current];
      return [
        field("stage", "Next stage", "select", true, choices(next)),
        field(
          "notes",
          "Update / reason (at least 10 characters)",
          "textarea",
          true,
          undefined,
          "",
        ),
        field(
          "handoff_reference",
          "External partner handoff reference",
          "text",
          false,
        ),
        field("lot_reference", "Supply lot reference", "text", false),
        field("lot_expires_on", "Supply lot expiry", "date", false),
      ];
    }
  }
}
export function operationFromForm(
  editor: Editor,
  form: FormData,
  fields: Field[],
  data: OperationsData,
): unknown {
  const payload: Record<string, unknown> = { action: editor.action };
  for (const field of fields)
    payload[field.key] =
      field.type === "number"
        ? Number(form.get(field.key))
        : String(form.get(field.key) ?? "");
  if (editor.action === "practice_access")
    payload.active = payload.active === "true";
  if (editor.action === "practice_offer") {
    payload.product_id = editor.record?.product_id || editor.record?.id;
    payload.product_revision = data.products.find(
      (p) => p.id === payload.product_id,
    )?.revision;
    payload.expected_revision =
      data.practice_offers.find(
        (o) => o.product_id === payload.product_id && o.state === payload.state,
      )?.revision || 0;
  } else if (editor.action === "practice_update") {
    payload.request_id = editor.record?.id;
  } else if (editor.record?.id) {
    if (editor.action === "eligibility") {
      payload.product_id = editor.record.id;
      payload.product_revision = editor.record.revision;
    } else {
      payload.id = editor.record.id;
      payload.version = editor.record.version ?? editor.record.revision;
    }
  }
  if (editor.action === "request")
    payload.practice_id = payload.practice_id || null;
  return payload;
}
