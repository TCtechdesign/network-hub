import { connection } from "next/server";
import PortForwardWizardAdmin from "@/components/PortForwardWizardAdmin";
import { clonePortForwardWizardContent } from "@/data/portForwardWizard";
import {
  readPortForwardWizardContent,
  type PortForwardWizardReadResult,
} from "@/lib/portForwardWizardStore";

export default async function PortForwardWizardAdminPage() {
  let result: PortForwardWizardReadResult;

  await connection();

  try {
    result = await readPortForwardWizardContent();
  } catch {
    result = {
      content: clonePortForwardWizardContent(),
      source: "default",
    };
  }

  return (
    <PortForwardWizardAdmin
      initialContent={result.content}
      initialSource={result.source}
    />
  );
}
