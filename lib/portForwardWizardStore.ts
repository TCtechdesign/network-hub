import {
  clonePortForwardWizardContent,
  normalizePortForwardWizardContent,
  type PortForwardWizardContent,
} from "@/data/portForwardWizard";
import { readFirestoreDocument, writeFirestoreDocument } from "@/lib/firebaseRest";

export const PORT_FORWARD_WIZARD_DOCUMENT_PATH =
  "networkHubContent/portForwardWizard";

export type PortForwardWizardReadResult = {
  content: PortForwardWizardContent;
  source: "firebase" | "default";
};

export async function getPublishedPortForwardWizardContent() {
  try {
    const result = await readPortForwardWizardContent();

    return result.content;
  } catch (error) {
    console.warn("Using default Port Forward Wizard content.", error);

    return clonePortForwardWizardContent();
  }
}

export async function readPortForwardWizardContent(
  idToken?: string
): Promise<PortForwardWizardReadResult> {
  const document = await readFirestoreDocument<Record<string, unknown>>(
    PORT_FORWARD_WIZARD_DOCUMENT_PATH,
    idToken
  );

  if (!document) {
    return {
      content: clonePortForwardWizardContent(),
      source: "default",
    };
  }

  return {
    content: normalizePortForwardWizardContent(document),
    source: "firebase",
  };
}

export async function savePortForwardWizardContent(
  content: PortForwardWizardContent,
  idToken: string
) {
  const nextContent = normalizePortForwardWizardContent({
    ...content,
    updatedAt: new Date().toISOString(),
  });

  await writeFirestoreDocument(
    PORT_FORWARD_WIZARD_DOCUMENT_PATH,
    nextContent as unknown as Record<string, unknown>,
    idToken
  );

  return nextContent;
}
