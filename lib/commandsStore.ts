import {
  cloneCommandsContent,
  normalizeCommandsContent,
  type CommandsContent,
} from "@/data/commands";
import { readFirestoreDocument, writeFirestoreDocument } from "@/lib/firebaseRest";

export const COMMANDS_DOCUMENT_PATH = "networkHubContent/commands";

export type CommandsReadResult = {
  content: CommandsContent;
  source: "firebase" | "default";
};

export async function getPublishedCommands() {
  try {
    const result = await readCommandsContent();

    return result.content.commands;
  } catch (error) {
    console.warn("Using default commands content.", error);

    return cloneCommandsContent().commands;
  }
}

export async function readCommandsContent(
  idToken?: string
): Promise<CommandsReadResult> {
  const document = await readFirestoreDocument<Record<string, unknown>>(
    COMMANDS_DOCUMENT_PATH,
    idToken
  );

  if (!document) {
    return {
      content: cloneCommandsContent(),
      source: "default",
    };
  }

  return {
    content: normalizeCommandsContent(document),
    source: "firebase",
  };
}

export async function saveCommandsContent(
  content: CommandsContent,
  idToken: string
) {
  const nextContent = normalizeCommandsContent({
    ...content,
    updatedAt: new Date().toISOString(),
  });

  await writeFirestoreDocument(
    COMMANDS_DOCUMENT_PATH,
    nextContent as unknown as Record<string, unknown>,
    idToken
  );

  return nextContent;
}
