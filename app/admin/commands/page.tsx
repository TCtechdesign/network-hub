import { connection } from "next/server";
import CommandsAdmin from "@/components/CommandsAdmin";
import { cloneCommandsContent } from "@/data/commands";
import {
  readCommandsContent,
  type CommandsReadResult,
} from "@/lib/commandsStore";

export default async function CommandsAdminPage() {
  let result: CommandsReadResult;

  await connection();

  try {
    result = await readCommandsContent();
  } catch {
    result = {
      content: cloneCommandsContent(),
      source: "default",
    };
  }

  return (
    <CommandsAdmin
      initialContent={result.content}
      initialSource={result.source}
    />
  );
}
