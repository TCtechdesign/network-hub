"use client";

import Link from "next/link";
import {
  Activity,
  AlertCircle,
  Cable,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Crown,
  Gauge,
  Globe2,
  Info,
  Loader2,
  Network,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { FormEvent, useState } from "react";
import SiteNav from "@/components/SiteNav";
import { tools, type ToolIcon } from "@/data/tools";
import {
  defaultPortsInput,
  demoPortCheckResult,
  maxPortsPerScan,
  type PortCheckResult,
  type PortScanRow,
  type PortScanStatus,
  type PortSecurityLevel,
  type SiteSecurityStatus,
} from "@/lib/portChecker";

type IconComponent = typeof Globe2;

type DetailRow = {
  label: string;
  value: string;
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

export default function PortCheckerPage() {
  const [host, setHost] = useState(demoPortCheckResult.targetHost);
  const [portsInput, setPortsInput] = useState(defaultPortsInput);
  const [timeoutMs, setTimeoutMs] = useState("1500");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [result, setResult] = useState<PortCheckResult>(demoPortCheckResult);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const scanDetails: DetailRow[] = [
    { label: "Target Host", value: result.targetHost },
    { label: "IP Address", value: result.ipAddress },
    { label: "Ports Scanned", value: String(result.summary.scanned) },
    { label: "Scan Type", value: result.scanType },
    { label: "Started At", value: formatDate(result.startedAt) },
    { label: "Finished At", value: formatDate(result.finishedAt) },
    { label: "Scan Duration", value: result.scanDuration },
    { label: "Source IP", value: result.sourceIp },
  ];

  async function runScan(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const targetHost = host.trim();
    const ports = portsInput.trim();

    if (!targetHost) {
      setError("Enter a host name or IP address first.");
      return;
    }

    if (!ports) {
      setError("Enter at least one port number.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/port-checker?host=${encodeURIComponent(
          targetHost
        )}&ports=${encodeURIComponent(ports)}&timeout=${encodeURIComponent(
          timeoutMs
        )}`,
        { cache: "no-store" }
      );
      const data = (await response.json()) as PortCheckResult;

      setResult(data);
      setUpdatedAt(new Date());

      if (!response.ok || data.status === "invalid") {
        setError(data.message ?? "The port scan could not be completed.");
      }
    } catch {
      setError("Port checking is unavailable right now. The example result is still shown.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <SiteNav active="tools" />

      <div className="mx-auto grid max-w-[96rem] gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:px-8">
        <aside className="hidden border-slate-800 lg:block lg:border-r lg:pr-4">
          <div className="sticky top-24">
            <p className="px-2 text-sm font-semibold uppercase text-slate-400">
              Tools
            </p>

            <nav className="mt-4 space-y-2">
              {tools.map((tool) => {
                const Icon = iconMap[tool.icon];
                const isActive = tool.slug === "port-checker";

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
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300">
                  <Crown size={20} />
                </span>
                <h2 className="font-semibold">Go Pro</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Unlock saved scans, larger batches, and detailed reports.
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
            <span>Port Checker</span>
          </div>

          <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Port Checker
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
                Check if specific TCP ports are open, closed, or filtered on a
                host.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span>Last updated: {formatUpdatedAt(updatedAt)}</span>
              <button
                type="button"
                onClick={() => void runScan()}
                disabled={isLoading}
                className="inline-flex items-center gap-2 text-blue-300 transition hover:text-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={17} />
                ) : (
                  <RefreshCw size={17} />
                )}
                Refresh
              </button>
            </div>
          </div>

          <form
            onSubmit={runScan}
            className="mt-6 rounded-lg border border-slate-800 bg-slate-950/65 p-5 shadow-[0_0_60px_rgba(14,165,233,0.06)]"
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)_16rem]">
              <label className="block">
                <span className="text-sm font-medium text-slate-300">
                  Host / IP Address
                </span>
                <input
                  type="text"
                  value={host}
                  onChange={(event) => setHost(event.target.value)}
                  placeholder="example.com"
                  className="mt-2 h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 text-base text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-500"
                />
                <span className="mt-2 block text-sm text-slate-400">
                  Enter domain name or IP address
                </span>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-300">
                  Ports (comma separated or range)
                </span>
                <input
                  type="text"
                  value={portsInput}
                  onChange={(event) => setPortsInput(event.target.value)}
                  placeholder={defaultPortsInput}
                  className="mt-2 h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 text-base text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-500"
                />
                <span className="mt-2 block text-sm text-slate-400">
                  Example: 20, 21, 80, 443 or 1-1024
                </span>
              </label>

              <div className="flex flex-col justify-end gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={19} />
                  ) : (
                    <Search size={19} />
                  )}
                  Check Ports
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdvanced((current) => !current)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-4 text-sm text-slate-200 transition hover:border-blue-500 hover:text-blue-300"
                  aria-expanded={showAdvanced}
                >
                  <Settings2 size={16} />
                  Advanced Options
                  <ChevronDown
                    className={`transition ${showAdvanced ? "rotate-180" : ""}`}
                    size={16}
                  />
                </button>
              </div>
            </div>

            {showAdvanced && (
              <div className="mt-4 grid gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <label className="block">
                  <span className="text-sm text-slate-400">
                    TCP timeout per port
                  </span>
                  <select
                    value={timeoutMs}
                    onChange={(event) => setTimeoutMs(event.target.value)}
                    className="mt-2 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-blue-500"
                  >
                    <option value="500">500 ms</option>
                    <option value="1000">1000 ms</option>
                    <option value="1500">1500 ms</option>
                    <option value="3000">3000 ms</option>
                    <option value="5000">5000 ms</option>
                  </select>
                </label>
                <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-sm leading-6 text-slate-400">
                  Scans are limited to {maxPortsPerScan} TCP ports at a time to
                  keep checks responsive and intentional.
                </div>
              </div>
            )}

            {error && (
              <p className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                <AlertCircle size={17} />
                {error}
              </p>
            )}
          </form>

          <section className="mt-5 grid gap-6 rounded-lg border border-slate-800 bg-slate-950/65 p-5 shadow-[0_0_60px_rgba(14,165,233,0.06)] xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.85fr)]">
            <div className="xl:border-r xl:border-slate-800 xl:pr-6">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/15 text-blue-300">
                  <Globe2 size={28} />
                </span>
                <div className="min-w-0">
                  <h2 className="break-all text-2xl font-bold sm:text-3xl">
                    {result.targetHost}
                  </h2>
                  <p className="mt-1 break-all text-xl text-slate-300">
                    {result.ipAddress}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-4">
                <MetricCard
                  label="Open Ports"
                  value={result.summary.open}
                  className="text-emerald-400"
                />
                <MetricCard
                  label="Closed Ports"
                  value={result.summary.closed}
                  className="text-red-400"
                />
                <MetricCard
                  label="Filtered Ports"
                  value={result.summary.filtered}
                  className="text-amber-300"
                />
                <MetricCard
                  label="Scanned"
                  value={result.summary.scanned}
                  className="text-slate-200"
                />
              </div>

              <div className="mt-6 flex flex-col gap-3 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 font-semibold text-emerald-300">
                  <CheckCircle2 size={16} />
                  {result.status === "invalid" ? "Scan Failed" : "Scan Completed"}
                </span>
                <span
                  className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 font-semibold ${getSiteSecurityBadgeClass(
                    result.siteSecurity.status
                  )}`}
                >
                  <ShieldCheck size={16} />
                  {result.siteSecurity.label}
                </span>
                <span>{formatDate(result.scannedAt)}</span>
                <span className="inline-flex items-center gap-2">
                  <Clock3 size={16} />
                  Scan Time: {result.scanDuration}
                </span>
              </div>
            </div>

            <StatusOverview result={result} />
          </section>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <section className="min-w-0 rounded-lg border border-slate-800 bg-slate-950/65 p-4 sm:p-5">
              <h2 className="font-semibold">Port Scan Results</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[68rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-300">
                      <th className="px-3 py-3 font-semibold">Port</th>
                      <th className="px-3 py-3 font-semibold">Status</th>
                      <th className="px-3 py-3 font-semibold">Service</th>
                      <th className="px-3 py-3 font-semibold">Protocol</th>
                      <th className="px-3 py-3 font-semibold">Response Time</th>
                      <th className="px-3 py-3 font-semibold">Security</th>
                      <th className="px-3 py-3 font-semibold">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {result.rows.map((row) => (
                      <PortRow key={`${row.port}-${row.service}`} row={row} />
                    ))}
                  </tbody>
                </table>
              </div>

              {result.rows.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-slate-400">
                  Run a scan to see port results.
                </div>
              )}
            </section>

            <aside className="space-y-5">
              <SiteSecurityPanel result={result} />

              <DetailPanel title="Scan Details" rows={scanDetails} />

              <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
                <h2 className="font-semibold">Common Ports</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <Link
                    href="/ports"
                    className="block text-blue-300 transition hover:text-blue-200"
                  >
                    Top 20 Ports
                  </Link>
                  <Link
                    href="/ports"
                    className="block text-blue-300 transition hover:text-blue-200"
                  >
                    Well Known Ports (0-1023)
                  </Link>
                  <Link
                    href="/ports"
                    className="block text-blue-300 transition hover:text-blue-200"
                  >
                    Registered Ports (1024-49151)
                  </Link>
                  <Link
                    href="/ports"
                    className="block text-blue-300 transition hover:text-blue-200"
                  >
                    Dynamic/Private Ports (49152-65535)
                  </Link>
                </div>
              </section>
            </aside>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/65 px-5 py-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2">
              <Info size={16} />
              Port scan results show the current state of the target ports.
              Security notes are based only on the ports included in this scan.
            </span>
            <span>All times are in your local timezone.</span>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="border-slate-800 sm:border-r sm:last:border-r-0 sm:pr-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${className}`}>{value}</p>
    </div>
  );
}

function StatusOverview({ result }: { result: PortCheckResult }) {
  const scanned = Math.max(result.summary.scanned, 1);
  const openPercent = Math.round((result.summary.open / scanned) * 100);
  const closedPercent = Math.round((result.summary.closed / scanned) * 100);
  const filteredPercent = Math.max(0, 100 - openPercent - closedPercent);
  const chartStyle = {
    background: `conic-gradient(#22c55e 0 ${openPercent}%, #ef4444 ${openPercent}% ${
      openPercent + closedPercent
    }%, #fbbf24 ${openPercent + closedPercent}% 100%)`,
  };

  return (
    <div>
      <h2 className="font-semibold">Port Status Overview</h2>
      <div className="mt-5 grid gap-6 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center">
        <div
          className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-full"
          style={chartStyle}
          aria-label="Port status chart"
        >
          <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-[#020817]">
            <span className="text-3xl font-bold">{result.summary.scanned}</span>
            <span className="text-sm text-slate-300">Total</span>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <LegendRow
            color="bg-emerald-400"
            label="Open"
            percent={openPercent}
            count={result.summary.open}
          />
          <LegendRow
            color="bg-red-400"
            label="Closed"
            percent={closedPercent}
            count={result.summary.closed}
          />
          <LegendRow
            color="bg-amber-300"
            label="Filtered"
            percent={filteredPercent}
            count={result.summary.filtered}
          />
        </div>
      </div>
    </div>
  );
}

function LegendRow({
  color,
  label,
  percent,
  count,
}: {
  color: string;
  label: string;
  percent: number;
  count: number;
}) {
  return (
    <div className="grid grid-cols-[1rem_minmax(0,1fr)_4.5rem] items-center gap-3">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span className="text-slate-300">{label}</span>
      <span className="text-right text-slate-200">
        {percent}% ({count})
      </span>
    </div>
  );
}

function PortRow({ row }: { row: PortScanRow }) {
  const tls = row.security.tls;

  return (
    <tr>
      <td className="px-3 py-3 text-slate-100">{row.port}</td>
      <td className="px-3 py-3">
        <span
          className={`rounded-md px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(
            row.status
          )}`}
        >
          {capitalize(row.status)}
        </span>
      </td>
      <td className="px-3 py-3 text-slate-200">{row.service}</td>
      <td className="px-3 py-3">
        <span className="rounded-md bg-blue-500/15 px-2 py-1 text-xs font-semibold text-blue-300">
          {row.protocol}
        </span>
      </td>
      <td className="px-3 py-3 text-slate-300">{row.responseTime}</td>
      <td className="max-w-[18rem] px-3 py-3">
        <span
          className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${getSecurityBadgeClass(
            row.security.level
          )}`}
        >
          {row.security.label}
        </span>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          {row.security.summary}
        </p>
        {tls?.checked && (
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {tls.protocol} / {tls.cipher}
          </p>
        )}
      </td>
      <td className="max-w-[18rem] px-3 py-3 text-slate-300">
        <span className="break-words">{row.details}</span>
        {row.status === "open" && (
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {row.security.recommendation}
          </p>
        )}
      </td>
    </tr>
  );
}

function SiteSecurityPanel({ result }: { result: PortCheckResult }) {
  const siteSecurity = result.siteSecurity;
  const tlsRow = result.rows.find((row) => row.security.tls?.checked);
  const tls = tlsRow?.security.tls;

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${getSiteSecurityIconClass(
            siteSecurity.status
          )}`}
        >
          <ShieldCheck size={20} />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold">Site Security</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            {siteSecurity.summary}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
          <p className="text-slate-400">HTTPS</p>
          <p className="mt-1 font-semibold text-slate-100">
            {siteSecurity.httpsOpen ? "Open" : "Not confirmed"}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
          <p className="text-slate-400">Valid TLS</p>
          <p className="mt-1 font-semibold text-slate-100">
            {siteSecurity.hasValidTls ? "Yes" : "No"}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
          <p className="text-slate-400">Secure Ports</p>
          <p className="mt-1 font-semibold text-emerald-300">
            {siteSecurity.securePorts}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
          <p className="text-slate-400">Review</p>
          <p className="mt-1 font-semibold text-amber-300">
            {siteSecurity.riskyPorts}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {siteSecurity.notes.map((note) => (
          <p
            key={note}
            className="flex gap-2 text-sm leading-6 text-slate-300"
          >
            <Info className="mt-1 shrink-0 text-blue-300" size={15} />
            <span>{note}</span>
          </p>
        ))}
      </div>

      {tls && (
        <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">TLS Certificate</h3>
            <span
              className={`rounded-md px-2 py-1 text-xs font-semibold ${
                tls.valid
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-red-500/15 text-red-300"
              }`}
            >
              {tls.valid ? "Trusted" : "Needs Review"}
            </span>
          </div>
          <div className="mt-3 divide-y divide-slate-800">
            {[
              { label: "Port", value: String(tlsRow?.port ?? "Unknown") },
              { label: "Protocol", value: tls.protocol },
              { label: "Cipher", value: tls.cipher },
              { label: "Subject", value: tls.subject },
              { label: "Issuer", value: tls.issuer },
              { label: "Valid To", value: tls.validTo },
            ].map((row) => (
              <div
                key={`tls-${row.label}`}
                className="grid grid-cols-[minmax(0,0.78fr)_minmax(0,1fr)] gap-3 py-2 text-xs"
              >
                <span className="text-slate-500">{row.label}</span>
                <span className="min-w-0 break-words text-right text-slate-200">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
          {tls.error && (
            <p className="mt-3 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs leading-5 text-red-200">
              {tls.error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function DetailPanel({ title, rows }: { title: string; rows: DetailRow[] }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-4 divide-y divide-slate-800">
        {rows.map((row) => (
          <div
            key={`${title}-${row.label}`}
            className="grid grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)] gap-4 py-2 text-sm"
          >
            <span className="text-slate-400">{row.label}</span>
            <span className="min-w-0 break-words text-right text-slate-100">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function getStatusBadgeClass(status: PortScanStatus) {
  if (status === "open") {
    return "bg-emerald-500/15 text-emerald-300";
  }

  if (status === "closed") {
    return "bg-red-500/15 text-red-300";
  }

  return "bg-amber-500/15 text-amber-300";
}

function getSecurityBadgeClass(level: PortSecurityLevel) {
  if (level === "secure") {
    return "bg-emerald-500/15 text-emerald-300";
  }

  if (level === "insecure") {
    return "bg-red-500/15 text-red-300";
  }

  if (level === "sensitive") {
    return "bg-amber-500/15 text-amber-300";
  }

  return "bg-slate-700/60 text-slate-300";
}

function getSiteSecurityBadgeClass(status: SiteSecurityStatus) {
  if (status === "secure") {
    return "bg-emerald-500/15 text-emerald-300";
  }

  if (status === "review") {
    return "bg-amber-500/15 text-amber-300";
  }

  if (status === "insecure") {
    return "bg-red-500/15 text-red-300";
  }

  return "bg-slate-700/60 text-slate-300";
}

function getSiteSecurityIconClass(status: SiteSecurityStatus) {
  if (status === "secure") {
    return "border-emerald-500/30 bg-emerald-500/15 text-emerald-300";
  }

  if (status === "review") {
    return "border-amber-500/30 bg-amber-500/15 text-amber-300";
  }

  if (status === "insecure") {
    return "border-red-500/30 bg-red-500/15 text-red-300";
  }

  return "border-slate-700 bg-slate-900 text-slate-300";
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatUpdatedAt(value: Date | null) {
  if (!value) {
    return "Example result";
  }

  return value.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}
