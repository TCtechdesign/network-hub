"use client";

import {
  AlertTriangle,
  CalendarDays,
  ExternalLink,
  Filter,
  Flame,
  RadioTower,
  Search,
  ShieldAlert,
  Siren,
} from "lucide-react";
import { useMemo, useState } from "react";
import SiteNav from "@/components/SiteNav";
import type {
  SecurityAlert,
  SecurityAlertsData,
  SecurityAlertSource,
} from "@/lib/securityAlerts";

type SecurityAlertsDashboardProps = {
  data: SecurityAlertsData;
};

type SourceFilter = "all" | SecurityAlertSource;
type QuickFilter = "all" | "critical" | "known-exploited" | "ransomware-linked";

const allTagsLabel = "All categories";
const utcMonthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function SecurityAlertsDashboard({
  data,
}: SecurityAlertsDashboardProps) {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [tagFilter, setTagFilter] = useState(allTagsLabel);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const tagOptions = useMemo(
    () =>
      [
        allTagsLabel,
        ...Array.from(
          new Set(data.alerts.flatMap((alert) => alert.tags))
        ).sort(),
      ],
    [data.alerts]
  );
  const searchText = search.trim().toLowerCase();
  const filteredAlerts = data.alerts.filter((alert) => {
    const matchesSearch = [
      alert.title,
      alert.cveId,
      alert.affectedProduct,
      alert.description,
      alert.action,
      ...alert.tags,
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchText);
    const matchesSource =
      sourceFilter === "all" || alert.source === sourceFilter;
    const matchesTag =
      tagFilter === allTagsLabel || alert.tags.includes(tagFilter);
    const matchesQuickFilter =
      quickFilter === "all" ||
      (quickFilter === "known-exploited" && alert.source === "cisa-kev") ||
      (quickFilter === "critical" && alert.severity === "critical") ||
      (quickFilter === "ransomware-linked" &&
        alert.ransomwareUse?.toLowerCase() === "known");

    return matchesSearch && matchesSource && matchesTag && matchesQuickFilter;
  });

  function applyQuickFilter(nextFilter: QuickFilter) {
    const isClearing = quickFilter === nextFilter;

    setQuickFilter(isClearing ? "all" : nextFilter);

    if (!isClearing) {
      setSearch("");
      setSourceFilter("all");
      setTagFilter(allTagsLabel);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020817] text-white">
      <SiteNav active="security" />

      <section className="mx-auto max-w-[96rem] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
              <span>Network Hub</span>
              <span className="text-slate-600">/</span>
              <span className="text-cyan-300">Security Alerts</span>
            </div>

            <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase text-amber-300">
                  Threat Watch
                </p>
                <h1 className="mt-2 break-words text-3xl font-bold tracking-tight sm:text-5xl">
                  Security Alerts
                </h1>
                <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
                  Exploited vulnerabilities and recent critical CVEs translated
                  into practical patch priorities.
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/65 px-4 py-3 text-sm text-slate-300">
                <span className="text-slate-500">Updated</span>{" "}
                {formatDateTime(data.fetchedAt)}
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                active={quickFilter === "known-exploited"}
                icon="siren"
                label="Known exploited"
                onClick={() => applyQuickFilter("known-exploited")}
                value={data.summary.knownExploitedCount}
                tone="amber"
              />
              <SummaryCard
                active={quickFilter === "critical"}
                icon="shield"
                label="Critical CVEs"
                onClick={() => applyQuickFilter("critical")}
                value={data.summary.criticalCount}
                tone="red"
              />
              <SummaryCard
                active={quickFilter === "ransomware-linked"}
                icon="flame"
                label="Ransomware linked"
                onClick={() => applyQuickFilter("ransomware-linked")}
                value={data.summary.ransomwareLinkedCount}
                tone="violet"
              />
              <SummaryCard
                active={false}
                icon="radio"
                label="Source issues"
                onClick={() =>
                  document
                    .getElementById("security-source-status")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                value={data.summary.sourceIssueCount}
                tone={data.summary.sourceIssueCount > 0 ? "red" : "emerald"}
              />
            </div>

            {quickFilter !== "all" && (
              <div className="mt-4 flex flex-col gap-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Showing {getQuickFilterLabel(quickFilter).toLowerCase()}.
                </p>
                <button
                  type="button"
                  onClick={() => setQuickFilter("all")}
                  className="inline-flex w-fit items-center rounded-lg border border-cyan-400/50 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/10"
                >
                  Clear quick filter
                </button>
              </div>
            )}

            <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1fr)_12rem_14rem]">
              <label className="relative block">
                <span className="sr-only">Search security alerts</span>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search CVE, product, vendor, or category..."
                  className="h-12 w-full rounded-lg border border-slate-800 bg-slate-950/70 px-11 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
                />
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  size={18}
                />
              </label>

              <label className="relative block">
                <span className="sr-only">Filter by source</span>
                <select
                  value={sourceFilter}
                  onChange={(event) =>
                    setSourceFilter(event.target.value as SourceFilter)
                  }
                  className="h-12 w-full appearance-none rounded-lg border border-slate-800 bg-slate-950/70 px-4 pr-10 text-sm text-slate-200 outline-none transition focus:border-cyan-500"
                >
                  <option value="all">All sources</option>
                  <option value="cisa-kev">CISA KEV</option>
                  <option value="nvd">NVD</option>
                </select>
                <Filter
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                  size={17}
                />
              </label>

              <label className="relative block">
                <span className="sr-only">Filter by category</span>
                <select
                  value={tagFilter}
                  onChange={(event) => setTagFilter(event.target.value)}
                  className="h-12 w-full appearance-none rounded-lg border border-slate-800 bg-slate-950/70 px-4 pr-10 text-sm text-slate-200 outline-none transition focus:border-cyan-500"
                >
                  {tagOptions.map((tag) => (
                    <option key={tag}>{tag}</option>
                  ))}
                </select>
                <Filter
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                  size={17}
                />
              </label>
            </div>

            <div className="mt-8 grid gap-4 xl:grid-cols-2">
              {filteredAlerts.map((alert) => (
                <SecurityAlertCard key={alert.id} alert={alert} />
              ))}
            </div>

            {filteredAlerts.length === 0 && (
              <div className="mt-8 rounded-lg border border-slate-800 bg-slate-950/65 px-5 py-12 text-center">
                <p className="text-lg font-semibold text-slate-200">
                  No alerts found
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Try a different source, category, or search term.
                </p>
              </div>
            )}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <section className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-5">
              <div className="flex items-center gap-3 text-amber-200">
                <AlertTriangle size={21} />
                <h2 className="font-semibold">Patch Priority</h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
                <p>
                  Start with CISA KEV items, internet-facing systems, VPNs,
                  firewalls, browsers, and anything marked ransomware linked.
                </p>
                <p className="text-slate-400">
                  If a patch is not available, reduce exposure, require MFA,
                  and watch logs for unusual authentication or traffic.
                </p>
              </div>
            </section>

            <section
              id="security-source-status"
              className="scroll-mt-24 rounded-lg border border-slate-800 bg-slate-950/65 p-5"
            >
              <h2 className="text-sm font-semibold uppercase text-slate-400">
                Source Status
              </h2>
              <div className="mt-4 space-y-3">
                {data.sourceStatuses.map((status) => (
                  <a
                    key={status.source}
                    href={status.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg border border-slate-800 bg-slate-900/55 p-4 transition hover:border-cyan-500/60"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-100">
                        {status.source}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          status.ok
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-red-500/15 text-red-300"
                        }`}
                      >
                        {status.ok ? "Live" : "Issue"}
                      </span>
                    </span>
                    <span className="mt-2 block text-sm leading-6 text-slate-400">
                      {status.message}
                    </span>
                  </a>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
              <h2 className="text-sm font-semibold uppercase text-slate-400">
                Good Habits
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                <ActionLine text="Patch routers, browsers, VPNs, and exposed servers first." />
                <ActionLine text="Back up configs before changing firewall or server settings." />
                <ActionLine text="Check whether affected products are actually in your network." />
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function SecurityAlertCard({ alert }: { alert: SecurityAlert }) {
  return (
    <article className="min-w-0 overflow-hidden rounded-lg border border-slate-800 bg-slate-950/65 p-4 transition hover:border-cyan-500/60 sm:p-5">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getSeverityClass(
                alert.severity
              )}`}
            >
              {alert.severityLabel}
              {typeof alert.score === "number" ? ` ${alert.score}` : ""}
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">
              {alert.sourceLabel}
            </span>
          </div>

          <h2 className="mt-4 break-words text-xl font-bold text-white">
            {alert.title}
          </h2>
          <p className="mt-2 break-words font-mono text-sm text-cyan-300">
            {alert.cveId}
          </p>
        </div>

        <a
          href={alert.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex max-w-full shrink-0 items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-300"
        >
          Source
          <ExternalLink size={15} />
        </a>
      </div>

      <dl className="mt-5 grid min-w-0 gap-4 text-sm sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-xs font-semibold uppercase text-slate-500">
            Affected
          </dt>
          <dd className="mt-1 break-words text-slate-200">
            {alert.affectedProduct}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-semibold uppercase text-slate-500">
            Published / Added
          </dt>
          <dd className="mt-1 flex items-center gap-2 text-slate-200">
            <CalendarDays size={15} />
            {formatDate(alert.date)}
          </dd>
        </div>
      </dl>

      <p className="mt-5 text-sm leading-6 text-slate-300">
        {alert.description}
      </p>

      <div className="mt-5 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
        <p className="text-xs font-semibold uppercase text-blue-300">
          Recommended action
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-200">{alert.action}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {alert.dueDate && (
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-200">
            Due {formatDate(alert.dueDate)}
          </span>
        )}
        {alert.ransomwareUse?.toLowerCase() === "known" && (
          <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-200">
            Ransomware linked
          </span>
        )}
        {alert.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-800/80 px-3 py-1 text-xs text-slate-300"
          >
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}

function SummaryCard({
  active,
  icon,
  label,
  onClick,
  tone,
  value,
}: {
  active: boolean;
  icon: "flame" | "radio" | "shield" | "siren";
  label: string;
  onClick: () => void;
  tone: "amber" | "emerald" | "red" | "violet";
  value: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-lg border p-5 text-left transition hover:border-cyan-500/70 focus:border-cyan-500 focus:outline-none ${
        active
          ? "border-cyan-500/70 bg-cyan-500/10"
          : "border-slate-800 bg-slate-950/65"
      }`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-lg ${getSummaryIconClass(
          tone
        )}`}
      >
        {renderSummaryIcon(icon)}
      </div>
      <p className="mt-4 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </button>
  );
}

function ActionLine({ text }: { text: string }) {
  return (
    <p className="flex gap-3">
      <ShieldAlert className="mt-0.5 shrink-0 text-cyan-300" size={17} />
      <span>{text}</span>
    </p>
  );
}

function renderSummaryIcon(icon: "flame" | "radio" | "shield" | "siren") {
  if (icon === "flame") {
    return <Flame size={22} />;
  }

  if (icon === "radio") {
    return <RadioTower size={22} />;
  }

  if (icon === "shield") {
    return <ShieldAlert size={22} />;
  }

  return <Siren size={22} />;
}

function getSeverityClass(severity: SecurityAlert["severity"]) {
  if (severity === "known-exploited") {
    return "border-amber-400/40 bg-amber-500/15 text-amber-200";
  }

  if (severity === "critical") {
    return "border-red-400/40 bg-red-500/15 text-red-200";
  }

  return "border-orange-400/40 bg-orange-500/15 text-orange-200";
}

function getSummaryIconClass(tone: "amber" | "emerald" | "red" | "violet") {
  if (tone === "amber") {
    return "border border-amber-400/40 bg-amber-500/15 text-amber-200";
  }

  if (tone === "emerald") {
    return "border border-emerald-400/40 bg-emerald-500/15 text-emerald-200";
  }

  if (tone === "violet") {
    return "border border-violet-400/40 bg-violet-500/15 text-violet-200";
  }

  return "border border-red-400/40 bg-red-500/15 text-red-200";
}

function getQuickFilterLabel(filter: QuickFilter) {
  if (filter === "known-exploited") {
    return "Known exploited alerts";
  }

  if (filter === "critical") {
    return "Critical CVEs";
  }

  if (filter === "ransomware-linked") {
    return "Ransomware linked alerts";
  }

  return "All alerts";
}

function formatDate(value: string) {
  const date = new Date(value);

  if (date.getUTCFullYear() <= 1970 || Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return `${utcMonthNames[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  const hour = date.getUTCHours();
  const displayHour = hour % 12 || 12;
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const meridiem = hour >= 12 ? "PM" : "AM";

  return `${formatDate(value)}, ${displayHour}:${minutes} ${meridiem} UTC`;
}
