import { connection } from "next/server";
import ToolsIndex from "@/components/ToolsIndex";
import { getPublishedTools } from "@/lib/toolsStore";

export default async function ToolsPage() {
  await connection();

  const tools = await getPublishedTools();

  return <ToolsIndex tools={tools} />;
}
