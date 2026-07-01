import {
  cloneHomepageContent,
  normalizeHomepageContent,
  type HomepageContent,
} from "@/data/homepage";
import { readFirestoreDocument, writeFirestoreDocument } from "@/lib/firebaseRest";

export const HOMEPAGE_DOCUMENT_PATH = "networkHubContent/homepage";

export type HomepageReadResult = {
  content: HomepageContent;
  source: "firebase" | "default";
};

export async function getPublishedHomepageContent() {
  try {
    const result = await readHomepageContent();

    return result.content;
  } catch (error) {
    console.warn("Using default homepage content.", error);

    return cloneHomepageContent();
  }
}

export async function readHomepageContent(
  idToken?: string
): Promise<HomepageReadResult> {
  const document = await readFirestoreDocument<Record<string, unknown>>(
    HOMEPAGE_DOCUMENT_PATH,
    idToken
  );

  if (!document) {
    return {
      content: cloneHomepageContent(),
      source: "default",
    };
  }

  return {
    content: normalizeHomepageContent(document),
    source: "firebase",
  };
}

export async function saveHomepageContent(
  content: HomepageContent,
  idToken: string
) {
  const nextContent = normalizeHomepageContent({
    ...content,
    updatedAt: new Date().toISOString(),
  });

  await writeFirestoreDocument(
    HOMEPAGE_DOCUMENT_PATH,
    nextContent as unknown as Record<string, unknown>,
    idToken
  );

  return nextContent;
}
