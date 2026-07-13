"use client";

import { Cookie } from "lucide-react";
import { useSyncExternalStore } from "react";

const consentCookieName = "networkHubCookieConsent";
const consentChangeEvent = "network-hub-cookie-consent-change";
const consentMaxAge = 60 * 60 * 24 * 365;

type ConsentChoice = "accepted" | "declined";
type ConsentStatus = ConsentChoice | "unset";

function getStoredConsent() {
  if (typeof document === "undefined") {
    return undefined;
  }

  const consentCookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${consentCookieName}=`));

  return consentCookie?.split("=")[1] as ConsentChoice | undefined;
}

function getConsentSnapshot(): ConsentStatus {
  const storedConsent = getStoredConsent();

  return storedConsent === "accepted" || storedConsent === "declined"
    ? storedConsent
    : "unset";
}

function getServerConsentSnapshot(): ConsentStatus {
  return "accepted";
}

function subscribeToConsent(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(consentChangeEvent, onStoreChange);

  return () => {
    window.removeEventListener(consentChangeEvent, onStoreChange);
  };
}

function storeConsent(choice: ConsentChoice) {
  const secureFlag =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";

  document.cookie = `${consentCookieName}=${choice}; path=/; max-age=${consentMaxAge}; SameSite=Lax${secureFlag}`;
}

export default function CookieBanner() {
  const consentStatus = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    getServerConsentSnapshot
  );

  function handleConsent(choice: ConsentChoice) {
    storeConsent(choice);
    window.dispatchEvent(new Event(consentChangeEvent));
  }

  if (consentStatus !== "unset") {
    return null;
  }

  return (
    <section
      aria-labelledby="cookie-banner-title"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-5 rounded-lg border border-cyan-400/30 bg-slate-950/95 p-5 text-white shadow-[0_18px_60px_rgba(0,0,0,0.45),0_0_35px_rgba(6,182,212,0.12)] backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300">
            <Cookie size={22} aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h2
              id="cookie-banner-title"
              className="text-base font-semibold text-white"
            >
              Cookie preferences
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Network Hub uses first-party cookies and local storage to remember
              choices like guide progress and tool preferences.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:justify-end">
          <button
            type="button"
            className="inline-flex h-11 min-w-[8rem] items-center justify-center rounded-lg border border-slate-700 px-4 text-sm font-semibold text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            onClick={() => handleConsent("declined")}
          >
            Decline
          </button>
          <button
            type="button"
            className="inline-flex h-11 min-w-[8rem] items-center justify-center rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950"
            onClick={() => handleConsent("accepted")}
          >
            Accept
          </button>
        </div>
      </div>
    </section>
  );
}
