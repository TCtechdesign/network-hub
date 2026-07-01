import { connection } from "next/server";
import GuidesIndex from "@/components/GuidesIndex";
import { getPublishedGuides } from "@/lib/guidesStore";
import { getPublishedGuideAssistantSettings } from "@/lib/toolsStore";

export default async function GuidesPage() {
  await connection();

  const [guides, assistantSettings] = await Promise.all([
    getPublishedGuides(),
    getPublishedGuideAssistantSettings(),
  ]);

  return <GuidesIndex guides={guides} assistantSettings={assistantSettings} />;
}
