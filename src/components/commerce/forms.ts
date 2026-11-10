import {
  currencies,
  parseMinor,
  type CommerceData,
  type CommerceOperation,
  type CommerceRequest,
} from "@/lib/commerce/model";
import type { OperationsData } from "@/lib/operations/model";
export type Editor = {
  action: CommerceOperation["action"];
  record?: Record<string, unknown>;
  request?: CommerceRequest;
};
export type Field = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: [string, string][];
  value?: string;
};
export const titles: Record<Editor["action"], string> = {
  rfq: "Record supplier quote request",
  quote: "Record quoted terms",
  quote_status: "Review quote publication",
  internal_accept: "Accept for internal coordination",
  handoff: "Record partner handoff",
  lot: "Record shipment lot",
  shipment: "Record shipment progress",
  resolve_issue: "Resolve operational follow-up",
  recall: "Open recall follow-up",
  close_recall: "Close recall follow-up",
  resume: "Resume coordination",
  ready: "Mark request Ready",
  complete: "Record request completion",
};
export function fieldsFor(
  editor: Editor,
  data: CommerceData,
  core: OperationsData,
): Field[] {
  const f = (
    key: string,
    label: string,
    type = "text",
    required = true,
    options?: [string, string][],
    value?: string,
  ): Field => ({ key, label, type, required, options, value });
  const r = editor.request;
  const today = new Date().toISOString().slice(0, 10);
  switch (editor.action) {
    case "rfq":
      return [
        f("reference", "Supplier request reference"),
        f("due_on", "Response requested by", "date"),
        f("notes", "Supplier request / contact record", "textarea"),
      ];
    case "quote":
      return [
        f(
          "rfq_id",
          "Supplier quote request",
          "select",
          true,
          data.rfqs
            .filter((x) => x.request_id === r?.id)
            .map((x) => [x.id, x.reference]),
        ),
        f("supplier_reference", "Original supplier quote reference"),
        f("source_url", "Source quote evidence URL", "url"),
        f(
          "currency",
          "Currency",
          "select",
          true,
          currencies.map((s) => [s, s]),
        ),
        f("unit_minor", "Quoted unit price", "money"),
        f("shipping_minor", "Shipping charge — enter 0 if none", "money"),
        f("tax_minor", "Tax charge — enter 0 if none", "money"),
        f("lead_days", "Quoted lead time in days", "number"),
        f("valid_until", "Quote valid through", "date"),
        f("delivery_terms", "Delivery terms visible to practice", "textarea"),
        f("practice_summary", "Practice-visible quote summary", "textarea"),
        f("internal_notes", "Internal quote notes", "textarea", false),
      ];
    case "quote_status":
      return [
        f(
          "status",
          "Quote status",
          "select",
          true,
          (editor.record?.status === "Draft"
            ? ["Shared", "Withdrawn"]
            : ["Withdrawn"]
          ).map((s) => [s, s]),
        ),
        f(
          "notes",
          "Pricing review / reason (at least 20 characters)",
          "textarea",
        ),
      ];
    case "internal_accept":
      return [
        f(
          "confirmed",
          "I accept these terms for internal coordination",
          "checkbox",
        ),
        f("notes", "Acceptance reasoning", "textarea"),
      ];
    case "handoff":
      return [
        f(
          "quantity",
          "Handoff quantity",
          "number",
          true,
          undefined,
          String(
            Math.max(
              1,
              (r?.quantity || 1) -
                data.shipments
                  .filter(
                    (s) => s.request_id === r?.id && s.status !== "Cancelled",
                  )
                  .reduce((n, s) => n + s.quantity, 0),
            ),
          ),
        ),
        f("partner_reference", "Internal partner handoff reference"),
        f("carrier", "Practice-visible carrier", "text", false),
        f(
          "tracking_reference",
          "Practice-visible tracking reference",
          "text",
          false,
        ),
        f("expected_on", "Expected delivery date", "date"),
        f("notes", "Handoff record / confirmation", "textarea"),
      ];
    case "lot":
      return [
        f("lot_code", "Exact lot identifier"),
        f("expires_on", "Lot expiry", "date"),
        f("quantity", "Lot quantity", "number"),
      ];
    case "shipment": {
      const choices: Record<string, string[]> = {
        Preparing: ["Dispatched", "Exception", "Cancelled"],
        Dispatched: ["Delivered", "Exception"],
        Delivered: ["Exception"],
        Exception: ["Dispatched", "Delivered", "Cancelled"],
        Cancelled: [],
      };
      return [
        f(
          "status",
          "Shipment status",
          "select",
          true,
          (choices[String(editor.record?.status)] || []).map((s) => [s, s]),
        ),
        f("occurred_on", "Observed event date", "date", true, undefined, today),
        f("practice_message", "Practice-visible progress update", "textarea"),
        f("internal_notes", "Internal shipment notes", "textarea", false),
      ];
    }
    case "resolve_issue":
      return [
        f(
          "resolution",
          "Internal resolution (at least 20 characters)",
          "textarea",
        ),
        f("practice_message", "Practice-visible resolution", "textarea"),
      ];
    case "recall":
      return [
        f(
          "supplier_id",
          "Source supplier",
          "select",
          true,
          core.suppliers.map((s) => [
            s.id,
            core.organizations.find((o) => o.id === s.organization_id)
              ?.legal_name || "Supplier record",
          ]),
        ),
        f("lot_code", "Exact affected lot identifier"),
        f("reference", "Recall source reference"),
        f("source_url", "Recall evidence URL", "url"),
        f("reason", "Internal findings (at least 20 characters)", "textarea"),
        f("practice_message", "Practice-visible follow-up message", "textarea"),
      ];
    case "close_recall":
      return [
        f("resolution", "Case resolution (at least 20 characters)", "textarea"),
      ];
    case "resume":
    case "ready":
    case "complete":
      return [f("notes", "Operational review / outcome", "textarea")];
  }
}
export function payloadFromForm(
  editor: Editor,
  form: FormData,
  fields: Field[],
): unknown {
  const payload: Record<string, unknown> = { action: editor.action };
  for (const f of fields) {
    const raw = String(form.get(f.key) || "");
    payload[f.key] =
      f.type === "money"
        ? parseMinor(raw)
        : f.type === "number"
          ? Number(raw)
          : f.type === "checkbox"
            ? form.get(f.key) === "on"
            : raw;
  }
  if (
    ["rfq", "handoff", "ready", "resume", "complete"].includes(editor.action)
  ) {
    payload.request_id = editor.request?.id;
    payload.request_version = editor.request?.version;
  }
  if (editor.action === "quote_status") {
    payload.quote_id = editor.record?.id;
    payload.version = editor.record?.version;
  }
  if (editor.action === "internal_accept") {
    payload.quote_id = editor.record?.id;
    payload.quote_version = editor.record?.version;
    payload.request_version = editor.request?.version;
  }
  if (["lot", "shipment"].includes(editor.action)) {
    payload.shipment_id = editor.record?.id;
    payload.version = editor.record?.version;
  }
  if (editor.action === "resolve_issue") {
    payload.issue_id = editor.record?.id;
    payload.version = editor.record?.version;
  }
  if (editor.action === "close_recall") {
    payload.recall_id = editor.record?.id;
    payload.version = editor.record?.version;
  }
  return payload;
}
