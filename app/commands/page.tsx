import { connection } from "next/server";
import CommandsIndex from "@/components/CommandsIndex";
import { getPublishedCommands } from "@/lib/commandsStore";

export default async function CommandsPage() {
  await connection();

  const commands = await getPublishedCommands();

  return <CommandsIndex commands={commands} />;
}
