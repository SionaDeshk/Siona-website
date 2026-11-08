"use client";
import { useEffect, useId, useState, type ReactNode } from "react";
import { matchesRecord, type FilterItem } from "@/lib/passport/record-filters";
export function RecordFilter({
  label,
  mode,
  items,
  children,
}: {
  label: string;
  mode: "expiry" | "documents" | "search";
  items: FilterItem[];
  children: ReactNode[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const id = useId();
  useEffect(() => {
    // Cross-links should still reach a record hidden by this section's filters.
    const reveal = (target: string) => {
      const item = items.find((item) => `#${item.id}` === target);
      if (!item) return;
      setQuery("");
      setFilter("all");
      requestAnimationFrame(() =>
        document.getElementById(item.id)?.scrollIntoView({ block: "start" }),
      );
    };
    const onHash = () => reveal(window.location.hash);
    const onClick = (event: MouseEvent) => {
      const anchor =
        event.target instanceof Element
          ? event.target.closest('a[href^="#"]')
          : null;
      if (anchor) reveal(anchor.getAttribute("href") || "");
    };
    window.addEventListener("hashchange", onHash);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("hashchange", onHash);
      document.removeEventListener("click", onClick);
    };
  }, [items]);
  const visible = items.map((item) => matchesRecord(item, query, filter));
  const count = visible.filter(Boolean).length;
  if (!items.length) return <>{children}</>;
  return (
    <div className="record-browser">
      <div className="record-controls">
        <label htmlFor={`${id}-search`}>Search {label}</label>
        <input
          id={`${id}-search`}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          maxLength={200}
          aria-describedby={`${id}-count`}
          placeholder="Search your records"
        />
        {mode !== "search" && (
          <>
            <label htmlFor={`${id}-filter`}>
              {mode === "expiry"
                ? "Filter by expiry"
                : "Filter by document link"}
            </label>
            <select
              id={`${id}-filter`}
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              {mode === "expiry" ? (
                <>
                  <option value="all">All expiry dates</option>
                  <option value="expired">Expired</option>
                  <option value="due">Due within 90 days</option>
                  <option value="current">More than 90 days remaining</option>
                  <option value="undated">No expiry recorded</option>
                </>
              ) : (
                <>
                  <option value="all">All documents</option>
                  <option value="linked">Linked to a credential</option>
                  <option value="unlinked">No linked credential</option>
                </>
              )}
            </select>
          </>
        )}
        {(query || filter !== "all") && (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
          >
            Clear filters
          </button>
        )}
      </div>
      <p id={`${id}-count`} aria-live="polite" className="muted">
        Showing {count} of {items.length} {label}. Filters don’t change your
        dashboard totals or PDF export.
      </p>
      {!count && (
        <p className="empty">
          No matching records. Try different words or clear the filters.
        </p>
      )}
      {children.map((child, index) => (
        <div key={items[index].id} hidden={!visible[index]}>
          {child}
        </div>
      ))}
    </div>
  );
}
