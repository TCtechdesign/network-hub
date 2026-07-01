"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock3,
  Download,
  Globe2,
  Info,
  Link2,
  Loader2,
  Lock,
  Search,
  Server,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
  XCircle,
} from "lucide-react";
import { FormEvent, useState } from "react";
import SiteNav from "@/components/SiteNav";

type AuditKey = "status" | "ssl" | "dns" | "security" | "links" | "audit";
type Tone = "green" | "blue" | "amber" | "red" | "violet";

type AuditOption = {
  key: AuditKey;
  label: string;
};

type DetailCheck = {
  id: AuditKey;
  title: string;
  description: string;
  status: string;
  tone: Tone;
  details: string[];
};

type Issue = {
  title: string;
  description: string;
  tone: Tone;
};

type BrokenLinkPage = {
  url: string;
  sourcePage: string;
  statusCode: string;
  issue: string;
  suggestion: string;
};

type WebsiteAuditResult = {
  url: string;
  hostname: string;
  ipAddress: string;
  server: string;
  checkedAt: string;
  duration: string;
  statusCode: string;
  sslStatus: string;
  performanceScore: number;
  brokenLinks: number;
  securityStatus: string;
  totalChecks: number;
  passed: number;
  warnings: number;
  errors: number;
  info: number;
  score: number;
  scoreLabel: "Excellent" | "Good" | "Fair" | "Needs Work";
  summary: string;
  details: DetailCheck[];
  issues: Issue[];
  brokenLinkPages: BrokenLinkPage[];
};

type WebsiteAuditResponse = {
  message?: string;
  result?: WebsiteAuditResult;
};

const auditOptions: AuditOption[] = [
  { key: "status", label: "Website Status" },
  { key: "ssl", label: "SSL Checker" },
  { key: "dns", label: "DNS Checker" },
  { key: "security", label: "Security Checker" },
  { key: "links", label: "Broken Link Checker" },
  { key: "audit", label: "Full Website Audit" },
];

const initialSelectedChecks: Record<AuditKey, boolean> = {
  status: true,
  ssl: true,
  dns: true,
  security: true,
  links: true,
  audit: true,
};

const toneClasses: Record<
  Tone,
  { text: string; bg: string; border: string; icon: string }
> = {
  green: {
    text: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    icon: "text-emerald-400",
  },
  blue: {
    text: "text-blue-300",
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
    icon: "text-blue-400",
  },
  amber: {
    text: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    icon: "text-amber-400",
  },
  red: {
    text: "text-red-300",
    bg: "bg-red-500/10",
    border: "border-red-500/25",
    icon: "text-red-400",
  },
  violet: {
    text: "text-violet-300",
    bg: "bg-violet-500/10",
    border: "border-violet-500/25",
    icon: "text-violet-400",
  },
};

