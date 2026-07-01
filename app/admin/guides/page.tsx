import { connection } from "next/server";
import GuidesAdmin from "@/components/GuidesAdmin";
import { cloneGuidesContent, readGuidesContent, type GuidesReadResult } from "@/lib/guidesStore";

export default async function GuidesAdminPage() {
  let result: GuidesReadResult;

  await connection();

  try {
    result = await readGuidesContent();
  } catch {
    result = {
      content: cloneGuidesContent(),
      source: "default",
    };
  }

  return (
    <GuidesAdmin
      initialContent={result.content}
      initialSource={result.source}
    />
  );
}
