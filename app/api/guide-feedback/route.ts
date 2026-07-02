import { NextRequest } from "next/server";
import { createFirestoreDocument } from "@/lib/firebaseRest";

export const runtime = "nodejs";

type GuideFeedbackBody = {
  guideSlug?: unknown;
  path?: unknown;
  vote?: unknown;
};

type GuideFeedbackVote = "helpful" | "not_helpful";

const maxStringLength = 220;

export async function POST(request: NextRequest) {
  let body: GuideFeedbackBody;

  try {
    body = (await request.json()) as GuideFeedbackBody;
  } catch {
    return Response.json(
      { error: "Feedback request must be valid JSON." },
      { status: 400 }
    );
  }

  const guideSlug = normalizeGuideSlug(body.guideSlug);
  const vote = normalizeVote(body.vote);

  if (!guideSlug || !vote) {
    return Response.json(
      { error: "Feedback needs a guide slug and a helpful/not helpful vote." },
      { status: 400 }
    );
  }

  try {
    await createFirestoreDocument("networkHubFeedback", {
      createdAt: new Date().toISOString(),
      guideSlug,
      pagePath: normalizeString(body.path),
      userAgent: normalizeString(request.headers.get("user-agent")),
      vote,
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Feedback could not be saved right now." },
      { status: 500 }
    );
  }
}

function normalizeGuideSlug(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  const slug = value.trim().toLowerCase();

  return /^[a-z0-9-]{1,120}$/.test(slug) ? slug : "";
}

function normalizeVote(value: unknown): GuideFeedbackVote | "" {
  return value === "helpful" || value === "not_helpful" ? value : "";
}

function normalizeString(value: unknown) {
  return typeof value === "string"
    ? value.trim().slice(0, maxStringLength)
    : "";
}
