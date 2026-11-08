"use client";
import { useState } from "react";
import {
  textValue as v,
  type Row,
  type WorkspaceData,
} from "@/lib/intelligence/model";
import styles from "./workspace.module.css";

export function Network({
  opportunity,
  data,
  onSelect,
}: {
  opportunity: Row;
  data: WorkspaceData;
  onSelect: (row: Row) => void;
}) {
  const [filter, setFilter] = useState("All");
  const nodes: { kind: string; row: Row; label: string }[] = [];
  for (const evidence of data.evidence.filter(
    (e) => e.opportunity_id === opportunity.id,
  )) {
    const row = data.signals.find((s) => s.id === evidence.signal_id);
    if (row) nodes.push({ kind: "Signal", row, label: v(row, "title") });
  }
  for (const link of data.links.filter(
    (l) => l.opportunity_id === opportunity.id,
  )) {
    const supplier = data.suppliers.find((s) => s.id === link.supplier_id);
    const organization = data.organizations.find(
      (o) => o.id === (supplier?.organization_id || link.organization_id),
    );
    if (supplier)
      nodes.push({
        kind: "Supplier",
        row: { ...supplier, title: v(organization, "legal_name") },
        label: v(organization, "legal_name"),
      });
    else if (organization)
      nodes.push({
        kind: "Organization",
        row: organization,
        label: v(organization, "legal_name"),
      });
  }
  for (const row of data.decisions.filter(
    (d) => d.opportunity_id === opportunity.id,
  ))
    nodes.push({ kind: "Decision", row, label: `→ ${v(row, "stage")}` });
  for (const row of data.tasks.filter(
    (t) => t.opportunity_id === opportunity.id,
  ))
    nodes.push({ kind: "Action", row, label: v(row, "title") });
  const shown = nodes.filter((n) => filter === "All" || n.kind === filter);
  return (
    <>
      <div className={styles.networkFilters} aria-label="Filter connections">
        {[
          "All",
          "Signal",
          "Supplier",
          "Organization",
          "Decision",
          "Action",
        ].map((kind) => (
          <button
            key={kind}
            aria-pressed={filter === kind}
            onClick={() => setFilter(kind)}
          >
            {kind}
          </button>
        ))}
      </div>
      <svg
        viewBox="0 0 900 430"
        className={styles.network}
        role="group"
        aria-label="Interactive opportunity network"
      >
        <defs>
          <radialGradient id="network-halo">
            <stop stopColor="#2461bd" stopOpacity=".18" />
            <stop offset="1" stopColor="#2461bd" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse
          cx="450"
          cy="215"
          rx="360"
          ry="210"
          fill="url(#network-halo)"
        />
        {shown.slice(0, 12).map((node, i, all) => {
          const angle =
              (i / Math.max(all.length, 1)) * Math.PI * 2 - Math.PI / 2,
            x = 450 + Math.cos(angle) * 310,
            y = 215 + Math.sin(angle) * 160;
          return (
            <g key={`${node.kind}-${node.row.id}`}>
              <path
                d={`M450 215 Q${(450 + x) / 2} ${y} ${x} ${y}`}
                fill="none"
                stroke="#385675"
                strokeWidth="1"
              />
              <g
                role="button"
                tabIndex={0}
                aria-label={`Inspect ${node.kind}: ${node.label}`}
                onClick={() => onSelect(node.row)}
                onKeyDown={(e) => {
                  if (["Enter", " "].includes(e.key)) {
                    e.preventDefault();
                    onSelect(node.row);
                  }
                }}
                className={styles.networkNode}
              >
                <rect
                  x={x - 100}
                  y={y - 27}
                  width="200"
                  height="54"
                  rx="5"
                  fill="#131e2b"
                  stroke="#536d8d"
                />
                <text
                  x={x}
                  y={y - 6}
                  textAnchor="middle"
                  fill="#8ab8e6"
                  fontSize="9"
                >
                  {node.kind.toUpperCase()}
                </text>
                <text
                  x={x}
                  y={y + 13}
                  textAnchor="middle"
                  fill="#e2ebf6"
                  fontSize="11"
                >
                  {node.label.length > 29
                    ? node.label.slice(0, 27) + "…"
                    : node.label}
                </text>
              </g>
            </g>
          );
        })}
        <g
          role="button"
          tabIndex={0}
          className={styles.networkNode}
          aria-label="Inspect selected opportunity"
          onClick={() => onSelect(opportunity)}
          onKeyDown={(e) => {
            if (["Enter", " "].includes(e.key)) {
              e.preventDefault();
              onSelect(opportunity);
            }
          }}
        >
          <rect
            x="340"
            y="183"
            width="220"
            height="64"
            rx="5"
            fill="#132e4c"
            stroke="#6baff2"
          />
          <text x="450" y="207" textAnchor="middle" fill="#8fc8ff" fontSize="9">
            OPPORTUNITY
          </text>
          <text x="450" y="227" textAnchor="middle" fill="#fff" fontSize="12">
            {v(opportunity, "title").slice(0, 27)}
          </text>
        </g>
      </svg>
      <ul className={styles.connectionList}>
        {shown.map((node) => (
          <li key={`${node.kind}-${node.row.id}`}>
            <button onClick={() => onSelect(node.row)}>
              <span>{node.kind}</span>
              {node.label} →
            </button>
          </li>
        ))}
      </ul>
      {!shown.length && (
        <p>
          No connections of this type yet. Link source-backed signals,
          suppliers, organizations, decisions, and validation tasks.
        </p>
      )}
    </>
  );
}
