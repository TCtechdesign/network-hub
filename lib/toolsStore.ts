import {
  cloneToolsContent,
  normalizeToolsContent,
  type GuideAssistantSettings,
  type NetworkTool,
  type ToolsContent,
} from "@/data/tools";
import { readFirestoreDocument, writeFirestoreDocument } from "@/lib/firebaseRest";

export const TOOLS_DOCUMENT_PATH = "networkHubContent/tools";

export type ToolsReadResult = {
  content: ToolsContent;
  source: "firebase" | "default";
};

export async function getPublishedToolsContent() {
  try {
    const result = await readToolsContent();

    return result.content;
  } catch (error) {
    console.warn("Using default tools content.", error);

    return cloneToolsContent();
  }
}

export async function getPublishedTools(): Promise<NetworkTool[]> {
  const content = await getPublishedToolsContent();

  return content.tools;
}

export async function getPublishedGuideAssistantSettings(): Promise<GuideAssistantSettings> {
  const content = await getPublishedToolsContent();

  return content.assistant;
}

export async function readToolsContent(
  idToken?: string
): Promise<ToolsReadResult> {
  const document = await readFirestoreDocument<Record<string, unknown>>(
    TOOLS_DOCUMENT_PATH,
    idToken
  );

  if (!document) {
    return {
      content: cloneToolsContent(),
      source: "default",
    };
  }

  return {
    content: normalizeToolsContent(document),
    source: "firebase",
  };
}

export async function saveToolsContent(content: ToolsContent, idToken: string) {
  const nextContent = normalizeToolsContent({
    ...content,
    updatedAt: new Date().toISOString(),
  });

  await writeFirestoreDocument(
    TOOLS_DOCUMENT_PATH,
    nextContent as unknown as Record<string, unknown>,
    idToken
  );

  return nextContent;
}