export default function WebsiteBugCheckerPage() {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [selectedChecks, setSelectedChecks] = useState(initialSelectedChecks);
  const [result, setResult] = useState<WebsiteAuditResult | null>(null);
  const [expandedCheck, setExpandedCheck] = useState<AuditKey | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  async function runAnalysis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const url = normalizeWebsiteUrl(websiteUrl);

    if (!url) {
      setError("Enter a valid website URL, such as https://example.com.");
      setResult(null);
      return;
    }

    if (!Object.values(selectedChecks).some(Boolean)) {
      setError("Select at least one check before starting the analysis.");
      setResult(null);
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setActionMessage("");
    setExpandedCheck(null);

    try {
      const checks = Object.entries(selectedChecks)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key)
        .join(",");
      const response = await fetch(
        `/api/website-bug-checker?url=${encodeURIComponent(
          url.href
        )}&checks=${encodeURIComponent(checks)}`,
        { cache: "no-store" }
      );
      const data = (await response.json()) as WebsiteAuditResponse;

      if (!response.ok || !data.result) {
        throw new Error(data.message ?? "The website could not be checked.");
      }

      setResult(data.result);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "The website could not be checked."
      );
      setResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  }

  function toggleCheck(key: AuditKey) {
    setSelectedChecks((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function downloadReport() {
    if (!result) {
      return;
    }

    const report = createWebsiteReport(result);
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `network-hub-website-audit-${result.hostname}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setActionMessage("Website audit report downloaded.");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#020817] text-white">
      <SiteNav active="tools" />

      <section className="relative mx-auto max-w-[92rem] px-4 py-8 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[34rem] bg-[radial-gradient(circle_at_18%_12%,rgba(124,58,237,0.18),transparent_34%),radial-gradient(circle_at_84%_18%,rgba(14,165,233,0.14),transparent_32%)]" />

        <div className="relative z-10 flex flex-wrap items-center gap-2 text-sm text-slate-400">
          <Link href="/" className="hover:text-cyan-400">
            Home
          </Link>
          <ChevronRight size={15} />
          <Link href="/tools" className="hover:text-cyan-400">
            Tools
          </Link>
          <ChevronRight size={15} />
          <span>Website Bug Checker</span>
        </div>

        <header className="relative z-10 mt-7 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/15 text-violet-300 shadow-[0_0_40px_rgba(124,58,237,0.18)]">
            <ShieldQuestion size={46} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Website Bug Checker
            </h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-slate-300">
              Comprehensive website analysis and status check.
            </p>
          </div>
        </header>

        <form
          onSubmit={runAnalysis}
          className="relative z-10 mt-8 rounded-lg border border-slate-800 bg-slate-950/70 p-5 shadow-[0_0_70px_rgba(14,165,233,0.07)]"
        >
          <label htmlFor="website-url" className="text-sm font-medium text-slate-200">
            Enter Website URL
          </label>
          <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="relative">
              <Globe2
                className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300"
                size={19}
              />
              <input
                id="website-url"
                type="text"
                value={websiteUrl}
                onChange={(event) => setWebsiteUrl(event.target.value)}
                placeholder="https://example.com"
                className="h-12 w-full rounded-lg border border-slate-800 bg-slate-950 px-12 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isAnalyzing}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isAnalyzing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Search size={18} />
              )}
              {isAnalyzing ? "Analyzing..." : "Start Analysis"}
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {auditOptions.map((option) => (
              <label
                key={option.key}
                className="flex min-h-10 items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/55 px-3 py-2 text-sm text-slate-300"
              >
                <input
                  type="checkbox"
                  checked={selectedChecks[option.key]}
                  onChange={() => toggleCheck(option.key)}
                  className="h-4 w-4 accent-blue-500"
                />
                <span className="min-w-0">{option.label}</span>
              </label>
            ))}
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}
        </form>

        {result ? (
          <div className="relative z-10 mt-8 space-y-7">
            <OverviewSection result={result} />

            <div className="grid gap-7 lg:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.7fr)]">
              <DetailedResults
                checks={result.details}
                expandedCheck={expandedCheck}
                onToggle={setExpandedCheck}
              />
              <WebsitePreview result={result} onDownload={downloadReport} />
            </div>

            <IssuesSection
              issues={result.issues}
              brokenLinkPages={result.brokenLinkPages}
            />
            <SummaryReport result={result} />

            <div className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/70 px-5 py-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <span className="inline-flex items-center gap-2">
                <Info size={17} />
                Results come from a server-side check of the submitted URL and discovered same-site links.
              </span>
              <span>Analysis time: {result.duration}</span>
            </div>

            {actionMessage && (
              <p className="text-sm text-emerald-300">{actionMessage}</p>
            )}
          </div>
        ) : (
          <BlankState />
        )}
      </section>
    </main>
  );
}

function OverviewSection({ result }: { result: WebsiteAuditResult }) {
  const websiteIsUp =
    result.statusCode.startsWith("2") || result.statusCode.startsWith("3");
  const metrics = [
    {
      label: "Website Status",
      value: websiteIsUp ? "Up" : "Review",
      subtext: result.statusCode,
      icon: Globe2,
      tone: websiteIsUp ? ("green" as Tone) : ("amber" as Tone),
    },
    {
      label: "SSL Status",
      value: result.sslStatus,
      subtext: result.sslStatus === "Valid" ? "HTTPS enabled" : "Needs review",
      icon: Lock,
      tone: result.sslStatus === "Valid" ? ("green" as Tone) : ("amber" as Tone),
    },
    {
      label: "Performance",
      value: getPerformanceLabel(result.performanceScore),
      subtext: `${result.performanceScore} / 100`,
      icon: Sparkles,
      tone: "blue" as Tone,
    },
    {
      label: "Broken Links",
      value: String(result.brokenLinks),
      subtext: result.brokenLinks === 0 ? "None found" : "Found",
      icon: Link2,
      tone: result.brokenLinks === 0 ? ("green" as Tone) : ("amber" as Tone),
    },
    {
      label: "Security",
      value: result.securityStatus,
      subtext:
        result.securityStatus === "Good" ? "No critical issues" : "Review headers",
      icon: ShieldCheck,
      tone: result.securityStatus === "Good" ? ("green" as Tone) : ("amber" as Tone),
    },
    {
      label: "Total Checks",
      value: String(result.totalChecks),
      subtext: "Completed",
      icon: ClipboardList,
      tone: "violet" as Tone,
    },
  ];

  return (
    <section>
      <h2 className="text-xl font-semibold">Overview</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const tone = toneClasses[metric.tone];

          return (
            <article
              key={metric.label}
              className="rounded-lg border border-slate-800 bg-slate-950/70 p-5"
            >
              <div className={`text-sm ${tone.text}`}>{metric.label}</div>
              <div className="mt-5 flex items-center gap-4">
                <Icon className={tone.icon} size={34} />
                <div>
                  <p className={`text-2xl font-bold ${tone.text}`}>
                    {metric.value}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">{metric.subtext}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function DetailedResults({
  checks,
  expandedCheck,
  onToggle,
}: {
  checks: DetailCheck[];
  expandedCheck: AuditKey | null;
  onToggle: (key: AuditKey | null) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/70 p-5">
      <h2 className="text-xl font-semibold">Detailed Results</h2>

      <div className="mt-5 overflow-hidden rounded-lg border border-slate-800">
        {checks.map((check) => {
          const isExpanded = expandedCheck === check.id;

          return (
            <div key={check.id} className="border-b border-slate-800 last:border-b-0">
              <button
                type="button"
                onClick={() => onToggle(isExpanded ? null : check.id)}
                className="flex w-full flex-col gap-4 px-4 py-4 text-left transition hover:bg-slate-900/70 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="flex min-w-0 items-start gap-4">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${toneClasses[check.tone].border} ${toneClasses[check.tone].bg}`}
                  >
                    {renderDetailIcon(check.id, toneClasses[check.tone].icon)}
                  </span>
                  <span>
                    <span className="block font-semibold text-slate-100">
                      {check.title}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-400">
                      {check.description}
                    </span>
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-3">
                  <span
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold ${toneClasses[check.tone].border} ${toneClasses[check.tone].bg} ${toneClasses[check.tone].text}`}
                  >
                    {check.status}
                  </span>
                  <ChevronDown
                    className={`text-slate-400 transition ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    size={18}
                  />
                </span>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-800 bg-slate-950/70 px-5 py-4">
                  <ul className="space-y-2 text-sm leading-6 text-slate-300">
                    {check.details.map((detail) => (
                      <li key={detail} className="flex gap-2">
                        <CheckCircle2
                          className="mt-0.5 shrink-0 text-blue-400"
                          size={16}
                        />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function WebsitePreview({
  result,
  onDownload,
}: {
  result: WebsiteAuditResult;
  onDownload: () => void;
}) {
  return (
    <aside className="rounded-lg border border-slate-800 bg-slate-950/70 p-5">
      <h2 className="text-xl font-semibold">Website Snapshot</h2>

      <div className="mt-5 overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
        <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-3">
          <div className="h-3 w-36 rounded-full bg-slate-700" />
        </div>
        <div className="relative min-h-52 bg-[linear-gradient(135deg,rgba(37,99,235,0.2),rgba(15,23,42,0.95)),radial-gradient(circle_at_70%_30%,rgba(34,197,94,0.15),transparent_34%)] p-5">
          <div className="absolute inset-x-5 top-5 flex items-center justify-between">
            <div className="h-3 w-24 rounded-full bg-white/30" />
            <div className="h-3 w-16 rounded-full bg-white/20" />
          </div>
          <div className="absolute inset-x-8 bottom-8 rounded-lg border border-white/15 bg-slate-950/65 p-5 text-center backdrop-blur">
            <p className="text-lg font-semibold">{result.hostname}</p>
            <p className="mt-2 text-sm text-slate-300">{result.summary}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <PreviewRow icon={Globe2} label="URL" value={result.url} />
        <PreviewRow icon={Server} label="IP Address" value={result.ipAddress} />
        <PreviewRow icon={ShieldCheck} label="Server" value={result.server} />
        <PreviewRow icon={Clock3} label="Checked On" value={result.checkedAt} />
      </div>

      <button
        type="button"
        onClick={onDownload}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-blue-500/70 px-4 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/10"
      >
        <Download size={18} />
        Download Report
      </button>
    </aside>
  );
}

function IssuesSection({
  issues,
  brokenLinkPages,
}: {
  issues: Issue[];
  brokenLinkPages: BrokenLinkPage[];
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/70 p-5">
      <div className="flex items-center gap-3">
        <AlertTriangle className="text-amber-300" size={22} />
        <h2 className="text-xl font-semibold">Issues Found</h2>
      </div>

      <div className="mt-5 space-y-4">
        {issues.map((issue) => (
          <article
            key={issue.title}
            className="flex flex-col gap-4 border-b border-slate-800 pb-4 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex gap-3">
              <span
                className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                  issue.tone === "amber" ? "bg-amber-400" : "bg-blue-400"
                }`}
              />
              <div>
                <h3 className="font-semibold text-slate-100">{issue.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  {issue.description}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-semibold ${toneClasses[issue.tone].border} ${toneClasses[issue.tone].bg} ${toneClasses[issue.tone].text}`}
            >
              Review
            </span>
          </article>
        ))}
      </div>

      {brokenLinkPages.length > 0 && (
        <div className="mt-6 rounded-lg border border-amber-500/25 bg-amber-500/5 p-4">
          <div className="flex items-center gap-3">
            <Link2 className="text-amber-300" size={20} />
            <h3 className="font-semibold text-slate-100">Broken Link Pages</h3>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-slate-800">
            <div className="hidden grid-cols-[minmax(0,1.2fr)_9rem_minmax(0,0.8fr)_minmax(0,1fr)] gap-4 border-b border-slate-800 bg-slate-950/80 px-4 py-3 text-xs font-semibold uppercase text-slate-400 md:grid">
              <span>Broken URL</span>
              <span>Status</span>
              <span>Found On</span>
              <span>Suggested Fix</span>
            </div>

            {brokenLinkPages.map((page) => (
              <article
                key={page.url}
                className="grid gap-3 border-b border-slate-800 px-4 py-4 text-sm last:border-b-0 md:grid-cols-[minmax(0,1.2fr)_9rem_minmax(0,0.8fr)_minmax(0,1fr)] md:items-start md:gap-4"
              >
                <div className="min-w-0">
                  <p className="break-words font-medium text-slate-100">
                    {page.url}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{page.issue}</p>
                </div>

                <span className="w-fit rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
                  {page.statusCode}
                </span>

                <p className="text-slate-300">{page.sourcePage}</p>
                <p className="text-slate-400">{page.suggestion}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function SummaryReport({ result }: { result: WebsiteAuditResult }) {
  return (
    <section className="grid gap-6 rounded-lg border border-slate-800 bg-slate-950/70 p-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.65fr)]">
      <div>
        <h2 className="text-xl font-semibold">Summary Report</h2>
        <p className="mt-4 max-w-3xl leading-7 text-slate-300">
          {result.summary}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryStat label="Passed" value={result.passed} tone="green" />
          <SummaryStat label="Warnings" value={result.warnings} tone="amber" />
          <SummaryStat label="Errors" value={result.errors} tone="red" />
          <SummaryStat label="Info" value={result.info} tone="violet" />
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 border-slate-800 lg:border-l">
        <ScoreDonut score={result.score} />
        <div>
          <p className="text-sm text-slate-400">Overall Score</p>
          <p className="mt-1 text-3xl font-bold text-emerald-300">
            {result.scoreLabel}
          </p>
        </div>
      </div>
    </section>
  );
}

function BlankState() {
  return (
    <section className="relative z-10 mt-8 rounded-lg border border-dashed border-slate-700 bg-slate-950/45 px-5 py-14 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300">
        <Search size={30} />
      </div>
      <h2 className="mt-5 text-xl font-semibold">No website analyzed yet</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
        Enter a URL and start the analysis to see website status, SSL, DNS,
        security, broken link, and summary results.
      </p>
    </section>
  );
}

function PreviewRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Globe2;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[1.25rem_7rem_minmax(0,1fr)] items-start gap-3 border-b border-slate-800 pb-3 last:border-b-0">
      <Icon className="text-blue-300" size={17} />
      <span className="text-slate-400">{label}</span>
      <span className="break-words text-slate-200">{value}</span>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: Tone;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
      <div className={`text-sm ${toneClasses[tone].text}`}>{label}</div>
      <div className="mt-3 flex items-center gap-3">
        {tone === "red" ? (
          <XCircle className={toneClasses[tone].icon} size={24} />
        ) : (
          <CheckCircle2 className={toneClasses[tone].icon} size={24} />
        )}
        <span className="text-2xl font-bold">{value}</span>
      </div>
    </div>
  );
}

function ScoreDonut({ score }: { score: number }) {
  return (
    <div
      className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full p-3"
      style={{
        background: `conic-gradient(#22c55e ${score * 3.6}deg, rgba(30,41,59,0.95) 0deg)`,
      }}
    >
      <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-slate-950">
        <span className="text-3xl font-bold">{score}</span>
        <span className="text-xs text-slate-400">Score</span>
      </div>
    </div>
  );
}

function renderDetailIcon(id: AuditKey, className: string) {
  const props = { className, size: 22 };

  if (id === "ssl") {
    return <Lock {...props} />;
  }

  if (id === "dns") {
    return <Server {...props} />;
  }

  if (id === "security") {
    return <ShieldCheck {...props} />;
  }

  if (id === "links") {
    return <Link2 {...props} />;
  }

  if (id === "audit") {
    return <ClipboardList {...props} />;
  }

  return <Globe2 {...props} />;
}

function normalizeWebsiteUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);

    if (!url.hostname.includes(".") || url.hostname.length < 4) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

function createWebsiteReport(result: WebsiteAuditResult) {
  const detailLines = result.details
    .map(
      (detail) =>
        `${detail.title}: ${detail.status}\n${detail.details
          .map((item) => `- ${item}`)
          .join("\n")}`
    )
    .join("\n\n");
  const issueLines = result.issues
    .map((issue) => `- ${issue.title}: ${issue.description}`)
    .join("\n");
  const brokenLinkLines =
    result.brokenLinkPages.length > 0
      ? result.brokenLinkPages
          .map(
            (page) =>
              `- ${page.url} (${page.statusCode}) found on ${page.sourcePage}: ${page.suggestion}`
          )
          .join("\n")
      : "- No broken link pages were flagged.";

  return `Network Hub Website Audit

URL: ${result.url}
Host: ${result.hostname}
Checked: ${result.checkedAt}
Overall Score: ${result.score} (${result.scoreLabel})

Summary:
${result.summary}

Issues:
${issueLines}

Broken Link Pages:
${brokenLinkLines}

Detailed Results:
${detailLines}
`;
}

function getPerformanceLabel(score: number) {
  if (score >= 86) {
    return "Excellent";
  }

  if (score >= 75) {
    return "Good";
  }

  if (score >= 60) {
    return "Fair";
  }

  return "Slow";
}
