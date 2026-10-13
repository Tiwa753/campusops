import type { Metadata } from "next";
import AccountDeletionConfirmation from "@/components/account-deletion-confirmation";

export const metadata: Metadata = {
  title: "Confirm account deletion · CampusOps",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function AccountDeletionPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <AccountDeletionConfirmation token={token ?? ""} />;
}
