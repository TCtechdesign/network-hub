import type { Metadata } from "next";
import { connection } from "next/server";
import SecurityAlertsDashboard from "@/components/SecurityAlertsDashboard";
import { getSecurityAlertsData } from "@/lib/securityAlerts";

export const metadata: Metadata = {
  title: "Security Alerts | NETWORK HUB",
  description:
    "Latest known exploited vulnerabilities and recent critical CVEs with practical patch guidance.",
};

export default async function SecurityAlertsPage() {
  await connection();

  const data = await getSecurityAlertsData();

  return <SecurityAlertsDashboard data={data} />;
}
