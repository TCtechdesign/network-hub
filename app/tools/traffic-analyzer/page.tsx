"use client";

import Link from "next/link";
import {
  Activity,
  BarChart3,
  Cable,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Crown,
  Database,
  FileText,
  Gauge,
  Globe2,
  Info,
  Layers,
  Loader2,
  Network,
  RefreshCw,
  Server,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import SiteNav from "@/components/SiteNav";
import { tools, type ToolIcon } from "@/data/tools";

type IconComponent = typeof Globe2;

type ProtocolRow = {
  name: string;
  percent: number;
  color: string;
  packets: number;
  bytes: number;
  description: string;
};

type ConversationRow = {
  source: string;
  destination: string;
  protocol: string;
  packets: number;
  bytes: string;
  explanation: string;
};

type TalkerRow = {
  ip: string;
  packets: number;
  bytes: string;
  role: string;
};

type PacketRow = {
  id: number;
  time: string;
  source: string;
  destination: string;
  protocol: string;
  length: number;
  info: string;
};

type CaptureAnalysis = {
  fileName: string;
  fileSize: string;
  capturedOn: string;
  packets: number;
  duration: string;
  interfaces: number;
  linkType: string;
  averagePacketSize: string;
  protocolsDetected: number;
  conversations: number;
  dataTransferred: string;
  protocolRows: ProtocolRow[];
  conversationRows: ConversationRow[];
  talkers: TalkerRow[];
  packetsPreview: PacketRow[];
  firstPacket: string;
  lastPacket: string;
  analysisTime: string;
  parserNote: string;
  learningNotes: {
    title: string;
    description: string;
  }[];
};

type ParsedCaptureStats = {
  packetCount: number;
  totalPacketBytes: number;
  durationSeconds: number;
  linkType: string;
  interfaces: number;
  firstTimestamp: number | null;
  lastTimestamp: number | null;
  parsedPackets: ParsedPacket[];
  parserNote: string;
};

type ParsedPacket = {
  id: number;
  timestamp: number | null;
  source: string;
  destination: string;
  sourcePort: number | null;
  destinationPort: number | null;
  protocol: string;
  length: number;
  info: string;
};

const iconMap: Record<ToolIcon, IconComponent> = {
  "map-pin": Globe2,
  globe: Globe2,
  dns: Globe2,
  network: Network,
  activity: Activity,
  ethernet: Cable,
  gauge: Gauge,
  pulse: Activity,
  shield: ShieldCheck,
};

const accentText: Record<string, string> = {
  blue: "text-blue-400",
  green: "text-emerald-400",
  violet: "text-violet-400",
  amber: "text-amber-400",
  cyan: "text-cyan-400",
  red: "text-red-400",
};

const protocolColors = ["#2563eb", "#7c3aed", "#16a34a", "#f59e0b", "#ef4444", "#64748b"];

export default function TrafficAnalyzerPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<CaptureAnalysis | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState("");

  const selectedFileSummary = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    return {
      name: selectedFile.name,
      size: formatBytes(selectedFile.size),
      modified: formatDateTime(new Date(selectedFile.lastModified)),
      type: selectedFile.name.toLowerCase().endsWith(".pcapng") ? "pcapng" : "pcap",
    };
  }, [selectedFile]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      setCaptureFile(file);
    }
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      setCaptureFile(file);
    }
  }

  function setCaptureFile(file: File) {
    const lowerName = file.name.toLowerCase();

    if (!lowerName.endsWith(".pcap") && !lowerName.endsWith(".pcapng")) {
      setError("Upload a Wireshark capture file ending in .pcap or .pcapng.");
      return;
    }

    setSelectedFile(file);
    setAnalysis(null);
    setUpdatedAt(null);
    setError("");
  }

  function clearCapture() {
    setSelectedFile(null);
    setAnalysis(null);
    setUpdatedAt(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function analyzeCapture() {
    if (!selectedFile) {
      setError("Upload a Wireshark capture file first.");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const startedAt = performance.now();
      const buffer = await selectedFile.arrayBuffer();
      const stats = parseCaptureStats(buffer, selectedFile);
      const nextAnalysis = buildAnalysis(selectedFile, stats, performance.now() - startedAt);

      setAnalysis(nextAnalysis);
      setUpdatedAt(new Date());
    } catch {
      setError("The capture could not be analyzed. Try another .pcap or .pcapng file.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <SiteNav active="tools" />

      <div className="mx-auto grid max-w-[96rem] gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:px-8">
        <ToolsSidebar activeSlug="traffic-analyzer" />

        <section className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <Link href="/" className="hover:text-cyan-400">
              Home
            </Link>
            <ChevronRight size={15} />
            <Link href="/tools" className="hover:text-cyan-400">
              Tools
            </Link>
            <ChevronRight size={15} />
            <span>Traffic Analyzer</span>
          </div>

          <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Traffic Analyzer
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
                Upload a capture file (.pcap / .pcapng) to analyze network
                traffic and protocols.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span>Last updated: {updatedAt ? formatDateTime(updatedAt) : "Not analyzed yet"}</span>
              <button
                type="button"
                onClick={() => void analyzeCapture()}
                disabled={!selectedFile || isAnalyzing}
                className="inline-flex items-center gap-2 text-blue-300 transition hover:text-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <Loader2 className="animate-spin" size={17} />
                ) : (
                  <RefreshCw size={17} />
                )}
                Refresh
              </button>
            </div>
          </div>

          <section className="mt-6 rounded-lg border border-slate-800 bg-slate-950/65 p-5 shadow-[0_0_60px_rgba(14,165,233,0.06)]">
            <div className="grid gap-5 xl:grid-cols-[minmax(20rem,0.9fr)_minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onClick={openFilePicker}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    openFilePicker();
                  }
                }}
                className={`flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center transition ${
                  isDragging
                    ? "border-blue-400 bg-blue-500/10"
                    : "border-blue-500/50 bg-slate-950/60 hover:border-cyan-400 hover:bg-cyan-500/5"
                }`}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-blue-500/40 bg-blue-500/10 text-blue-300">
                  <Upload size={30} />
                </span>
                <h2 className="mt-4 font-semibold">Upload Capture File</h2>
                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">
                  Drag and drop your .pcap or .pcapng file here or click to browse.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pcap,.pcapng,application/vnd.tcpdump.pcap"
                  onChange={handleFileInput}
                  className="sr-only"
                />
              </div>

              <div className="flex min-h-44 flex-col justify-center border-slate-800 xl:border-x xl:px-5">
                {selectedFileSummary ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 rounded-lg border border-slate-800 bg-slate-950/80 p-4">
                      <FileText className="shrink-0 text-slate-300" size={34} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-100">
                          {selectedFileSummary.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {selectedFileSummary.size} · {selectedFileSummary.type.toUpperCase()}
                        </p>
                      </div>
                      <CheckCircle2 className="shrink-0 text-emerald-400" size={22} />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => void analyzeCapture()}
                        disabled={isAnalyzing}
                        className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isAnalyzing ? (
                          <Loader2 className="animate-spin" size={19} />
                        ) : (
                          <Activity size={19} />
                        )}
                        Analyze Traffic
                      </button>
                      <button
                        type="button"
                        onClick={clearCapture}
                        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-300 transition hover:border-red-500/60 hover:text-red-300"
                        aria-label="Remove capture file"
                      >
                        <Trash2 size={19} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-5 text-center">
                    <p className="font-semibold text-slate-200">No capture selected</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Analysis panels stay blank until a Wireshark file is uploaded.
                    </p>
                  </div>
                )}
              </div>

              <FileInformation file={selectedFileSummary} analysis={analysis} />
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                {error}
              </p>
            )}
          </section>

          {analysis ? <AnalysisDashboard analysis={analysis} /> : <BlankAnalyzerState />}
        </section>
      </div>
    </main>
  );
}

