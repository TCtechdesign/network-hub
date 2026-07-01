"use client";

import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  FileText,
  Info,
  LineChart,
  ShieldCheck,
  Terminal,
  Trash2,
  Upload,
  Zap,
} from "lucide-react";
import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import SiteNav from "@/components/SiteNav";

type PingStatus = "reply" | "timeout" | "unreachable";

type PingSample = {
  sequence: number;
  latency: number | null;
  status: PingStatus;
  host?: string;
  ttl?: number;
  bytes?: number;
  raw: string;
};

type SummaryStats = {
  sent?: number;
  received?: number;
  lost?: number;
  min?: number;
  avg?: number;
  max?: number;
  jitter?: number;
  target?: string;
};

type PingBucket = {
  label: string;
  count: number;
  percent: number;
  color: string;
  description: string;
};

type PingAnalysis = {
  fileName: string;
  fileSize: string;
  analyzedAt: string;
  formatLabel: string;
  target: string;
  totalPings: number;
  received: number;
  lost: number;
  packetLossPercent: number;
  average: number;
  minimum: number;
  maximum: number;
  jitter: number;
  samples: PingSample[];
  buckets: PingBucket[];
  assessment: "Excellent" | "Good" | "Fair" | "Poor";
  assessmentText: string;
  strengths: string[];
  issues: string[];
  recommendations: string[];
  learningNotes: {
    title: string;
    description: string;
  }[];
  parserNote: string;
};

type FileSummary = {
  name: string;
  size: string;
  type: string;
};

const maxFileSizeBytes = 8 * 1024 * 1024;
const latencyBucketTemplates = [
  {
    label: "0 - 20 ms",
    max: 20,
    color: "#22c55e",
    description: "Excellent for gaming, calls, and remote work.",
  },
  {
    label: "20 - 50 ms",
    max: 50,
    color: "#3b82f6",
    description: "Good for most everyday network activity.",
  },
  {
    label: "50 - 100 ms",
    max: 100,
    color: "#f59e0b",
    description: "Usable, but delays may be noticeable.",
  },
  {
    label: "100+ ms",
    max: Number.POSITIVE_INFINITY,
    color: "#f43f5e",
    description: "High latency. Check Wi-Fi, routing, or congestion.",
  },
];

