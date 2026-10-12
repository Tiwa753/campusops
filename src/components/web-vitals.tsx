"use client";

import { useReportWebVitals } from "next/web-vitals";
import type { VitalSample } from "@/lib/performance";

const report: Parameters<typeof useReportWebVitals>[0] = (metric) => {
  const detail: VitalSample = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
  };
  // Local instrumentation hook. No URLs, account identifiers, or network requests.
  window.dispatchEvent(new CustomEvent("campusops:web-vital", { detail }));
};
export default function WebVitals() {
  useReportWebVitals(report);
  return null;
}
