export function validSignupIntent(
  value: unknown,
): value is "student" | "organization_manager" | "both" {
  return (
    value === "student" ||
    value === "organization_manager" ||
    value === "both"
  );
}
