import {
  guides as defaultGuides,
  type Guide,
  type GuideImage,
} from "@/data/guides";
import { readFirestoreDocument, writeFirestoreDocument } from "@/lib/firebaseRest";

export const GUIDES_DOCUMENT_PATH = "networkHubContent/guides";

export type GuidesContent = {
  guides: Guide[];
  updatedAt?: string;
};

export type GuidesReadResult = {
  content: GuidesContent;
  source: "firebase" | "default";
};

export function cloneGuidesContent(
  content: GuidesContent = { guides: defaultGuides }
): GuidesContent {
  return JSON.parse(JSON.stringify(content)) as GuidesContent;
}

export function createGuideSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "network-guide";
}

export async function getPublishedGuides() {
  try {
    const result = await readGuidesContent();

    return result.content.guides;
  } catch (error) {
    console.warn("Using default guides content.", error);

    return cloneGuidesContent().guides;
  }
}

export async function readGuidesContent(
  idToken?: string
): Promise<GuidesReadResult> {
  const document = await readFirestoreDocument<Record<string, unknown>>(
    GUIDES_DOCUMENT_PATH,
    idToken
  );

  if (!document) {
    return {
      content: cloneGuidesContent(),
      source: "default",
    };
  }

  return {
    content: normalizeGuidesContent(document),
    source: "firebase",
  };
}

export async function saveGuidesContent(content: GuidesContent, idToken: string) {
  const nextContent = normalizeGuidesContent({
    ...content,
    updatedAt: new Date().toISOString(),
  });

  await writeFirestoreDocument(
    GUIDES_DOCUMENT_PATH,
    nextContent as unknown as Record<string, unknown>,
    idToken
  );

  return nextContent;
}

export function normalizeGuidesContent(value: unknown): GuidesContent {
  const source = isRecord(value) ? value : {};
  const rawGuides = Array.isArray(source.guides) ? source.guides : [];
  const guides = rawGuides
    .map((guide, index) => normalizeGuide(guide, index))
    .filter(isGuide);

  return {
    guides: guides.length > 0 ? guides : cloneGuidesContent().guides,
    updatedAt: readOptionalString(source.updatedAt),
  };
}

function normalizeGuide(value: unknown, index: number): Guide | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = readString(value.title, `Network Guide ${index + 1}`);

  return {
    slug: createGuideSlug(readString(value.slug, title)),
    title,
    category: readString(value.category, "Troubleshooting"),
    difficulty: readString(value.difficulty, "Beginner"),
    readTime: readString(value.readTime, "5 min"),
    description: readString(value.description, "Network troubleshooting guide."),
    image: normalizeGuideImage(value.image),
    content: readString(value.content, `${title}\n\nAdd guide content here.`),
    createdAt: readOptionalString(value.createdAt),
    updatedAt: readOptionalString(value.updatedAt),
  } satisfies Guide;
}

function normalizeGuideImage(value: unknown): GuideImage | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const src = readOptionalString(value.src);

  if (!src) {
    return undefined;
  }

  return {
    src,
    alt: readString(value.alt, ""),
    caption: readOptionalString(value.caption),
  };
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function readOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isGuide(value: Guide | null): value is Guide {
  return value !== null;
}
