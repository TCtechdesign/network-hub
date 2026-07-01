"use client";

import { Check, Clipboard } from "lucide-react";
import { useEffect, useState } from "react";

type CopyCommandButtonProps = {
  className?: string;
  showLabel?: boolean;
  text: string;
};

export default function CopyCommandButton({
  className = "",
  showLabel = true,
  text,
}: CopyCommandButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (status === "idle") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setStatus("idle");
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [status]);

  function copyWithTextarea() {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.top = "0";
    textarea.style.left = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (!copied) {
      throw new Error("Copy failed");
    }
  }

  async function copyCommand() {
    try {
      let copied = false;

      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          copied = true;
        } catch {
          copied = false;
        }
      }

      if (!copied) {
        copyWithTextarea();
      }

      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  const Icon = status === "copied" ? Check : Clipboard;
  const label = status === "copied" ? "Copied" : status === "error" ? "Try again" : "Copy";

  return (
    <button
      type="button"
      onClick={copyCommand}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 text-sm transition hover:border-cyan-500 ${
        showLabel ? "min-w-[6.5rem] px-4 py-2" : "h-10 w-10"
      } ${className}`}
      aria-label={`Copy ${text}`}
      title={label}
    >
      <Icon size={16} />
      {showLabel ? label : <span className="sr-only">{label}</span>}
    </button>
  );
}
