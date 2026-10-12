"use client";

import { exportCsv } from "@/lib/domain";

export function download(rows: (string | number)[][], filename: string) {
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + exportCsv(rows)], { type: "text/csv;charset=utf-8;" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="tabs" aria-label="Filter records">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          aria-pressed={value === tab.value}
          className={value === tab.value ? "selected" : ""}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
          {tab.count !== undefined && <span>{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}