export default function PingTestAnalyzerPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<PingAnalysis | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  const selectedFileSummary = useMemo<FileSummary | null>(() => {
    if (!selectedFile) {
      return null;
    }

    return {
      name: selectedFile.name,
      size: formatBytes(selectedFile.size),
      type: getFileTypeLabel(selectedFile.name),
    };
  }, [selectedFile]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      await loadPingFile(file);
    }
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      await loadPingFile(file);
    }
  }

  async function loadPingFile(file: File) {
    if (file.size > maxFileSizeBytes) {
      setError("Upload a ping results file smaller than 8 MB.");
      return;
    }

    try {
      const text = await file.text();
      const nextAnalysis = analyzePingResults(text, file);

      if (nextAnalysis.totalPings === 0) {
        setError(
          "I could not find ping replies, timeouts, or summary stats in that file."
        );
        setSelectedFile(file);
        setAnalysis(null);
        return;
      }

      setSelectedFile(file);
      setAnalysis(nextAnalysis);
      setError("");
    } catch {
      setError("The file could not be read. Try a text, log, CSV, or JSON export.");
    }
  }

  function clearFile() {
    setSelectedFile(null);
    setAnalysis(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#020817] text-white">
      <SiteNav active="tools" />

      <section className="relative mx-auto max-w-[92rem] px-4 py-8 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[36rem] bg-[radial-gradient(circle_at_50%_18%,rgba(14,165,233,0.12),transparent_58%)]" />

        <div className="relative z-10 flex flex-wrap items-center gap-2 text-sm text-slate-400">
          <Link href="/" className="hover:text-cyan-400">
            Home
          </Link>
          <ChevronRight size={15} />
          <Link href="/tools" className="hover:text-cyan-400">
            Tools
          </Link>
          <ChevronRight size={15} />
          <span>Ping Test Analyzer</span>
        </div>

        <header className="relative z-10 mx-auto mt-8 max-w-3xl text-center">
          <div className="flex items-center justify-center gap-3">
            <Zap className="text-cyan-400" size={34} />
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Ping Test Analyzer
            </h1>
          </div>
          <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">
            Upload ping results and we will analyze latency, packet loss,
            jitter, stability, and what the numbers mean.
          </p>
        </header>

        <section className="relative z-10 mx-auto mt-8 grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-4">
            <div
              role="button"
              tabIndex={0}
              onClick={openFilePicker}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  openFilePicker();
                }
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(event) => void handleDrop(event)}
              className={`flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center transition ${
                isDragging
                  ? "border-cyan-400 bg-cyan-500/10"
                  : "border-slate-700 bg-slate-950/55 hover:border-cyan-400 hover:bg-cyan-500/5"
              }`}
            >
              <span className="flex h-20 w-20 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-300">
                <Upload size={42} />
              </span>
              <h2 className="mt-5 text-lg font-semibold">
                Upload Ping Results File
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                Drag and drop your file here, or click to browse.
              </p>
              <p className="mt-3 text-sm text-slate-400">
                Supports .txt, .log, .csv, .json, .md, .out, and pasted terminal exports.
              </p>
              <p className="mt-1 text-xs text-slate-500">Max file size: 8 MB</p>
              <button
                type="button"
                className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Choose File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={(event) => void handleFileInput(event)}
                className="sr-only"
              />
            </div>

            <div className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-950/65 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 shrink-0 text-blue-400" size={22} />
                <div>
                  <h2 className="font-semibold">Not sure how to get ping results?</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Run a ping command in your terminal, save the output, then
                    upload it here. Windows, macOS, Linux, MTR, WinMTR, and
                    PingPlotter-style exports are supported.
                  </p>
                </div>
              </div>
              <Link
                href="/guides/How-to-Use-Ping-to-Test-Connectivity"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-cyan-500/70 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/10"
              >
                View Guide
                <ChevronRight size={16} />
              </Link>
            </div>

            {selectedFileSummary && (
              <SelectedFileCard
                file={selectedFileSummary}
                analysis={analysis}
                onClear={clearFile}
              />
            )}
          </div>

          <aside className="space-y-4">
            <InfoCard
              icon={FileText}
              title="Supported Formats"
              tone="blue"
              items={[
                "Windows ping command output",
                "macOS and Linux ping output",
                "CSV exports with latency, avg, min, max, or packet loss columns",
                "JSON arrays or objects containing latency or time values",
                "MTR, WinMTR, and PingPlotter summary exports",
              ]}
            />
            <InfoCard
              icon={Terminal}
              title="Examples It Can Read"
              tone="cyan"
              items={[
                "ping 8.8.8.8",
                "ping -c 100 google.com",
                "ping -n 100 example.com",
                "mtr report tables",
                "CSV rows like sequence, latency_ms, status",
              ]}
            />
            <InfoCard
              icon={CircleHelp}
              title="How It Works"
              tone="emerald"
              items={[
                "Upload your ping results file",
                "The browser parses replies, timeouts, and summaries locally",
                "You get latency, packet loss, jitter, and student-friendly notes",
              ]}
            />
          </aside>
        </section>

        {error && (
          <p className="relative z-10 mx-auto mt-5 max-w-6xl rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {error}
          </p>
        )}

        <section className="relative z-10 mx-auto mt-6 max-w-7xl rounded-lg border border-slate-800 bg-slate-950/65 p-4 shadow-[0_0_70px_rgba(14,165,233,0.06)] sm:p-5">
          {analysis ? <AnalysisResults analysis={analysis} /> : <BlankResults />}
        </section>
      </section>
    </main>
  );
}

function InfoCard({
  icon: Icon,
  title,
  tone,
  items,
}: {
  icon: typeof FileText;
  title: string;
  tone: "blue" | "cyan" | "emerald";
  items: string[];
}) {
  const toneClass = {
    blue: "text-blue-300",
    cyan: "text-cyan-300",
    emerald: "text-emerald-300",
  }[tone];

  return (
    <article className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
      <div className="flex items-center gap-3">
        <Icon className={toneClass} size={22} />
        <h2 className="font-semibold">{title}</h2>
      </div>
      <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-400">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckCircle2 className="mt-1 shrink-0 text-blue-400" size={14} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function SelectedFileCard({
  file,
  analysis,
  onClear,
}: {
  file: FileSummary;
  analysis: PingAnalysis | null;
  onClear: () => void;
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
            <FileText size={22} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-100">{file.name}</p>
            <p className="mt-1 text-sm text-slate-400">
              {file.size} · {file.type}
              {analysis ? ` · ${analysis.totalPings} ping records found` : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-800 px-4 text-sm text-slate-300 transition hover:border-red-500/60 hover:text-red-300"
        >
          <Trash2 size={17} />
          Remove
        </button>
      </div>
    </section>
  );
}

function BlankResults() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-4 py-14 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-slate-400">
        <BarChart3 size={32} />
      </span>
      <h2 className="mt-5 text-xl font-semibold">Analysis results are blank</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
        Upload a ping results file to populate latency, packet loss, jitter,
        distribution, timeline, and recommendations.
      </p>
    </div>
  );
}

