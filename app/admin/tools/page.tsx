import { connection } from "next/server";
import ToolsAdmin from "@/components/ToolsAdmin";
import { cloneToolsContent } from "@/data/tools";
import { readToolsContent, type ToolsReadResult } from "@/lib/toolsStore";

export default async function ToolsAdminPage() {
  let result: ToolsReadResult;

  await connection();

  try {
    result = await readToolsContent();
  } catch {
    result = {
      content: cloneToolsContent(),
      source: "default",
    };
  }

  return (
    <ToolsAdmin
      initialContent={result.content}
      initialSource={result.source}
    />
  );
}
