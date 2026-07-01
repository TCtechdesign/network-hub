import { connection } from "next/server";
import HomepageAdmin from "@/components/HomepageAdmin";
import { cloneHomepageContent } from "@/data/homepage";
import {
  readHomepageContent,
  type HomepageReadResult,
} from "@/lib/homepageStore";

export default async function HomepageAdminPage() {
  let result: HomepageReadResult;

  await connection();

  try {
    result = await readHomepageContent();
  } catch {
    result = {
      content: cloneHomepageContent(),
      source: "default",
    };
  }

  return (
    <HomepageAdmin
      initialContent={result.content}
      initialSource={result.source}
    />
  );
}