function AnalysisResults({ analysis }: { analysis: PingAnalysis }) {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <LineChart className="text-blue-400" size={24} />
            <h2 className="text-xl font-semibold">Analysis Results</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Target: <span className="text-slate-200">{analysis.target}</span> ·
            Format: <span className="text-slate-200">{analysis.formatLabel}</span>
          </p>
        </div>
        <p className="rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-300 sm:max-w-md">
          {analysis.parserNote}
        </p>
      </div>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Average"
          value={formatMetric(analysis.average)}
          unit="ms"
          caption="Average response time"
          tone="emerald"
        />
        <MetricCard
          label="Minimum"
          value={formatMetric(analysis.minimum)}
          unit="ms"
          caption="Fastest reply"
          tone="blue"
        />
        <MetricCard
          label="Maximum"
          value={formatMetric(analysis.maximum)}
          unit="ms"
          caption="Slowest reply"
          tone="red"
        />
        <MetricCard
          label="Packet Loss"
          value={formatMetric(analysis.packetLossPercent)}
          unit="%"
          caption={`${analysis.lost} / ${analysis.totalPings} packets lost`}
          tone="blue"
        />
        <MetricCard
          label="Jitter"
          value={formatMetric(analysis.jitter)}
          unit="ms"
          caption="Response time variation"
          tone="amber"
        />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.9fr)]">
        <TimelineChart samples={analysis.samples} />
        <DistributionChart buckets={analysis.buckets} total={analysis.received} />
      </section>

      <section className="mt-5 grid gap-4 rounded-lg border border-slate-800 bg-slate-900/35 p-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)]">
        <AssessmentCard analysis={analysis} />
        <InsightList title="Strengths" tone="emerald" items={analysis.strengths} />
        <InsightList title="Issues" tone="amber" items={analysis.issues} />
        <InsightList title="Recommendations" tone="blue" items={analysis.recommendations} />
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-3">
        {analysis.learningNotes.map((note) => (
          <article
            key={note.title}
            className="rounded-lg border border-slate-800 bg-slate-950/55 p-4"
          >
            <h3 className="font-semibold text-slate-100">{note.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {note.description}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-5 overflow-hidden rounded-lg border border-slate-800 bg-slate-950/55">
        <div className="flex flex-col gap-3 border-b border-slate-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold">Parsed Ping Samples</h2>
          <p className="text-sm text-slate-400">
            Showing first {Math.min(analysis.samples.length, 12)} records
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="text-slate-300">
              <tr className="border-b border-slate-800">
                {["Seq", "Status", "Latency", "Host", "TTL", "Original line"].map(
                  (column) => (
                    <th key={column} className="px-4 py-3 font-semibold">
                      {column}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {analysis.samples.slice(0, 12).map((sample) => (
                <tr key={`${sample.sequence}-${sample.raw}`}>
                  <td className="px-4 py-3 text-slate-300">{sample.sequence}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={sample.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-200">
                    {sample.latency === null ? "-" : `${formatMetric(sample.latency)} ms`}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{sample.host ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-300">{sample.ttl ?? "-"}</td>
                  <td className="max-w-[24rem] px-4 py-3 text-slate-400">
                    <span className="line-clamp-2">{sample.raw}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="mt-5 flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/55 px-4 py-3 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span>
          File: {analysis.fileName} · Analyzed: {analysis.analyzedAt} · Total
          Pings: {analysis.totalPings}
        </span>
        <span className="flex items-center gap-2">
          <ShieldCheck size={16} />
          File parsing happens locally in your browser.
        </span>
      </footer>
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  caption,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  caption: string;
  tone: "emerald" | "blue" | "red" | "amber";
}) {
  const toneClass = {
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    blue: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    red: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  }[tone];

  return (
    <article className="min-w-0 rounded-lg border border-slate-800 bg-slate-950/55 p-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${toneClass}`}>
          <Zap size={21} />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-1 truncate text-2xl font-bold text-slate-100">
            {value}
            <span className="ml-1 text-sm font-semibold text-inherit">{unit}</span>
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-400">{caption}</p>
    </article>
  );
}

function TimelineChart({ samples }: { samples: PingSample[] }) {
  const replySamples = samples.filter((sample) => sample.latency !== null);
  const maxLatency = Math.max(100, ...replySamples.map((sample) => sample.latency ?? 0));
  const points = replySamples
    .slice(0, 200)
    .map((sample, index, visibleSamples) => {
      const x = visibleSamples.length <= 1 ? 0 : (index / (visibleSamples.length - 1)) * 100;
      const y = 100 - ((sample.latency ?? 0) / maxLatency) * 100;

      return `${x},${Math.max(0, Math.min(100, y))}`;
    })
    .join(" ");

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/55 p-5">
      <h2 className="font-semibold">Response Time Over Time</h2>
      <p className="mt-2 text-sm text-slate-400">
        Spikes show moments where replies got slower.
      </p>
      <div className="mt-5 h-64 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        {replySamples.length > 0 ? (
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="h-full w-full overflow-visible"
            role="img"
            aria-label="Ping response time chart"
          >
            {[0, 25, 50, 75, 100].map((line) => (
              <line
                key={line}
                x1="0"
                x2="100"
                y1={line}
                y2={line}
                stroke="rgba(148,163,184,0.14)"
                strokeWidth="0.35"
              />
            ))}
            <polyline
              fill="none"
              stroke="#22d3ee"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.2"
              points={points}
            />
          </svg>
        ) : (
          <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">
            No individual latency samples were found. Summary stats can still
            be analyzed when present.
          </div>
        )}
      </div>
      <div className="mt-3 flex justify-between text-xs text-slate-500">
        <span>First reply</span>
        <span>Max scale: {formatMetric(maxLatency)} ms</span>
        <span>Latest reply</span>
      </div>
    </section>
  );
}

function DistributionChart({
  buckets,
  total,
}: {
  buckets: PingBucket[];
  total: number;
}) {
  const chartStyle = {
    background: `conic-gradient(${buckets
      .reduce(
        (segments, bucket) => {
          const start = segments.total;
          const end = start + bucket.percent;

          segments.parts.push(`${bucket.color} ${start}% ${end}%`);
          segments.total = end;

          return segments;
        },
        { total: 0, parts: [] as string[] }
      )
      .parts.join(", ")})`,
  };

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/55 p-5">
      <h2 className="font-semibold">Response Time Distribution</h2>
      <p className="mt-2 text-sm text-slate-400">
        This groups replies by latency range.
      </p>
      <div className="mt-5 grid gap-5 sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-center">
        <div
          className="relative mx-auto flex h-44 w-44 items-center justify-center rounded-full"
          style={chartStyle}
          aria-label="Response time distribution chart"
        >
          <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-[#020817] text-center">
            <span className="text-2xl font-bold">{total}</span>
            <span className="text-xs text-slate-400">Replies</span>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          {buckets.map((bucket) => (
            <div key={bucket.label}>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-slate-300">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: bucket.color }}
                  />
                  {bucket.label}
                </span>
                <span className="text-slate-200">
                  {bucket.count} ({bucket.percent.toFixed(0)}%)
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {bucket.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AssessmentCard({ analysis }: { analysis: PingAnalysis }) {
  const toneClass = {
    Excellent: "text-emerald-300",
    Good: "text-emerald-300",
    Fair: "text-amber-300",
    Poor: "text-rose-300",
  }[analysis.assessment];

  return (
    <article className="flex gap-4">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
        <ShieldCheck size={30} />
      </span>
      <div>
        <h2 className="font-semibold">Overall Assessment</h2>
        <p className={`mt-2 text-2xl font-bold ${toneClass}`}>
          {analysis.assessment}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {analysis.assessmentText}
        </p>
      </div>
    </article>
  );
}

function InsightList({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "emerald" | "amber" | "blue";
  items: string[];
}) {
  const Icon = tone === "amber" ? AlertTriangle : tone === "blue" ? Info : CheckCircle2;
  const toneClass = {
    emerald: "text-emerald-300",
    amber: "text-amber-300",
    blue: "text-blue-300",
  }[tone];

  return (
    <article>
      <div className="flex items-center gap-2">
        <Icon className={toneClass} size={17} />
        <h2 className="font-semibold">{title}</h2>
      </div>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-400">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${tone === "amber" ? "bg-amber-300" : tone === "blue" ? "bg-blue-300" : "bg-emerald-300"}`} />
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

function StatusBadge({ status }: { status: PingStatus }) {
  const className = {
    reply: "bg-emerald-500/15 text-emerald-300",
    timeout: "bg-amber-500/15 text-amber-300",
    unreachable: "bg-rose-500/15 text-rose-300",
  }[status];

  return (
    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${className}`}>
      {status}
    </span>
  );
}

function analyzePingResults(text: string, file: File): PingAnalysis {
  const normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalizedText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const summary = extractSummaryStats(lines);
  const jsonSamples = parseJsonSamples(normalizedText);
  const csvSamples = jsonSamples.length > 0 ? [] : parseDelimitedSamples(lines);
  const textSamples =
    jsonSamples.length > 0 || csvSamples.length > 0 ? [] : parseTextSamples(lines);
  const samples = normalizeSequences(
    jsonSamples.length > 0 ? jsonSamples : csvSamples.length > 0 ? csvSamples : textSamples
  );
  const replyLatencies = samples
    .map((sample) => sample.latency)
    .filter((latency): latency is number => latency !== null);
  const received = summary.received ?? replyLatencies.length;
  const detectedLosses = samples.filter((sample) => sample.status !== "reply").length;
  const totalPings = Math.max(
    summary.sent ?? 0,
    samples.length,
    (summary.received ?? 0) + (summary.lost ?? 0),
    received + detectedLosses
  );
  const lost = Math.max(summary.lost ?? totalPings - received, detectedLosses, 0);
  const packetLossPercent =
    totalPings > 0
      ? summary.sent && summary.lost !== undefined
        ? (summary.lost / summary.sent) * 100
        : (lost / totalPings) * 100
      : 0;
  const minimum = summary.min ?? min(replyLatencies);
  const average = summary.avg ?? averageOf(replyLatencies);
  const maximum = summary.max ?? max(replyLatencies);
  const jitter = summary.jitter ?? standardDeviation(replyLatencies);
  const formatLabel = getFormatLabel(normalizedText, lines, jsonSamples, csvSamples);
  const target = summary.target ?? detectTarget(lines, samples) ?? "Unknown target";
  const buckets = buildLatencyBuckets(replyLatencies);
  const assessment = classifyPing(average, packetLossPercent, jitter, maximum);

  return {
    fileName: file.name,
    fileSize: formatBytes(file.size),
    analyzedAt: formatDateTime(new Date()),
    formatLabel,
    target,
    totalPings,
    received,
    lost,
    packetLossPercent,
    average,
    minimum,
    maximum,
    jitter,
    samples,
    buckets,
    assessment,
    assessmentText: getAssessmentText(assessment, average, packetLossPercent, jitter),
    strengths: buildStrengths(average, packetLossPercent, jitter),
    issues: buildIssues(average, packetLossPercent, jitter, maximum, lost),
    recommendations: buildRecommendations(average, packetLossPercent, jitter, lost),
    learningNotes: buildLearningNotes(average, packetLossPercent, jitter, maximum),
    parserNote: buildParserNote(samples, summary, formatLabel),
  };
}

function extractSummaryStats(lines: string[]): SummaryStats {
  const stats: SummaryStats = {};

  lines.forEach((line) => {
    const windowsPackets = line.match(
      /Packets:\s*Sent\s*=\s*(\d+),\s*Received\s*=\s*(\d+),\s*Lost\s*=\s*(\d+)/i
    );
    const unixPackets = line.match(
      /(\d+)\s+packets transmitted,\s*(\d+)\s+(?:packets\s+)?received.*?([\d.]+)%\s*packet loss/i
    );
    const windowsStats = line.match(
      /Minimum\s*=\s*([\d.]+)ms,\s*Maximum\s*=\s*([\d.]+)ms,\s*Average\s*=\s*([\d.]+)ms/i
    );
    const unixStats = line.match(
      /(?:round-trip|rtt).*=\s*([\d.]+)\/([\d.]+)\/([\d.]+)\/([\d.]+)\s*ms/i
    );
    const pingingTarget = line.match(/Pinging\s+([^\s\[]+)(?:\s+\[([^\]]+)])?/i);
    const unixTarget = line.match(/^PING\s+([^\s(]+)(?:\s+\(([^)]+)\))?/i);

    if (windowsPackets) {
      stats.sent = Number(windowsPackets[1]);
      stats.received = Number(windowsPackets[2]);
      stats.lost = Number(windowsPackets[3]);
    }

    if (unixPackets) {
      stats.sent = Number(unixPackets[1]);
      stats.received = Number(unixPackets[2]);
      stats.lost = Math.max(
        0,
        Math.round((Number(unixPackets[3]) / 100) * Number(unixPackets[1]))
      );
    }

    if (windowsStats) {
      stats.min = Number(windowsStats[1]);
      stats.max = Number(windowsStats[2]);
      stats.avg = Number(windowsStats[3]);
    }

    if (unixStats) {
      stats.min = Number(unixStats[1]);
      stats.avg = Number(unixStats[2]);
      stats.max = Number(unixStats[3]);
      stats.jitter = Number(unixStats[4]);
    }

    if (pingingTarget) {
      stats.target = pingingTarget[2] ?? pingingTarget[1];
    }

    if (unixTarget) {
      stats.target = unixTarget[2] ?? unixTarget[1];
    }
  });

  return stats;
}

function parseJsonSamples(text: string): PingSample[] {
  const trimmed = text.trim();

  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return [];
  }

  try {
    const value = JSON.parse(trimmed) as unknown;
    const records = flattenJsonRecords(value);

    return records.flatMap((record, index) => {
      const latency = getRecordNumber(record, [
        "latency",
        "latency_ms",
        "time",
        "time_ms",
        "rtt",
        "avg",
        "average",
      ]);
      const statusValue = String(
        record.status ?? record.result ?? record.state ?? ""
      ).toLowerCase();
      const lost =
        statusValue.includes("timeout") ||
        statusValue.includes("lost") ||
        statusValue.includes("unreachable") ||
        record.lost === true;

      if (latency === null && !lost) {
        return [];
      }

      return [
        {
          sequence: getRecordNumber(record, ["sequence", "seq", "icmp_seq"]) ?? index + 1,
          latency,
          status: latency === null ? "timeout" : "reply",
          host: getRecordString(record, ["host", "ip", "target", "destination"]),
          ttl: getRecordNumber(record, ["ttl"]) ?? undefined,
          raw: JSON.stringify(record),
        },
      ];
    });
  } catch {
    return [];
  }
}

function flattenJsonRecords(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.flatMap(flattenJsonRecords);
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const nested = ["samples", "pings", "results", "rows", "data"]
      .flatMap((key) => flattenJsonRecords(record[key]))
      .filter((item) => Object.keys(item).length > 0);

    return nested.length > 0 ? nested : [record];
  }

  return [];
}

function parseDelimitedSamples(lines: string[]): PingSample[] {
  if (lines.length < 2) {
    return [];
  }

  const delimiter = detectDelimiter(lines[0]);

  if (!delimiter) {
    return parseMtrRows(lines);
  }

  const headers = splitDelimitedLine(lines[0], delimiter).map((header) =>
    normalizeHeader(header)
  );
  const hasUsefulHeader = headers.some((header) =>
    ["latency", "latencyms", "time", "timems", "rtt", "avg", "average", "loss", "losspercent", "packetloss"].includes(header)
  );

  if (!hasUsefulHeader) {
    return parseMtrRows(lines);
  }

  return lines.slice(1).flatMap((line, index) => {
    const cells = splitDelimitedLine(line, delimiter);
    const record = Object.fromEntries(
      headers.map((header, headerIndex) => [header, cells[headerIndex] ?? ""])
    );
    const latency = firstNumberFromHeaders(record, [
      "latencyms",
      "latency",
      "timems",
      "rtt",
      "last",
      "cur",
      "avg",
      "average",
      "time",
    ]);
    const loss = firstNumberFromHeaders(record, [
      "losspercent",
      "packetloss",
      "loss",
      "pl",
      "plpercent",
    ]);
    const status = String(record.status ?? record.result ?? "").toLowerCase();
    const isLost =
      status.includes("timeout") ||
      status.includes("lost") ||
      status.includes("unreachable") ||
      (loss !== null && loss >= 100);

    if (latency === null && !isLost) {
      return [];
    }

    return [
      {
        sequence: numberFromText(record.seq ?? record.sequence ?? record.icmpseq ?? "") ?? index + 1,
        latency,
        status: latency === null ? "timeout" : "reply",
        host: String(record.host ?? record.target ?? record.destination ?? record.ip ?? "") || undefined,
        ttl: numberFromText(record.ttl ?? "") ?? undefined,
        raw: line,
      },
    ];
  });
}

function parseTextSamples(lines: string[]): PingSample[] {
  const samples: PingSample[] = [];

  lines.forEach((line) => {
    const reply = parseReplyLine(line, samples.length + 1);

    if (reply) {
      samples.push(reply);
      return;
    }

    const timeout = parseTimeoutLine(line, samples.length + 1);

    if (timeout) {
      samples.push(timeout);
    }
  });

  return samples.length > 0 ? samples : parseMtrRows(lines);
}

function parseReplyLine(line: string, fallbackSequence: number): PingSample | null {
  const timeLessThanOne = /time\s*<\s*1\s*ms/i.test(line);
  const latencyMatch = line.match(/time[=<]\s*([\d.]+)\s*ms/i);
  const alternateLatency = line.match(/\b(?:rtt|latency|avg|last|cur)\s*[=:]\s*([\d.]+)\s*ms?/i);
  const latency = timeLessThanOne
    ? 0.5
    : latencyMatch
      ? Number(latencyMatch[1])
      : alternateLatency
        ? Number(alternateLatency[1])
        : null;

  if (latency === null) {
    return null;
  }

  const windowsHost = line.match(/Reply from\s+([^:]+):/i);
  const unixHost = line.match(/\bfrom\s+([^\s:]+).*time[=<]/i);
  const bytes = line.match(/bytes[=\s](\d+)/i);
  const ttl = line.match(/\bttl[=\s](\d+)/i);
  const sequence = line.match(/\b(?:icmp_seq|seq)[=\s](\d+)/i);

  return {
    sequence: sequence ? Number(sequence[1]) : fallbackSequence,
    latency,
    status: "reply",
    host: windowsHost?.[1] ?? unixHost?.[1],
    ttl: ttl ? Number(ttl[1]) : undefined,
    bytes: bytes ? Number(bytes[1]) : undefined,
    raw: line,
  };
}

function parseTimeoutLine(line: string, sequence: number): PingSample | null {
  if (/packet loss|packets transmitted/i.test(line)) {
    return null;
  }

  if (/destination.*unreachable/i.test(line)) {
    return {
      sequence,
      latency: null,
      status: "unreachable",
      raw: line,
    };
  }

  if (/request timed out|timeout|no response|100\.0+%\s*loss/i.test(line)) {
    return {
      sequence,
      latency: null,
      status: "timeout",
      raw: line,
    };
  }

  return null;
}

function parseMtrRows(lines: string[]): PingSample[] {
  const headerIndex = lines.findIndex((line) =>
    /loss%|snt|last|avg|best|wrst|stdev|stdev/i.test(line)
  );

  if (headerIndex === -1) {
    return [];
  }

  return lines.slice(headerIndex + 1).flatMap((line, index) => {
    const cleaned = line.replace(/[|]/g, " ").replace(/\s+/g, " ").trim();
    const numbers = cleaned.match(/[\d.]+%?|[\d.]+/g) ?? [];

    if (numbers.length < 5) {
      return [];
    }

    const hostMatch = cleaned.match(/^(?:\d+[.)]\s*)?([^\s]+)/);
    const plainNumbers = numbers.map((number) => Number(number.replace("%", "")));
    const latency = plainNumbers.at(-4) ?? plainNumbers.at(-1) ?? null;
    const loss = numbers.find((number) => number.includes("%"));

    if (latency === null || Number.isNaN(latency)) {
      return [];
    }

    return [
      {
        sequence: index + 1,
        latency,
        status: loss && Number(loss.replace("%", "")) >= 100 ? "timeout" : "reply",
        host: hostMatch?.[1],
        raw: line,
      } satisfies PingSample,
    ];
  });
}

function normalizeSequences(samples: PingSample[]) {
  return samples.map((sample, index) => ({
    ...sample,
    sequence: Number.isFinite(sample.sequence) ? sample.sequence : index + 1,
  }));
}

function buildLatencyBuckets(latencies: number[]): PingBucket[] {
  const total = Math.max(latencies.length, 1);

  return latencyBucketTemplates.map((bucket, index) => {
    const min = index === 0 ? Number.NEGATIVE_INFINITY : latencyBucketTemplates[index - 1].max;
    const count = latencies.filter(
      (latency) => latency > min && latency <= bucket.max
    ).length;

    return {
      label: bucket.label,
      count,
      percent: (count / total) * 100,
      color: bucket.color,
      description: bucket.description,
    };
  });
}

function classifyPing(
  average: number,
  packetLossPercent: number,
  jitter: number,
  maximum: number
): PingAnalysis["assessment"] {
  if (packetLossPercent > 5 || average > 150 || jitter > 50) {
    return "Poor";
  }

  if (packetLossPercent > 2 || average > 100 || jitter > 25 || maximum > 250) {
    return "Fair";
  }

  if (packetLossPercent > 0 || average > 50 || jitter > 12) {
    return "Good";
  }

  return "Excellent";
}

function getAssessmentText(
  assessment: PingAnalysis["assessment"],
  average: number,
  packetLossPercent: number,
  jitter: number
) {
  if (assessment === "Excellent") {
    return "Latency is low, jitter is stable, and no packet loss was detected.";
  }

  if (assessment === "Good") {
    return "The connection looks usable, but there are small signs to watch.";
  }

  if (assessment === "Fair") {
    return `The test shows noticeable network quality issues. Average latency is ${formatMetric(
      average
    )} ms, packet loss is ${formatMetric(packetLossPercent)}%, and jitter is ${formatMetric(jitter)} ms.`;
  }

  return "The test shows serious latency, packet loss, or jitter problems that can affect calls, games, VPNs, and browsing.";
}

function buildStrengths(average: number, packetLossPercent: number, jitter: number) {
  const strengths = [];

  if (average <= 50) {
    strengths.push("Average response time is low.");
  }

  if (packetLossPercent === 0) {
    strengths.push("No packet loss detected.");
  }

  if (jitter <= 12) {
    strengths.push("Jitter is stable.");
  }

  return strengths.length > 0 ? strengths : ["No strong positives found yet."];
}

function buildIssues(
  average: number,
  packetLossPercent: number,
  jitter: number,
  maximum: number,
  lost: number
) {
  const issues = [];

  if (packetLossPercent > 0 || lost > 0) {
    issues.push(`Packet loss detected: ${formatMetric(packetLossPercent)}%.`);
  }

  if (average > 100) {
    issues.push("Average latency is high.");
  }

  if (jitter > 20) {
    issues.push("Jitter is high, so latency is inconsistent.");
  }

  if (maximum > 200) {
    issues.push("One or more latency spikes were detected.");
  }

  return issues.length > 0 ? issues : ["No major issues detected."];
}

function buildRecommendations(
  average: number,
  packetLossPercent: number,
  jitter: number,
  lost: number
) {
  const recommendations = [];

  if (packetLossPercent > 0 || lost > 0) {
    recommendations.push("Check Wi-Fi signal, cables, router load, and ISP stability.");
  }

  if (average > 100) {
    recommendations.push("Run traceroute to see where latency starts increasing.");
  }

  if (jitter > 20) {
    recommendations.push("Test while connected by Ethernet to rule out wireless interference.");
  }

  if (recommendations.length === 0) {
    recommendations.push("Run a longer ping test during the time the issue happens.");
  }

  recommendations.push("Compare results against another target such as 1.1.1.1 or 8.8.8.8.");

  return recommendations;
}

function buildLearningNotes(
  average: number,
  packetLossPercent: number,
  jitter: number,
  maximum: number
) {
  return [
    {
      title: "Average latency",
      description: `Average latency is ${formatMetric(
        average
      )} ms. Lower is better because each packet gets a response faster.`,
    },
    {
      title: "Packet loss",
      description: `${formatMetric(
        packetLossPercent
      )}% packet loss means some requests never received replies. Even small loss can hurt calls and games.`,
    },
    {
      title: "Jitter and spikes",
      description: `Jitter is ${formatMetric(
        jitter
      )} ms and the worst reply was ${formatMetric(
        maximum
      )} ms. High variation usually feels like lag or stuttering.`,
    },
  ];
}

function buildParserNote(
  samples: PingSample[],
  summary: SummaryStats,
  formatLabel: string
) {
  const hasSamples = samples.length > 0;
  const hasSummary =
    summary.sent !== undefined ||
    summary.avg !== undefined ||
    summary.min !== undefined ||
    summary.max !== undefined;

  if (hasSamples && hasSummary) {
    return `${formatLabel} detected. Individual replies and summary stats were both used.`;
  }

  if (hasSamples) {
    return `${formatLabel} detected. Metrics were calculated from individual parsed replies and timeout rows.`;
  }

  return `${formatLabel} detected. The file only included summary statistics, so the timeline may be limited.`;
}

function getFormatLabel(
  text: string,
  lines: string[],
  jsonSamples: PingSample[],
  csvSamples: PingSample[]
) {
  if (jsonSamples.length > 0) {
    return "JSON export";
  }

  if (csvSamples.length > 0) {
    return "CSV or table export";
  }

  if (/Pinging\s+/i.test(text) || /Reply from/i.test(text)) {
    return "Windows ping output";
  }

  if (/^PING\s+/im.test(text) || /packets transmitted/i.test(text)) {
    return "macOS or Linux ping output";
  }

  if (lines.some((line) => /loss%|snt|last|avg|best|wrst/i.test(line))) {
    return "MTR or WinMTR output";
  }

  return "Plain text ping output";
}

function detectTarget(lines: string[], samples: PingSample[]) {
  const pingCommand = lines.find((line) => /^ping\s+/i.test(line));

  if (pingCommand) {
    return pingCommand.replace(/^ping\s+/i, "").split(/\s+/).at(-1);
  }

  return samples.find((sample) => sample.host)?.host;
}

function detectDelimiter(line: string) {
  if (line.includes(",")) {
    return ",";
  }

  if (line.includes(";")) {
    return ";";
  }

  if (line.includes("\t")) {
    return "\t";
  }

  return null;
}

function splitDelimitedLine(line: string, delimiter: string) {
  if (delimiter !== ",") {
    return line.split(delimiter).map((part) => part.trim());
  }

  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (const character of line) {
    if (character === "\"") {
      quoted = !quoted;
      continue;
    }

    if (character === "," && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  cells.push(current.trim());

  return cells;
}

function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function firstNumberFromHeaders(record: Record<string, string>, headers: string[]) {
  for (const header of headers) {
    const value = record[header];
    const number = numberFromText(value);

    if (number !== null) {
      return number;
    }
  }

  return null;
}

function getRecordNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    const number = numberFromText(value);

    if (number !== null) {
      return number;
    }
  }

  return null;
}

function getRecordString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function numberFromText(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const match = value.match(/-?[\d.]+/);

  return match ? Number(match[0]) : null;
}

function averageOf(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function min(values: number[]) {
  return values.length > 0 ? Math.min(...values) : 0;
}

function max(values: number[]) {
  return values.length > 0 ? Math.max(...values) : 0;
}

function standardDeviation(values: number[]) {
  if (values.length <= 1) {
    return 0;
  }

  const avg = averageOf(values);
  const variance =
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;

  return Math.sqrt(variance);
}

function formatMetric(value: number) {
  return value >= 100 ? value.toFixed(0) : value.toFixed(2);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value >= 100 ? value.toFixed(0) : value.toFixed(2)} ${units[unitIndex]}`;
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getFileTypeLabel(fileName: string) {
  const extension = fileName.split(".").pop()?.toUpperCase();

  return extension ? `${extension} file` : "Text export";
}
