"use client";

import { type ReactNode, useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";

type FeedbackVote = "helpful" | "not_helpful";
type FeedbackStatus = "idle" | "saving" | "saved" | "error";

type GuideFeedbackProps = {
  className?: string;
  guideSlug: string;
};

export default function GuideFeedback({
  className = "",
  guideSlug,
}: GuideFeedbackProps) {
  const [selectedVote, setSelectedVote] = useState<FeedbackVote | null>(null);
  const [status, setStatus] = useState<FeedbackStatus>("idle");
  const [message, setMessage] = useState("Your feedback helps us improve.");

  async function submitFeedback(vote: FeedbackVote) {
    setSelectedVote(vote);
    setStatus("saving");
    setMessage("Saving feedback...");

    try {
      const response = await fetch("/api/guide-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guideSlug,
          path: window.location.pathname,
          vote,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        throw new Error(data?.error ?? "Feedback could not be saved.");
      }

      setStatus("saved");
      setMessage("Thanks. Your feedback was saved.");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Feedback could not be saved."
      );
    }
  }

  return (
    <section
      className={`rounded-lg border border-slate-800 bg-slate-900/45 p-5 ${className}`}
    >
      <h2 className="text-slate-300">Was this guide helpful?</h2>

      <div className="mt-4 flex gap-3">
        <FeedbackButton
          disabled={status === "saving"}
          isSelected={selectedVote === "helpful"}
          label="Yes, this guide was helpful"
          onClick={() => submitFeedback("helpful")}
          status={status}
        >
          <ThumbsUp size={20} />
        </FeedbackButton>

        <FeedbackButton
          disabled={status === "saving"}
          isSelected={selectedVote === "not_helpful"}
          label="No, this guide was not helpful"
          onClick={() => submitFeedback("not_helpful")}
          status={status}
        >
          <ThumbsDown size={20} />
        </FeedbackButton>
      </div>

      <p
        className={`mt-4 text-sm ${
          status === "error"
            ? "text-red-300"
            : status === "saved"
              ? "text-emerald-300"
              : "text-slate-400"
        }`}
      >
        {message}
      </p>
    </section>
  );
}

function FeedbackButton({
  children,
  disabled,
  isSelected,
  label,
  onClick,
  status,
}: {
  children: ReactNode;
  disabled: boolean;
  isSelected: boolean;
  label: string;
  onClick: () => void;
  status: FeedbackStatus;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isSelected}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border p-3 transition disabled:cursor-wait disabled:opacity-70 ${
        isSelected && status !== "error"
          ? "border-cyan-500 bg-cyan-500/15 text-cyan-300"
          : "border-slate-800 bg-slate-950/70 text-slate-300 hover:border-cyan-500 hover:text-cyan-400"
      }`}
    >
      {children}
    </button>
  );
}
