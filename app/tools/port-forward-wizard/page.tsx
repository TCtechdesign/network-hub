import { connection } from "next/server";
import PortForwardWizard from "@/components/PortForwardWizard";
import { getPublishedPortForwardWizardContent } from "@/lib/portForwardWizardStore";

export default async function PortForwardWizardPage() {
  await connection();

  const content = await getPublishedPortForwardWizardContent();

  return <PortForwardWizard content={content} />;
}