function ToolsSidebar({ activeSlug }: { activeSlug: string }) {
  return (
    <aside className="hidden border-slate-800 lg:block lg:border-r lg:pr-4">
      <div className="sticky top-24">
        <p className="px-2 text-sm font-semibold uppercase text-slate-400">
          Tools
        </p>

        <nav className="mt-4 space-y-2">
          {tools.map((tool) => {
            const Icon = iconMap[tool.icon];
            const isActive = tool.slug === activeSlug;

            return (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
                  isActive
                    ? "border border-blue-500/20 bg-blue-600/25 text-blue-300"
                    : "text-slate-300 hover:bg-slate-900/80 hover:text-cyan-300"
                }`}
              >
                <Icon
                  className={`shrink-0 ${accentText[tool.accent]}`}
                  size={19}
                />
                <span className="min-w-0 truncate">{tool.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-12 rounded-lg border border-slate-800 bg-slate-950/70 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-violet-500/40 bg-violet-500/10 text-violet-300">
              <Crown size={20} />
            </span>
            <h2 className="font-semibold">Go Pro</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Unlock advanced protocol reports, saved captures, and exportable summaries.
          </p>
          <Link
            href="/tools"
            className="mt-4 inline-flex items-center gap-2 text-sm text-blue-300 transition hover:text-blue-200"
          >
            Learn More
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </aside>
  );
}

function FileInformation({
  file,
  analysis,
}: {
  file: { name: string; size: string; modified: string; type: string } | null;
  analysis: CaptureAnalysis | null;
}) {
  const rows = file
    ? [
        { label: "File Name", value: file.name },
        { label: "File Size", value: file.size },
        { label: "Captured On", value: analysis?.capturedOn ?? file.modified },
        { label: "Packets", value: analysis ? formatInteger(analysis.packets) : "Not analyzed" },
        { label: "Duration", value: analysis?.duration ?? "Not analyzed" },
        { label: "Interfaces", value: analysis ? String(analysis.interfaces) : "Not analyzed" },
        { label: "Link Type", value: analysis?.linkType ?? "Not analyzed" },
      ]
    : [
        { label: "File Name", value: "Waiting for upload" },
        { label: "File Size", value: "Waiting for upload" },
        { label: "Packets", value: "Waiting for analysis" },
        { label: "Duration", value: "Waiting for analysis" },
        { label: "Link Type", value: "Waiting for analysis" },
      ];

  return (
    <div className="min-h-44">
      <h2 className="text-sm font-semibold">File Information</h2>
      <div className="mt-3 space-y-2 text-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)] gap-3"
          >
            <span className="text-slate-400">{row.label}</span>
            <span className="min-w-0 break-words text-slate-100">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlankAnalyzerState() {
  return (
    <section className="mt-5 rounded-lg border border-slate-800 bg-slate-950/45 px-6 py-16 text-center shadow-[0_0_60px_rgba(14,165,233,0.04)]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-slate-400">
        <BarChart3 size={32} />
      </div>
      <h2 className="mt-5 text-xl font-semibold">Analysis workspace is blank</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
        Upload a Wireshark capture, then run analysis to populate protocol
        distribution, conversations, talkers, packets, and capture summary.
      </p>
    </section>
  );
}

function AnalysisDashboard({ analysis }: { analysis: CaptureAnalysis }) {
  return (
    <>
      <section className="mt-5 grid gap-3 rounded-lg border border-slate-800 bg-slate-950/65 p-4 shadow-[0_0_60px_rgba(14,165,233,0.06)] sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <SummaryMetric icon={Database} label="Packets" value={formatInteger(analysis.packets)} caption="Total Packets" tone="blue" />
        <SummaryMetric icon={Gauge} label="Average Packet Size" value={analysis.averagePacketSize} caption="Average Size" tone="violet" />
        <SummaryMetric icon={Layers} label="Protocols" value={String(analysis.protocolsDetected)} caption="Detected" tone="green" />
        <SummaryMetric icon={Users} label="Conversations" value={formatInteger(analysis.conversations)} caption="Total" tone="amber" />
        <SummaryMetric icon={Activity} label="Data Transferred" value={analysis.dataTransferred} caption="Total" tone="cyan" />
        <SummaryMetric icon={Clock3} label="Capture Duration" value={analysis.duration} caption="hh:mm:ss" tone="yellow" />
      </section>

      <LearningSummary analysis={analysis} />

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <ProtocolDistribution rows={analysis.protocolRows} />
        <DataTable
          title="Top Conversations"
          action="View all conversations"
          emptyMessage="No IP conversations were found in the packets this browser parser could decode."
          columns={["Source", "Destination", "Protocol", "Packets", "Bytes", "What it means"]}
          rows={analysis.conversationRows.map((row) => [
            row.source,
            row.destination,
            row.protocol,
            formatInteger(row.packets),
            row.bytes,
            row.explanation,
          ])}
        />
        <DataTable
          title="Top Talkers"
          action="View all talkers"
          emptyMessage="No source or destination IP addresses were found yet."
          columns={["IP Address", "Role", "Packets", "Bytes"]}
          rows={analysis.talkers.map((row) => [
            row.ip,
            row.role,
            formatInteger(row.packets),
            row.bytes,
          ])}
        />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <RecentPackets packets={analysis.packetsPreview} />
        <CaptureSummary analysis={analysis} />
      </section>

      <div className="mt-5 flex flex-col gap-3 px-2 pb-2 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2">
          <Info size={16} />
          Traffic analysis is performed locally in your browser. Files are not uploaded to any server.
        </span>
        <span>Analysis Time: {analysis.analysisTime}</span>
      </div>
    </>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
  caption,
  tone,
}: {
  icon: IconComponent;
  label: string;
  value: string;
  caption: string;
  tone: "blue" | "violet" | "green" | "amber" | "cyan" | "yellow";
}) {
  const toneClass = {
    blue: "border-blue-500/30 bg-blue-500/15 text-blue-300",
    violet: "border-violet-500/30 bg-violet-500/15 text-violet-300",
    green: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
    amber: "border-amber-500/30 bg-amber-500/15 text-amber-300",
    cyan: "border-cyan-500/30 bg-cyan-500/15 text-cyan-300",
    yellow: "border-yellow-500/30 bg-yellow-500/15 text-yellow-300",
  }[tone];

  return (
    <div className="flex min-h-24 min-w-0 items-center gap-3 overflow-hidden rounded-lg border border-slate-800 bg-slate-950/55 p-3">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${toneClass}`}>
        <Icon size={22} />
      </span>
      <div className="min-w-0">
        <p className="break-words text-sm leading-5 text-slate-300">{label}</p>
        <p className="mt-1 truncate text-2xl font-bold leading-tight text-slate-100">{value}</p>
        <p className="text-xs text-slate-400">{caption}</p>
      </div>
    </div>
  );
}

function LearningSummary({ analysis }: { analysis: CaptureAnalysis }) {
  return (
    <section className="mt-5 rounded-lg border border-blue-500/20 bg-blue-950/20 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="font-semibold text-blue-100">How to read this capture</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Start with the biggest protocol, then check the top conversations.
            Conversations show which two endpoints exchanged traffic, while
            talkers show which IP addresses appeared the most.
          </p>
        </div>
        <p className="rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-300 lg:max-w-md">
          {analysis.parserNote}
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {analysis.learningNotes.map((note) => (
          <article
            key={note.title}
            className="rounded-lg border border-slate-800 bg-slate-950/60 p-4"
          >
            <h3 className="text-sm font-semibold text-slate-100">{note.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {note.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProtocolDistribution({ rows }: { rows: ProtocolRow[] }) {
  const chartStyle = {
    background: `conic-gradient(${rows
      .reduce(
        (segments, row) => {
          const start = segments.total;
          const end = start + row.percent;

          segments.parts.push(`${row.color} ${start}% ${end}%`);
          segments.total = end;

          return segments;
        },
        { total: 0, parts: [] as string[] }
      )
      .parts.join(", ")})`,
  };

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
      <h2 className="font-semibold">Protocols Distribution</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        This shows what kinds of traffic appear most often in the capture.
      </p>
      <div className="mt-5 grid gap-5 2xl:grid-cols-[11rem_minmax(0,1fr)] 2xl:items-center">
        <div
          className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-full sm:h-44 sm:w-44"
          style={chartStyle}
          aria-label="Protocol distribution chart"
        >
          <div className="h-20 w-20 rounded-full bg-[#020817]" />
        </div>
        <div className="space-y-3 text-sm">
          {rows.map((row) => (
            <div key={row.name} className="min-w-0">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-slate-300">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="break-words">{row.name}</span>
                </span>
                <span className="shrink-0 text-right text-slate-200">
                  {row.percent.toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${row.percent}%`, backgroundColor: row.color }}
                />
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {formatInteger(row.packets)} packets · {formatBytes(row.bytes)} · {row.description}
              </p>
            </div>
          ))}
        </div>
      </div>
      <button className="mx-auto mt-4 flex items-center gap-2 text-sm text-blue-300 transition hover:text-blue-200">
        View all protocols
        <ChevronRight size={16} />
      </button>
    </section>
  );
}

function DataTable({
  title,
  columns,
  rows,
  action,
  emptyMessage,
}: {
  title: string;
  columns: string[];
  rows: string[][];
  action: string;
  emptyMessage: string;
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-300">
              {columns.map((column) => (
                <th key={column} className="py-3 pr-4 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.length > 0 ? rows.map((row) => (
              <tr key={row.join("-")}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${cell}-${cellIndex}`}
                    className="max-w-[16rem] py-2.5 pr-4 align-top text-slate-200"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-6 text-sm leading-6 text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button className="mx-auto mt-4 flex items-center gap-2 text-sm text-blue-300 transition hover:text-blue-200">
        {action}
        <ChevronRight size={16} />
      </button>
    </section>
  );
}

function RecentPackets({ packets }: { packets: PacketRow[] }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
      <h2 className="font-semibold">Recent Packets</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[54rem] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-300">
              {["No.", "Time", "Source", "Destination", "Protocol", "Length", "Info"].map((column) => (
                <th key={column} className="py-3 pr-4 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {packets.length > 0 ? packets.map((packet) => (
              <tr key={packet.id}>
                <td className="py-2.5 pr-4 text-slate-300">{packet.id}</td>
                <td className="py-2.5 pr-4 text-slate-300">{packet.time}</td>
                <td className="py-2.5 pr-4 text-slate-200">{packet.source}</td>
                <td className="py-2.5 pr-4 text-slate-200">{packet.destination}</td>
                <td className="py-2.5 pr-4">
                  <span className={`rounded-md px-2 py-1 text-xs font-semibold ${getProtocolBadgeClass(packet.protocol)}`}>
                    {packet.protocol}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-slate-300">{packet.length}</td>
                <td className="py-2.5 pr-4 text-slate-300">{packet.info}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="py-6 text-sm leading-6 text-slate-400">
                  No packet-level IPv4, IPv6, ARP, TCP, UDP, or ICMP details
                  were decoded from this capture.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button className="ml-auto mt-4 flex items-center gap-2 text-sm text-blue-300 transition hover:text-blue-200">
        View full packet list
        <ChevronRight size={16} />
      </button>
    </section>
  );
}

function CaptureSummary({ analysis }: { analysis: CaptureAnalysis }) {
  const rows = [
    { label: "First Packet", value: analysis.firstPacket },
    { label: "Last Packet", value: analysis.lastPacket },
    { label: "Duration", value: analysis.duration },
    { label: "Capture Filter", value: "Not Applied" },
    { label: "Display Filter", value: "Not Applied" },
  ];

  return (
    <aside className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
      <div className="flex items-center gap-3">
        <Server className="text-emerald-300" size={18} />
        <h2 className="font-semibold">Capture Summary</h2>
      </div>
      <div className="mt-5 space-y-4 text-sm">
        {rows.map((row) => (
          <div key={row.label}>
            <p className="text-slate-400">{row.label}</p>
            <p className="mt-1 break-words text-slate-100">{row.value}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

function parseCaptureStats(buffer: ArrayBuffer, file: File): ParsedCaptureStats {
  return parsePcap(buffer) ?? parsePcapNg(buffer) ?? buildFallbackStats(file);
}

function parsePcap(buffer: ArrayBuffer): ParsedCaptureStats | null {
  if (buffer.byteLength < 24) {
    return null;
  }

  const bytes = new Uint8Array(buffer.slice(0, 4));
  const magic = Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const littleEndian = magic === "d4c3b2a1" || magic === "4d3cb2a1";
  const bigEndian = magic === "a1b2c3d4" || magic === "a1b23c4d";
  const nanoSeconds = magic === "4d3cb2a1" || magic === "a1b23c4d";

  if (!littleEndian && !bigEndian) {
    return null;
  }

  const view = new DataView(buffer);
  const linkTypeValue = view.getUint32(20, littleEndian);
  const linkType = getLinkType(linkTypeValue);
  let offset = 24;
  let packetCount = 0;
  let totalPacketBytes = 0;
  let firstTimestamp: number | null = null;
  let lastTimestamp: number | null = null;
  const parsedPackets: ParsedPacket[] = [];

  while (offset + 16 <= buffer.byteLength && packetCount < 250_000) {
    const seconds = view.getUint32(offset, littleEndian);
    const fraction = view.getUint32(offset + 4, littleEndian);
    const capturedLength = view.getUint32(offset + 8, littleEndian);
    const originalLength = view.getUint32(offset + 12, littleEndian);

    if (capturedLength <= 0 || offset + 16 + capturedLength > buffer.byteLength) {
      break;
    }

    const timestamp = seconds + fraction / (nanoSeconds ? 1_000_000_000 : 1_000_000);

    if (packetCount === 0) {
      firstTimestamp = timestamp;
    }

    lastTimestamp = timestamp;
    packetCount += 1;
    totalPacketBytes += originalLength || capturedLength;

    const frame = new Uint8Array(buffer, offset + 16, capturedLength);
    const parsedPacket = parsePacketFrame(
      frame,
      linkTypeValue,
      timestamp,
      packetCount,
      originalLength || capturedLength
    );

    if (parsedPacket) {
      parsedPackets.push(parsedPacket);
    }

    offset += 16 + capturedLength;
  }

  if (packetCount === 0) {
    return null;
  }

  return {
    packetCount,
    totalPacketBytes,
    durationSeconds:
      firstTimestamp !== null && lastTimestamp !== null
        ? Math.max(lastTimestamp - firstTimestamp, 0)
        : 0,
    linkType,
    interfaces: 1,
    firstTimestamp,
    lastTimestamp,
    parsedPackets,
    parserNote: "Classic pcap file decoded from packet headers.",
  };
}

function parsePcapNg(buffer: ArrayBuffer): ParsedCaptureStats | null {
  if (buffer.byteLength < 28) {
    return null;
  }

  const view = new DataView(buffer);
  const sectionHeaderBlock = view.getUint32(0, false);

  if (sectionHeaderBlock !== 0x0a0d0d0a) {
    return null;
  }

  let littleEndian = true;
  let hasSection = false;
  let offset = 0;
  let packetCount = 0;
  let totalPacketBytes = 0;
  let firstTimestamp: number | null = null;
  let lastTimestamp: number | null = null;
  const interfaces: { linkType: number; timestampResolution: number }[] = [];
  const parsedPackets: ParsedPacket[] = [];

  while (offset + 12 <= buffer.byteLength && packetCount < 250_000) {
    const blockTypeBigEndian = view.getUint32(offset, false);

    if (blockTypeBigEndian === 0x0a0d0d0a) {
      const byteOrderMagicLittle = view.getUint32(offset + 8, true);
      const byteOrderMagicBig = view.getUint32(offset + 8, false);

      if (byteOrderMagicLittle === 0x1a2b3c4d) {
        littleEndian = true;
      } else if (byteOrderMagicBig === 0x1a2b3c4d) {
        littleEndian = false;
      } else {
        break;
      }

      hasSection = true;
    }

    if (!hasSection) {
      break;
    }

    const blockType =
      blockTypeBigEndian === 0x0a0d0d0a
        ? 0x0a0d0d0a
        : view.getUint32(offset, littleEndian);
    const blockLength = view.getUint32(offset + 4, littleEndian);

    if (blockLength < 12 || offset + blockLength > buffer.byteLength) {
      break;
    }

    if (blockType === 1 && blockLength >= 20) {
      const linkType = view.getUint16(offset + 8, littleEndian);
      interfaces.push({
        linkType,
        timestampResolution: getPcapNgTimestampResolution(
          view,
          offset + 16,
          offset + blockLength - 4,
          littleEndian
        ),
      });
    }

    if (blockType === 6 && blockLength >= 32) {
      const interfaceId = view.getUint32(offset + 8, littleEndian);
      const timestampHigh = view.getUint32(offset + 12, littleEndian);
      const timestampLow = view.getUint32(offset + 16, littleEndian);
      const capturedLength = view.getUint32(offset + 20, littleEndian);
      const originalLength = view.getUint32(offset + 24, littleEndian);
      const packetOffset = offset + 28;
      const packetEnd = packetOffset + capturedLength;
      const iface = interfaces[interfaceId] ?? {
        linkType: 1,
        timestampResolution: 1_000_000,
      };
      const timestamp =
        (timestampHigh * 2 ** 32 + timestampLow) / iface.timestampResolution;

      if (packetEnd > offset + blockLength - 4) {
        offset += blockLength;
        continue;
      }

      if (firstTimestamp === null) {
        firstTimestamp = timestamp;
      }

      lastTimestamp = timestamp;
      packetCount += 1;
      totalPacketBytes += originalLength || capturedLength;

      const frame = new Uint8Array(buffer, packetOffset, capturedLength);
      const parsedPacket = parsePacketFrame(
        frame,
        iface.linkType,
        timestamp,
        packetCount,
        originalLength || capturedLength
      );

      if (parsedPacket) {
        parsedPackets.push(parsedPacket);
      }
    }

    if (blockType === 3 && blockLength >= 16) {
      const packetLength = view.getUint32(offset + 8, littleEndian);
      const packetOffset = offset + 12;
      const capturedLength = Math.min(packetLength, blockLength - 16);
      const iface = interfaces[0] ?? {
        linkType: 1,
        timestampResolution: 1_000_000,
      };

      packetCount += 1;
      totalPacketBytes += packetLength;

      if (capturedLength > 0 && packetOffset + capturedLength <= offset + blockLength - 4) {
        const frame = new Uint8Array(buffer, packetOffset, capturedLength);
        const parsedPacket = parsePacketFrame(
          frame,
          iface.linkType,
          null,
          packetCount,
          packetLength
        );

        if (parsedPacket) {
          parsedPackets.push(parsedPacket);
        }
      }
    }

    offset += blockLength;
  }

  if (packetCount === 0) {
    return null;
  }

  return {
    packetCount,
    totalPacketBytes,
    durationSeconds:
      firstTimestamp !== null && lastTimestamp !== null
        ? Math.max(lastTimestamp - firstTimestamp, 0)
        : 0,
    linkType: getLinkType(interfaces[0]?.linkType ?? 1),
    interfaces: Math.max(interfaces.length, 1),
    firstTimestamp,
    lastTimestamp,
    parsedPackets,
    parserNote: "pcapng file decoded from enhanced packet blocks.",
  };
}

function buildFallbackStats(file: File): ParsedCaptureStats {
  const packetCount = Math.max(1, Math.round(file.size / 96));

  return {
    packetCount,
    totalPacketBytes: Math.max(file.size, packetCount * 64),
    durationSeconds: Math.max(30, Math.round(packetCount / 34)),
    linkType: "Unknown",
    interfaces: 1,
    firstTimestamp: null,
    lastTimestamp: null,
    parsedPackets: [],
    parserNote:
      "The file extension was accepted, but the capture headers could not be decoded.",
  };
}

function buildAnalysis(file: File, stats: ParsedCaptureStats, elapsedMs: number): CaptureAnalysis {
  const packets = stats.packetCount;
  const dataTransferred = stats.totalPacketBytes;
  const protocolRows = buildProtocolRows(stats.parsedPackets, packets, dataTransferred);
  const conversationData = buildConversationRows(stats.parsedPackets);
  const talkers = buildTalkers(stats.parsedPackets);
  const captureStart = stats.firstTimestamp !== null
    ? new Date(stats.firstTimestamp * 1000)
    : new Date(file.lastModified);
  const captureEnd = stats.lastTimestamp !== null
    ? new Date(stats.lastTimestamp * 1000)
    : new Date(captureStart.getTime() + stats.durationSeconds * 1000);
  const parserNote =
    stats.parsedPackets.length > 0
      ? `${stats.parserNote} IPs, ports, protocols, conversations, and packet rows below come from the capture data.`
      : `${stats.parserNote} Packet totals are shown, but no supported Ethernet/IP packet details were found, so endpoint tables stay empty instead of showing guessed data.`;

  return {
    fileName: file.name,
    fileSize: formatBytes(file.size),
    capturedOn: formatDateTime(captureStart),
    packets,
    duration: formatDuration(stats.durationSeconds),
    interfaces: stats.interfaces,
    linkType: stats.linkType,
    averagePacketSize: `${formatBytes(Math.max(dataTransferred / Math.max(packets, 1), 1))}`,
    protocolsDetected: protocolRows.length,
    conversations: conversationData.total,
    dataTransferred: formatBytes(dataTransferred),
    protocolRows,
    conversationRows: conversationData.rows,
    talkers,
    packetsPreview: buildPacketPreview(stats.parsedPackets, stats.firstTimestamp),
    firstPacket: formatDateTime(captureStart),
    lastPacket: formatDateTime(captureEnd),
    analysisTime: `${Math.max(elapsedMs / 1000, 0.01).toFixed(2)} s`,
    parserNote,
    learningNotes: buildLearningNotes(protocolRows, conversationData.rows, talkers),
  };
}

function buildProtocolRows(
  parsedPackets: ParsedPacket[],
  packetCount: number,
  totalBytes: number
): ProtocolRow[] {
  if (parsedPackets.length === 0) {
    return [
      {
        name: "Frames",
        percent: 100,
        color: protocolColors[0],
        packets: packetCount,
        bytes: totalBytes,
        description: "Packets were counted, but protocol headers were not decoded.",
      },
    ];
  }

  const protocolMap = new Map<string, { packets: number; bytes: number }>();

  parsedPackets.forEach((packet) => {
    const current = protocolMap.get(packet.protocol) ?? { packets: 0, bytes: 0 };
    current.packets += 1;
    current.bytes += packet.length;
    protocolMap.set(packet.protocol, current);
  });

  const sortedRows = Array.from(protocolMap.entries())
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.packets - a.packets);
  const topRows = sortedRows.slice(0, 5);
  const otherRows = sortedRows.slice(5);

  if (otherRows.length > 0) {
    topRows.push({
      name: "Other",
      packets: otherRows.reduce((sum, row) => sum + row.packets, 0),
      bytes: otherRows.reduce((sum, row) => sum + row.bytes, 0),
    });
  }

  const totalPackets = topRows.reduce((sum, row) => sum + row.packets, 0);

  return topRows.map((row, index) => ({
    ...row,
    percent: totalPackets > 0 ? (row.packets / totalPackets) * 100 : 0,
    color: protocolColors[index % protocolColors.length],
    description: describeProtocol(row.name),
  }));
}

function buildConversationRows(parsedPackets: ParsedPacket[]) {
  const conversations = new Map<
    string,
    {
      source: string;
      destination: string;
      protocol: string;
      packets: number;
      bytes: number;
    }
  >();

  parsedPackets.forEach((packet) => {
    if (!packet.source || !packet.destination) {
      return;
    }

    const source = formatEndpoint(packet.source, packet.sourcePort);
    const destination = formatEndpoint(packet.destination, packet.destinationPort);
    const normalized = [source, destination].sort().join(" <-> ");
    const protocolKey = `${normalized} ${packet.protocol}`;
    const current = conversations.get(protocolKey) ?? {
      source,
      destination,
      protocol: packet.protocol,
      packets: 0,
      bytes: 0,
    };

    current.packets += 1;
    current.bytes += packet.length;
    conversations.set(protocolKey, current);
  });

  const sortedRows = Array.from(conversations.values()).sort(
    (a, b) => b.packets - a.packets
  );

  return {
    total: sortedRows.length,
    rows: sortedRows.slice(0, 5).map((row) => ({
      source: row.source,
      destination: row.destination,
      protocol: row.protocol,
      packets: row.packets,
      bytes: formatBytes(row.bytes),
      explanation: describeConversation(row.protocol, row.destination),
    })),
  };
}

function buildTalkers(parsedPackets: ParsedPacket[]): TalkerRow[] {
  const talkerMap = new Map<string, { packets: number; bytes: number }>();

  parsedPackets.forEach((packet) => {
    [packet.source, packet.destination].forEach((ip) => {
      if (!ip) {
        return;
      }

      const current = talkerMap.get(ip) ?? { packets: 0, bytes: 0 };
      current.packets += 1;
      current.bytes += packet.length;
      talkerMap.set(ip, current);
    });
  });

  return Array.from(talkerMap.entries())
    .map(([ip, value]) => ({
      ip,
      packets: value.packets,
      bytes: formatBytes(value.bytes),
      role: getEndpointRole(ip),
    }))
    .sort((a, b) => b.packets - a.packets)
    .slice(0, 5);
}

function buildPacketPreview(
  parsedPackets: ParsedPacket[],
  firstTimestamp: number | null
): PacketRow[] {
  return parsedPackets.slice(0, 8).map((packet, index) => ({
    id: packet.id || index + 1,
    time: formatPacketTime(packet.timestamp, firstTimestamp),
    source: formatEndpoint(packet.source, packet.sourcePort),
    destination: formatEndpoint(packet.destination, packet.destinationPort),
    protocol: packet.protocol,
    length: packet.length,
    info: packet.info,
  }));
}

function buildLearningNotes(
  protocolRows: ProtocolRow[],
  conversations: ConversationRow[],
  talkers: TalkerRow[]
) {
  const dominantProtocol = protocolRows[0];
  const privateTalker = talkers.find((talker) => talker.role === "Private network");
  const topConversation = conversations[0];

  return [
    {
      title: "Biggest protocol",
      description: dominantProtocol
        ? `${dominantProtocol.name} is the largest slice at ${dominantProtocol.percent.toFixed(
            1
          )}%. If something feels slow, start with the protocol using the most packets.`
        : "No protocol details were decoded from this capture.",
    },
    {
      title: "Local vs public IPs",
      description: privateTalker
        ? `${privateTalker.ip} is a private/internal address. Public IPs usually represent internet services outside the local network.`
        : "Private IPs like 192.168.x.x, 10.x.x.x, and 172.16-31.x.x usually belong to the local network.",
    },
    {
      title: "Where to troubleshoot",
      description: topConversation
        ? `${topConversation.source} talking to ${topConversation.destination} is the busiest visible conversation. Check its protocol and port first.`
        : "When no conversations appear, the capture may use an unsupported link type or may not include IP traffic.",
    },
  ];
}

function getPcapNgTimestampResolution(
  view: DataView,
  optionsOffset: number,
  optionsEnd: number,
  littleEndian: boolean
) {
  let offset = optionsOffset;

  while (offset + 4 <= optionsEnd) {
    const optionCode = view.getUint16(offset, littleEndian);
    const optionLength = view.getUint16(offset + 2, littleEndian);

    if (optionCode === 0) {
      break;
    }

    if (optionCode === 9 && optionLength > 0 && offset + 4 + optionLength <= optionsEnd) {
      const value = view.getUint8(offset + 4);
      const base = value & 0x80 ? 2 : 10;
      const exponent = value & 0x7f;

      return base ** exponent;
    }

    offset += 4 + padToFour(optionLength);
  }

  return 1_000_000;
}

function parsePacketFrame(
  bytes: Uint8Array,
  linkType: number,
  timestamp: number | null,
  id: number,
  originalLength: number
): ParsedPacket | null {
  if (linkType === 1) {
    return parseEthernetPacket(bytes, timestamp, id, originalLength);
  }

  if (linkType === 101) {
    return parseRawIpPacket(bytes, 0, timestamp, id, originalLength);
  }

  if (linkType === 113 && bytes.length >= 16) {
    return parseEtherTypePayload(
      bytes,
      readUint16(bytes, 14),
      16,
      timestamp,
      id,
      originalLength
    );
  }

  if (linkType === 276 && bytes.length >= 20) {
    return parseEtherTypePayload(
      bytes,
      readUint16(bytes, 0),
      20,
      timestamp,
      id,
      originalLength
    );
  }

  return null;
}

function parseEthernetPacket(
  bytes: Uint8Array,
  timestamp: number | null,
  id: number,
  originalLength: number
): ParsedPacket | null {
  if (bytes.length < 14) {
    return null;
  }

  let etherType = readUint16(bytes, 12);
  let payloadOffset = 14;

  while ((etherType === 0x8100 || etherType === 0x88a8) && bytes.length >= payloadOffset + 4) {
    etherType = readUint16(bytes, payloadOffset + 2);
    payloadOffset += 4;
  }

  return parseEtherTypePayload(
    bytes,
    etherType,
    payloadOffset,
    timestamp,
    id,
    originalLength
  );
}

function parseEtherTypePayload(
  bytes: Uint8Array,
  etherType: number,
  payloadOffset: number,
  timestamp: number | null,
  id: number,
  originalLength: number
): ParsedPacket | null {
  if (etherType === 0x0800) {
    return parseIpv4Packet(bytes, payloadOffset, timestamp, id, originalLength);
  }

  if (etherType === 0x86dd) {
    return parseIpv6Packet(bytes, payloadOffset, timestamp, id, originalLength);
  }

  if (etherType === 0x0806) {
    return parseArpPacket(bytes, payloadOffset, timestamp, id, originalLength);
  }

  return null;
}

function parseRawIpPacket(
  bytes: Uint8Array,
  offset: number,
  timestamp: number | null,
  id: number,
  originalLength: number
): ParsedPacket | null {
  const version = bytes[offset] ? bytes[offset] >> 4 : 0;

  if (version === 4) {
    return parseIpv4Packet(bytes, offset, timestamp, id, originalLength);
  }

  if (version === 6) {
    return parseIpv6Packet(bytes, offset, timestamp, id, originalLength);
  }

  return null;
}

function parseArpPacket(
  bytes: Uint8Array,
  offset: number,
  timestamp: number | null,
  id: number,
  originalLength: number
): ParsedPacket | null {
  if (bytes.length < offset + 28) {
    return null;
  }

  const protocolType = readUint16(bytes, offset + 2);
  const hardwareLength = bytes[offset + 4];
  const protocolLength = bytes[offset + 5];

  if (protocolType !== 0x0800 || hardwareLength !== 6 || protocolLength !== 4) {
    return null;
  }

  const operation = readUint16(bytes, offset + 6);
  const source = formatIpv4(bytes, offset + 14);
  const destination = formatIpv4(bytes, offset + 24);

  return {
    id,
    timestamp,
    source,
    destination,
    sourcePort: null,
    destinationPort: null,
    protocol: "ARP",
    length: originalLength,
    info:
      operation === 1
        ? `Who has ${destination}? Tell ${source}`
        : `${source} is at ${formatMac(bytes, offset + 8)}`,
  };
}

function parseIpv4Packet(
  bytes: Uint8Array,
  offset: number,
  timestamp: number | null,
  id: number,
  originalLength: number
): ParsedPacket | null {
  if (bytes.length < offset + 20) {
    return null;
  }

  const version = bytes[offset] >> 4;
  const headerLength = (bytes[offset] & 0x0f) * 4;

  if (version !== 4 || headerLength < 20 || bytes.length < offset + headerLength) {
    return null;
  }

  const protocolNumber = bytes[offset + 9];
  const source = formatIpv4(bytes, offset + 12);
  const destination = formatIpv4(bytes, offset + 16);
  const totalLength = readUint16(bytes, offset + 2);
  const packetEnd = Math.min(bytes.length, offset + Math.max(totalLength, headerLength));
  const fragmentData = readUint16(bytes, offset + 6);
  const fragmentOffset = fragmentData & 0x1fff;

  if (fragmentOffset > 0) {
    return {
      id,
      timestamp,
      source,
      destination,
      sourcePort: null,
      destinationPort: null,
      protocol: getIpProtocolName(protocolNumber),
      length: originalLength,
      info: "Fragmented IPv4 packet",
    };
  }

  const transport = parseTransportDetails(
    bytes,
    offset + headerLength,
    packetEnd,
    protocolNumber
  );

  return {
    id,
    timestamp,
    source,
    destination,
    sourcePort: transport.sourcePort,
    destinationPort: transport.destinationPort,
    protocol: transport.protocol,
    length: originalLength,
    info: transport.info,
  };
}

function parseIpv6Packet(
  bytes: Uint8Array,
  offset: number,
  timestamp: number | null,
  id: number,
  originalLength: number
): ParsedPacket | null {
  if (bytes.length < offset + 40 || bytes[offset] >> 4 !== 6) {
    return null;
  }

  const payloadLength = readUint16(bytes, offset + 4);
  const source = formatIpv6(bytes, offset + 8);
  const destination = formatIpv6(bytes, offset + 24);
  const packetEnd = Math.min(bytes.length, offset + 40 + payloadLength);
  let nextHeader = bytes[offset + 6];
  let transportOffset = offset + 40;
  let extensionCount = 0;

  while (
    isIpv6ExtensionHeader(nextHeader) &&
    transportOffset + 2 <= packetEnd &&
    extensionCount < 6
  ) {
    const extensionHeader = nextHeader;
    nextHeader = bytes[transportOffset];
    transportOffset += extensionHeader === 44 ? 8 : (bytes[transportOffset + 1] + 1) * 8;
    extensionCount += 1;
  }

  const transport = parseTransportDetails(bytes, transportOffset, packetEnd, nextHeader);

  return {
    id,
    timestamp,
    source,
    destination,
    sourcePort: transport.sourcePort,
    destinationPort: transport.destinationPort,
    protocol: transport.protocol,
    length: originalLength,
    info: transport.info,
  };
}

function parseTransportDetails(
  bytes: Uint8Array,
  offset: number,
  packetEnd: number,
  protocolNumber: number
) {
  if (protocolNumber === 6 && packetEnd >= offset + 20) {
    const sourcePort = readUint16(bytes, offset);
    const destinationPort = readUint16(bytes, offset + 2);
    const flags = formatTcpFlags(bytes[offset + 13]);
    const sequence = readUint32(bytes, offset + 4);
    const acknowledgement = readUint32(bytes, offset + 8);
    const protocol = detectApplicationProtocol("TCP", sourcePort, destinationPort);

    return {
      sourcePort,
      destinationPort,
      protocol,
      info: `${sourcePort} -> ${destinationPort} [${flags}] Seq=${sequence} Ack=${acknowledgement}`,
    };
  }

  if (protocolNumber === 17 && packetEnd >= offset + 8) {
    const sourcePort = readUint16(bytes, offset);
    const destinationPort = readUint16(bytes, offset + 2);
    const udpLength = readUint16(bytes, offset + 4);
    const protocol = detectApplicationProtocol("UDP", sourcePort, destinationPort);
    const dnsDirection =
      protocol === "DNS" && packetEnd >= offset + 11
        ? bytes[offset + 10] & 0x80
          ? "response"
          : "query"
        : null;

    return {
      sourcePort,
      destinationPort,
      protocol,
      info: dnsDirection
        ? `${sourcePort} -> ${destinationPort} DNS ${dnsDirection}`
        : `${sourcePort} -> ${destinationPort} Len=${udpLength}`,
    };
  }

  if ((protocolNumber === 1 || protocolNumber === 58) && packetEnd >= offset + 2) {
    const type = bytes[offset];
    const code = bytes[offset + 1];
    const protocol = protocolNumber === 58 ? "ICMPv6" : "ICMP";

    return {
      sourcePort: null,
      destinationPort: null,
      protocol,
      info: `${describeIcmp(type, protocol)} (type ${type}, code ${code})`,
    };
  }

  return {
    sourcePort: null,
    destinationPort: null,
    protocol: getIpProtocolName(protocolNumber),
    info: `IP protocol ${protocolNumber}`,
  };
}

function detectApplicationProtocol(
  transport: "TCP" | "UDP",
  sourcePort: number,
  destinationPort: number
) {
  const servicePort = [sourcePort, destinationPort].find((port) =>
    knownPortProtocols.has(port)
  );

  return servicePort ? knownPortProtocols.get(servicePort) ?? transport : transport;
}

const knownPortProtocols = new Map<number, string>([
  [20, "FTP"],
  [21, "FTP"],
  [22, "SSH"],
  [25, "SMTP"],
  [53, "DNS"],
  [67, "DHCP"],
  [68, "DHCP"],
  [80, "HTTP"],
  [110, "POP3"],
  [123, "NTP"],
  [143, "IMAP"],
  [161, "SNMP"],
  [443, "HTTPS"],
  [445, "SMB"],
  [993, "IMAPS"],
  [995, "POP3S"],
  [3389, "RDP"],
]);

function describeProtocol(protocol: string) {
  const descriptions: Record<string, string> = {
    ARP: "Finds a device's MAC address on the local network.",
    DHCP: "Automatically gives devices IP settings.",
    DNS: "Looks up names like google.com and returns IP addresses.",
    FTP: "Transfers files, usually without modern encryption.",
    HTTP: "Unencrypted web traffic.",
    HTTPS: "Encrypted web traffic, usually port 443.",
    ICMP: "Ping and network control messages.",
    ICMPv6: "IPv6 control and diagnostic messages.",
    IMAP: "Email retrieval traffic.",
    NTP: "Time synchronization traffic.",
    RDP: "Remote Desktop traffic.",
    SMB: "Windows file sharing traffic.",
    SMTP: "Email sending traffic.",
    SSH: "Encrypted remote login traffic.",
    TCP: "Connection-oriented transport traffic.",
    UDP: "Connectionless transport traffic.",
  };

  return descriptions[protocol] ?? "Traffic decoded from packet headers.";
}

function describeConversation(protocol: string, destination: string) {
  if (protocol === "DNS") {
    return "Name lookup traffic. DNS problems can make websites fail even when Wi-Fi is connected.";
  }

  if (protocol === "HTTPS") {
    return "Encrypted web traffic. The IP and port are visible, but the page contents are encrypted.";
  }

  if (protocol === "DHCP") {
    return "IP address assignment traffic between a client and DHCP server.";
  }

  if (protocol === "ARP") {
    return "Local network address discovery. It usually stays inside the LAN.";
  }

  if (destination.endsWith(":443")) {
    return "Likely secure web traffic on port 443.";
  }

  return describeProtocol(protocol);
}

function getEndpointRole(ip: string) {
  if (isPrivateAddress(ip)) {
    return "Private network";
  }

  if (ip.startsWith("169.254.") || ip.toLowerCase().startsWith("fe80:")) {
    return "Link-local";
  }

  if (ip === "255.255.255.255" || ip.toLowerCase().startsWith("ff")) {
    return "Broadcast/multicast";
  }

  return "Public internet";
}

function isPrivateAddress(ip: string) {
  const parts = ip.split(".").map((part) => Number(part));

  if (parts.length === 4 && parts.every((part) => Number.isInteger(part))) {
    return (
      parts[0] === 10 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168)
    );
  }

  const lowerIp = ip.toLowerCase();

  return lowerIp.startsWith("fc") || lowerIp.startsWith("fd") || lowerIp === "::1";
}

function formatEndpoint(ip: string, port: number | null) {
  if (!ip) {
    return "Unknown";
  }

  if (port === null) {
    return ip;
  }

  return ip.includes(":") ? `[${ip}]:${port}` : `${ip}:${port}`;
}

function formatPacketTime(timestamp: number | null, firstTimestamp: number | null) {
  if (timestamp === null || firstTimestamp === null) {
    return "-";
  }

  return Math.max(timestamp - firstTimestamp, 0).toFixed(6);
}

function getIpProtocolName(protocolNumber: number) {
  const names: Record<number, string> = {
    1: "ICMP",
    2: "IGMP",
    6: "TCP",
    17: "UDP",
    47: "GRE",
    50: "ESP",
    51: "AH",
    58: "ICMPv6",
  };

  return names[protocolNumber] ?? `IP ${protocolNumber}`;
}

function formatTcpFlags(flags: number) {
  const labels = [
    { bit: 0x80, label: "CWR" },
    { bit: 0x40, label: "ECE" },
    { bit: 0x20, label: "URG" },
    { bit: 0x10, label: "ACK" },
    { bit: 0x08, label: "PSH" },
    { bit: 0x04, label: "RST" },
    { bit: 0x02, label: "SYN" },
    { bit: 0x01, label: "FIN" },
  ];
  const activeFlags = labels
    .filter((flag) => flags & flag.bit)
    .map((flag) => flag.label);

  return activeFlags.length > 0 ? activeFlags.join(", ") : "None";
}

function describeIcmp(type: number, protocol: string) {
  if (protocol === "ICMPv6") {
    const ipv6Types: Record<number, string> = {
      128: "Echo request",
      129: "Echo reply",
      133: "Router solicitation",
      134: "Router advertisement",
      135: "Neighbor solicitation",
      136: "Neighbor advertisement",
    };

    return ipv6Types[type] ?? "ICMPv6 message";
  }

  const ipv4Types: Record<number, string> = {
    0: "Echo reply",
    3: "Destination unreachable",
    5: "Redirect",
    8: "Echo request",
    11: "Time exceeded",
  };

  return ipv4Types[type] ?? "ICMP message";
}

function isIpv6ExtensionHeader(nextHeader: number) {
  return [0, 43, 44, 50, 51, 60].includes(nextHeader);
}

function readUint16(bytes: Uint8Array, offset: number) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function readUint32(bytes: Uint8Array, offset: number) {
  return (
    bytes[offset] * 2 ** 24 +
    bytes[offset + 1] * 2 ** 16 +
    bytes[offset + 2] * 2 ** 8 +
    bytes[offset + 3]
  );
}

function formatIpv4(bytes: Uint8Array, offset: number) {
  return `${bytes[offset]}.${bytes[offset + 1]}.${bytes[offset + 2]}.${bytes[offset + 3]}`;
}

function formatIpv6(bytes: Uint8Array, offset: number) {
  const groups = Array.from({ length: 8 }, (_, index) =>
    readUint16(bytes, offset + index * 2).toString(16)
  );
  let bestStart = -1;
  let bestLength = 0;
  let currentStart = -1;
  let currentLength = 0;

  groups.forEach((group, index) => {
    if (group === "0") {
      if (currentStart === -1) {
        currentStart = index;
        currentLength = 0;
      }

      currentLength += 1;

      if (currentLength > bestLength) {
        bestStart = currentStart;
        bestLength = currentLength;
      }
    } else {
      currentStart = -1;
      currentLength = 0;
    }
  });

  if (bestLength < 2) {
    return groups.join(":");
  }

  const before = groups.slice(0, bestStart).join(":");
  const after = groups.slice(bestStart + bestLength).join(":");

  if (!before && !after) {
    return "::";
  }

  if (!before) {
    return `::${after}`;
  }

  if (!after) {
    return `${before}::`;
  }

  return `${before}::${after}`;
}

function formatMac(bytes: Uint8Array, offset: number) {
  return Array.from(bytes.slice(offset, offset + 6))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join(":");
}

function padToFour(value: number) {
  return (value + 3) & ~3;
}

function getProtocolBadgeClass(protocol: string) {
  if (protocol === "TCP" || protocol === "HTTPS" || protocol === "HTTP") {
    return "bg-blue-500/15 text-blue-300";
  }

  if (protocol === "UDP") {
    return "bg-emerald-500/15 text-emerald-300";
  }

  if (protocol === "DNS" || protocol === "DHCP" || protocol === "NTP") {
    return "bg-amber-500/15 text-amber-300";
  }

  if (protocol === "ICMP" || protocol === "ICMPv6" || protocol === "ARP") {
    return "bg-violet-500/15 text-violet-300";
  }

  return "bg-slate-700 text-slate-200";
}

function getLinkType(value: number) {
  if (value === 1) {
    return "Ethernet (1)";
  }

  if (value === 101) {
    return "Raw IP (101)";
  }

  if (value === 105) {
    return "Wi-Fi (105)";
  }

  if (value === 113) {
    return "Linux cooked capture (113)";
  }

  if (value === 276) {
    return "Linux cooked capture v2 (276)";
  }

  return `Link Type ${value}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${Math.round(bytes)} B`;
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

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
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
