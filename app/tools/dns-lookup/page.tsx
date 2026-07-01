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
  Copy,
  Crown,
  Database,
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
import { FormEvent, useMemo, useState } from "react";
import SiteNav from "@/components/SiteNav";
import { tools, type ToolIcon } from "@/data/tools";
import {
  demoDnsLookupResult,
  dnsRecordTabs,
  dnsServerOptions,
  type DnsLookupResult,
  type DnsRecord,
  type DnsRecordType,
} from "@/lib/dnsLookup";

type IconComponent = typeof Globe2;
type RecordTab = "ALL" | DnsRecordType;

type DetailRow = {
  label: string;
  value: string;
  badge?: "green" | "blue" | "slate";
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

const recordTypeStyles: Record<DnsRecordType, string> = {
  A: "bg-emerald-500/15 text-emerald-300",
  AAAA: "bg-blue-500/15 text-blue-300",
  CNAME: "bg-violet-500/15 text-violet-300",
  MX: "bg-amber-500/15 text-amber-300",
  NS: "bg-cyan-500/15 text-cyan-300",
  TXT: "bg-slate-700 text-slate-200",
  SRV: "bg-fuchsia-500/15 text-fuchsia-300",
  SOA: "bg-indigo-500/15 text-indigo-300",
  PTR: "bg-teal-500/15 text-teal-300",
};

export default function DnsLookupPage() {
  const [query, setQuery] = useState(demoDnsLookupResult.domain);
  const [dnsServer, setDnsServer] = useState("cloudflare");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [result, setResult] = useState<DnsLookupResult>(demoDnsLookupResult);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<RecordTab>("ALL");
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedValue, setCopiedValue] = useState("");

  const totalRecords = result.records.length;
  const visibleTabs = useMemo(() => {
    const tabs = dnsRecordTabs.filter(
      (tab) => tab !== "PTR" || result.summary.PTR > 0
    );

    return ["ALL" as const, ...tabs];
  }, [result.summary.PTR]);

  const filteredRecords =
    activeTab === "ALL"
      ? result.records
      : result.records.filter((record) => record.type === activeTab);
  const displayedRecords = showAllRecords
    ? filteredRecords
    : filteredRecords.slice(0, 6);
  const summaryRows: DetailRow[] = [
    { label: "A Records", value: String(result.summary.A) },
    { label: "AAAA Records", value: String(result.summary.AAAA) },
    { label: "MX Records", value: String(result.summary.MX) },
    { label: "NS Records", value: String(result.summary.NS) },
    { label: "TXT Records", value: String(result.summary.TXT) },
    { label: "Total Records", value: String(totalRecords) },
  ];
  const domainRows: DetailRow[] = [
    { label: "Registrar", value: result.domainInfo.registrar },
    { label: "Registration Date", value: result.domainInfo.registrationDate },
    { label: "Expiration Date", value: result.domainInfo.expirationDate },
    {
      label: "Name Servers",
      value: formatNameServers(result.domainInfo.nameServers),
      badge: "blue",
    },
    {
      label: "DNSSEC",
      value: result.dnssec.status,
      badge: result.dnssec.enabled ? "green" : "slate",
    },
  ];
  const soaRows: DetailRow[] = [
    { label: "Primary NS", value: result.soa.primaryNs },
    { label: "Admin Email", value: result.soa.adminEmail },
    { label: "Serial Number", value: result.soa.serialNumber },
    { label: "Refresh", value: result.soa.refresh },
    { label: "Retry", value: result.soa.retry },
    { label: "Expire", value: result.soa.expire },
    { label: "Minimum TTL", value: result.soa.minimumTtl },
  ];
  const dnssecRows: DetailRow[] = [
    {
      label: "Status",
      value: result.dnssec.status,
      badge: result.dnssec.enabled ? "green" : "slate",
    },
    { label: "Algorithm", value: result.dnssec.algorithm },
    { label: "Key Tag", value: result.dnssec.keyTag },
  ];

  async function runLookup(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const domain = query.trim();

    if (!domain) {
      setError("Enter a domain or hostname first.");
      return;
    }

    setIsLoading(true);
    setError("");
    setCopiedValue("");
    setShowAllRecords(false);

    try {
      const response = await fetch(
        `/api/dns-lookup?domain=${encodeURIComponent(
          domain
        )}&server=${encodeURIComponent(dnsServer)}`,
        { cache: "no-store" }
      );
      const data = (await response.json()) as DnsLookupResult;

      setResult(data);
      setUpdatedAt(new Date());
      setActiveTab("ALL");

      if (!response.ok || data.status !== "success") {
        setError(data.message ?? "No DNS records were found for that lookup.");
      }
    } catch {
      setError("DNS lookup is unavailable right now. The example result is still shown.");
    } finally {
      setIsLoading(false);
    }
  }

  async function copyValue(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      window.setTimeout(() => setCopiedValue(""), 1600);
    } catch {
      setCopiedValue("");
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
                const isActive = tool.slug === "dns-lookup";

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
                Unlock advanced DNS checks, history, and priority support.
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
            <span>DNS Lookup</span>
          </div>

          <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                DNS Lookup
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
                Lookup DNS records for any domain or hostname.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span>Last updated: {formatUpdatedAt(updatedAt)}</span>
              <button
                type="button"
                onClick={() => void runLookup()}
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
            onSubmit={runLookup}
            className="mt-6 rounded-lg border border-slate-800 bg-slate-950/65 p-5 shadow-[0_0_60px_rgba(14,165,233,0.06)]"
          >
            <label
              htmlFor="dns-domain"
              className="text-sm font-medium text-slate-300"
            >
              Enter Domain or Hostname
            </label>
            <div className="mt-2 grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
              <input
                id="dns-domain"
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="example.com"
                className="h-12 rounded-lg border border-slate-700 bg-slate-950 px-4 text-base text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-500"
              />
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
                Lookup
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-3 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between">
              <span>Example: example.com, google.com, 8.8.8.8</span>
              <button
                type="button"
                onClick={() => setShowAdvanced((current) => !current)}
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-2 text-slate-200 transition hover:border-blue-500 hover:text-blue-300"
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

            {showAdvanced && (
              <div className="mt-4 grid gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <label className="block">
                  <span className="text-sm text-slate-400">DNS Server</span>
                  <select
                    value={dnsServer}
                    onChange={(event) => setDnsServer(event.target.value)}
                    className="mt-2 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-blue-500"
                  >
                    {dnsServerOptions.map((server) => (
                      <option key={server.value} value={server.value}>
                        {server.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-sm leading-6 text-slate-400">
                  The lookup returns common record types and uses the selected
                  resolver when your local environment allows it.
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

          <section className="mt-5 grid gap-6 rounded-lg border border-slate-800 bg-slate-950/65 p-5 shadow-[0_0_60px_rgba(14,165,233,0.06)] xl:grid-cols-[minmax(0,0.8fr)_minmax(0,0.78fr)_minmax(20rem,1fr)]">
            <div>
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/15 text-blue-300">
                  <Globe2 size={28} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="break-all text-2xl font-bold sm:text-3xl">
                      {result.displayName}
                    </h2>
                    <CopyButton
                      value={result.displayName}
                      copiedValue={copiedValue}
                      onCopy={copyValue}
                      label="Copy domain"
                    />
                  </div>
                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                      result.status === "success"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-amber-500/15 text-amber-300"
                    }`}
                  >
                    {result.status === "success"
                      ? "Domain Exists"
                      : "No records found"}
                  </span>
                </div>
              </div>

              <div className="mt-8 space-y-5">
                <SummaryRow
                  icon={Clock3}
                  label="Queried At"
                  value={formatLookupDate(result.queriedAt)}
                />
                <SummaryRow
                  icon={Database}
                  label="DNS Server"
                  value={result.dnsServer}
                />
              </div>
            </div>

            <DetailPanel title="Summary" rows={summaryRows} />
            <DetailPanel title="Domain Information" rows={domainRows} />
          </section>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <section className="min-w-0 rounded-lg border border-slate-800 bg-slate-950/65 p-4 sm:p-5">
              <div className="flex gap-2 overflow-x-auto border-b border-slate-800 pb-3">
                {visibleTabs.map((tab) => {
                  const isActive = activeTab === tab;
                  const label = tab === "ALL" ? "All Records" : tab;

                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab);
                        setShowAllRecords(false);
                      }}
                      className={`shrink-0 border-b-2 px-1 pb-2 text-sm transition ${
                        isActive
                          ? "border-blue-500 text-blue-300"
                          : "border-transparent text-slate-300 hover:text-blue-300"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-300">
                      <th className="px-3 py-3 font-semibold">Type</th>
                      <th className="px-3 py-3 font-semibold">Name</th>
                      <th className="px-3 py-3 font-semibold">Value</th>
                      <th className="px-3 py-3 font-semibold">TTL</th>
                      <th className="px-3 py-3 font-semibold">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {displayedRecords.map((record) => (
                      <RecordRow key={record.id} record={record} />
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredRecords.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-slate-400">
                  No {activeTab === "ALL" ? "DNS" : activeTab} records found
                  for this lookup.
                </div>
              )}

              {filteredRecords.length > 6 && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowAllRecords((current) => !current)}
                    className="inline-flex min-w-[12rem] items-center justify-center gap-2 rounded-lg border border-blue-500/40 px-4 py-2 text-sm text-blue-300 transition hover:bg-blue-500/10"
                  >
                    {showAllRecords
                      ? "Show Fewer Records"
                      : `View All ${filteredRecords.length} Records`}
                    <ChevronDown
                      className={`transition ${showAllRecords ? "rotate-180" : ""}`}
                      size={16}
                    />
                  </button>
                </div>
              )}
            </section>

            <aside className="space-y-5">
              <DetailPanel title="SOA Record" rows={soaRows} />

              <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/15 text-emerald-300">
                    <ShieldCheck size={24} />
                  </span>
                  <div>
                    <h2 className="font-semibold">DNSSEC</h2>
                    <p
                      className={`mt-1 text-sm ${
                        result.dnssec.enabled
                          ? "text-emerald-300"
                          : "text-slate-400"
                      }`}
                    >
                      DNSSEC is {result.dnssec.status} for this domain.
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <DetailRows rows={dnssecRows} title="DNSSEC" />
                </div>
              </section>
            </aside>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/65 px-5 py-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2">
              <Info size={16} />
              DNS lookup results may vary depending on the DNS server used and
              caching.
            </span>
            <span>Lookup Time: {result.lookupMs} ms</span>
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: IconComponent;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-4">
      <Icon className="mt-1 text-blue-300" size={20} />
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="mt-1 break-words text-slate-100">{value}</p>
      </div>
    </div>
  );
}

function DetailPanel({ title, rows }: { title: string; rows: DetailRow[] }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/55 p-5">
      <h2 className="font-semibold">{title}</h2>
      <DetailRows rows={rows} title={title} />
    </section>
  );
}

function DetailRows({ rows, title }: { rows: DetailRow[]; title: string }) {
  return (
    <div className="mt-4 divide-y divide-slate-800">
      {rows.map((row) => (
        <div
          key={`${title}-${row.label}`}
          className="grid grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)] gap-4 py-2 text-sm"
        >
          <span className="text-slate-400">{row.label}</span>
          <span className="min-w-0 text-right text-slate-100">
            {row.badge ? (
              <span
                className={`inline-flex max-w-full rounded-md px-2 py-0.5 text-xs font-semibold ${getBadgeClass(
                  row.badge
                )}`}
              >
                <span className="truncate">{row.value}</span>
              </span>
            ) : (
              <span className="break-words">{row.value}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function RecordRow({ record }: { record: DnsRecord }) {
  return (
    <tr>
      <td className="px-3 py-3">
        <span
          className={`rounded-md px-2 py-1 text-xs font-semibold ${
            recordTypeStyles[record.type]
          }`}
        >
          {record.type}
        </span>
      </td>
      <td className="px-3 py-3 text-slate-300">{record.name}</td>
      <td className="max-w-[24rem] px-3 py-3">
        <span className="break-words text-slate-100">{record.value}</span>
      </td>
      <td className="px-3 py-3 text-slate-300">{record.ttl}</td>
      <td className="px-3 py-3 text-slate-300">{record.priority}</td>
    </tr>
  );
}

function CopyButton({
  value,
  copiedValue,
  onCopy,
  label,
}: {
  value: string;
  copiedValue: string;
  onCopy: (value: string) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onCopy(value)}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-300 transition hover:border-blue-500 hover:text-blue-300"
      aria-label={label}
      title={copiedValue === value ? "Copied" : label}
    >
      {copiedValue === value ? <CheckCircle2 size={16} /> : <Copy size={16} />}
    </button>
  );
}

function getBadgeClass(badge: DetailRow["badge"]) {
  if (badge === "green") {
    return "bg-emerald-500/15 text-emerald-300";
  }

  if (badge === "blue") {
    return "bg-blue-500/15 text-blue-300";
  }

  return "bg-slate-700 text-slate-300";
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

function formatLookupDate(value: string) {
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
  });
}

function formatNameServers(nameServers: string[]) {
  if (nameServers.length === 0) {
    return "Not available";
  }

  return nameServers.slice(0, 2).join("\n");
}
