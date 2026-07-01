"use client";

import { Check } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";

type GuideChecklistItemProps = {
  label: string;
  storageKey: string;
};

const checklistChangeEvent = "guide-checklist-change";

function getCookieName(storageKey: string) {
  return `guideChecklist_${storageKey.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

function readStoredChecked(storageKey: string) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    if (window.localStorage?.getItem(storageKey) === "true") {
      return true;
    }
  } catch {
    // Fall back to cookies below.
  }

  try {
    const cookieName = getCookieName(storageKey);
    const cookie = document.cookie
      .split("; ")
      .find((item) => item.startsWith(`${cookieName}=`));

    return cookie?.split("=")[1] === "true";
  } catch {
    return false;
  }
}

function writeStoredChecked(storageKey: string, checked: boolean) {
  try {
    window.localStorage?.setItem(storageKey, String(checked));
  } catch {
    // Cookies keep the checklist usable when localStorage is unavailable.
  }

  try {
    document.cookie = `${getCookieName(storageKey)}=${String(
      checked
    )}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    // The visual checklist still works even if browser storage is blocked.
  }
}

function subscribeToChecklist(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(checklistChangeEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(checklistChangeEvent, onStoreChange);
  };
}

export default function GuideChecklistItem({
  label,
  storageKey,
}: GuideChecklistItemProps) {
  const getSnapshot = useCallback(
    () => readStoredChecked(storageKey),
    [storageKey]
  );
  const checked = useSyncExternalStore(
    subscribeToChecklist,
    getSnapshot,
    () => false
  );

  function updateChecked(nextChecked: boolean) {
    writeStoredChecked(storageKey, nextChecked);
    window.dispatchEvent(new Event(checklistChangeEvent));
  }

  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-3 transition hover:border-cyan-500/70">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => updateChecked(event.target.checked)}
        className="sr-only"
      />
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
          checked
            ? "border-cyan-400 bg-cyan-400 text-slate-950"
            : "border-blue-500/70 text-transparent"
        }`}
        aria-hidden="true"
      >
        <Check size={14} />
      </span>
      <span
        className={`leading-6 transition ${
          checked ? "text-slate-500 line-through" : "text-slate-300"
        }`}
      >
        {label}
      </span>
    </label>
  );
}
