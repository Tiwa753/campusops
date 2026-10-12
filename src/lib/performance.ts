// Field targets apply at the 75th percentile. Browser tests collect a local lab baseline.
export const performanceBudgets = {
  lcpMs: 2500,
  inpMs: 200,
  cls: 0.1,
  initialJavaScriptBytes: 350 * 1024,
} as const;
export type VitalSample = { name: string; value: number; rating: string };
