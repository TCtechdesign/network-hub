"use client";

import Link from "next/link";
import {
  Activity,
  AlertCircle,
  Building2,
  Cable,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  Cpu,
  Crown,
  ExternalLink,
  Gauge,
  Globe2,
  Info,
  Loader2,
  Monitor,
  Network,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
} from "lucide-react";
import { FormEvent, useState } from "react";
import SiteNav from "@/components/SiteNav";
import { tools, type ToolIcon } from "@/data/tools";
import {
  demoMacLookupResult,
  type MacLookupResult,
} from "@/lib/macLookup";

type IconComponent = typeof Network;

type DetailRow = {
  label: string;
  value: string;
  badge?: "green" | "blue" | "amber" | "slate";
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

const octetAccentClasses = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-fuchsia-500",
  "bg-emerald-500",
  "bg-amber-400",
  "bg-yellow-300",
];

export default function MacAddressLookupPage() {
  const [query, setQuery] = useState(demoMacLookupResult.formatted);
  const [result, setResult] = useState<MacLookupResult>(demoMacLookupResult);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedValue, setCopiedValue] = useState("");

  const detailRows: DetailRow[] = [
    { label: "MAC Address", value: result.formatted },
    { label: "Vendor", value: result.vendor.name },
    { label: "Organization", value: result.vendor.organization },
    { label: "Address Block", value: result.allocation.addressBlock },
    { label: "IEEE Assignment", value: result.classification.ieeeAssignment },
    { label: "Assignment Date", value: result.vendor.assignmentDate },
    { label: "Address Type", value: result.classification.addressType },
    { label: "Local / Global", value: result.classification.localGlobal },
    { label: "Multicast", value: result.classification.multicast },
    { label: "Broadcast", value: result.classification.broadcast },
  ];

  async function runLookup(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const mac = query.trim();

    if (!mac) {
      setError("Enter a MAC address first.");
      return;
    }

    setIsLoading(true);
    setError("");
    setCopiedValue("");

    try {
      const response = await fetch(
        `/api/mac-lookup?mac=${encodeURIComponent(mac)}`,
        { cache: "no-store" }
      );
      const data = (await response.json()) as MacLookupResult;

      setResult(data);
      setUpdatedAt(new Date());

      if (!response.ok || data.status === "invalid") {
        setError(data.message ?? "That MAC address could not be analyzed.");
      } else if (data.status === "unknown") {
        setError(
          data.message ??
            "The MAC address is valid, but the vendor was not found locally."
        );
      }
    } catch {
      setError("MAC lookup is unavailable right now. The example result is still shown.");
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
                const isActive = tool.slug === "mac-address-lookup";

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
                Unlock larger OUI datasets, history, and priority support.
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
            <span>MAC Address Lookup</span>
          </div>

          <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                MAC Address Lookup
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
                Lookup MAC address details including vendor, organization, OUI,
                and address type.
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
              htmlFor="mac-address"
              className="text-sm font-medium text-slate-300"
            >
              Enter MAC Address
            </label>
            <div className="mt-2 grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
              <input
                id="mac-address"
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="00:1A:2B:3C:4D:5E"
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
            <p className="mt-3 text-sm text-slate-400">
              Example: 00:1A:2B:3C:4D:5E or 001A.2B3C.4D5E
            </p>

            {error && (
              <p className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                <AlertCircle size={17} />
                {error}
              </p>
            )}
          </form>

          <section className="mt-5 grid gap-6 rounded-lg border border-slate-800 bg-slate-950/65 p-5 shadow-[0_0_60px_rgba(14,165,233,0.06)] xl:grid-cols-[minmax(0,0.85fr)_minmax(0,0.86fr)_minmax(18rem,0.7fr)]">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="break-all text-3xl font-bold tracking-tight">
                  {result.formatted}
                </h2>
                <CopyButton
                  value={result.formatted}
                  copiedValue={copiedValue}
                  onCopy={copyValue}
                  label="Copy MAC address"
                />
              </div>

              <span
                className={`mt-4 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(
                  result
                )}`}
              >
                {getStatusLabel(result)}
              </span>

              <p className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm leading-6 text-slate-300">
                {result.lookupHint}
              </p>

              <div className="mt-6 space-y-5">
                <SummaryRow
                  icon={Globe2}
                  label="Address Type"
                  value={result.classification.addressType}
                />
                <SummaryRow
                  icon={ShieldCheck}
                  label="Local / Global"
                  value={result.classification.localGlobal}
                />
                <SummaryRow
                  icon={Network}
                  label="MAC Address Format"
                  value={result.classification.format}
                />
              </div>
            </div>

            <div className="space-y-5 border-slate-800 xl:border-l xl:pl-6">
              <SummaryRow
                icon={Building2}
                label="Vendor"
                value={result.vendor.name}
              />
              <SummaryRow
                icon={Server}
                label="Organization"
                value={result.vendor.organization}
              />
              <SummaryRow
                icon={Network}
                label="Address Allocation"
                value={result.allocation.assignmentBlock}
              />
              <SummaryRow
                icon={Clock3}
                label="First Seen"
                value={result.vendor.firstSeen}
              />
              <SummaryRow
                icon={Clock3}
                label="Last Seen"
                value={result.vendor.lastSeen}
              />
            </div>

            <VendorPanel result={result} />
          </section>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)]">
            <DetailPanel title="MAC Address Details" rows={detailRows} />

            <div className="space-y-5">
              <MacBreakdown result={result} />
              <UsagePanel />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/65 px-5 py-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2">
              <Info size={16} />
              Vendor data is local-only. Full MAC addresses are not sent to a
              third-party lookup service.
            </span>
            <span>
              {result.source} - Lookup Time: {result.lookupMs} ms
            </span>
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
    <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
      <h2 className="font-semibold">{title}</h2>
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
    </section>
  );
}

function VendorPanel({ result }: { result: MacLookupResult }) {
  return (
    <div className="flex min-h-[13rem] flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-950/55 p-5 text-center">
      <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-blue-500/70 bg-blue-500/10 text-2xl font-black tracking-wide text-blue-300 shadow-[0_0_42px_rgba(59,130,246,0.18)]">
        {getVendorMark(result.vendor.name)}
      </div>
      <h2 className="mt-5 text-xl font-bold">{result.vendor.name}</h2>
      {result.vendor.website !== "Not available" ? (
        <a
          href={result.vendor.website}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 break-all text-sm text-blue-300 transition hover:text-blue-200"
        >
          {result.vendor.website}
          <ExternalLink size={15} />
        </a>
      ) : (
        <p className="mt-3 text-sm text-slate-400">No vendor website available</p>
      )}
    </div>
  );
}

function MacBreakdown({ result }: { result: MacLookupResult }) {
  const hasOctets = result.allocation.octets.length === 6;

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
      <h2 className="font-semibold">MAC Address Breakdown</h2>

      {hasOctets ? (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 font-mono text-lg text-slate-100">
            {result.allocation.octets.map((octet, index) => (
              <div key={`${octet}-${index}`} className="flex items-center gap-3">
                <span className="text-center">
                  <span>{octet}</span>
                  <span
                    className={`mt-2 block h-1 rounded-full ${
                      octetAccentClasses[index]
                    }`}
                  />
                </span>
                {index < result.allocation.octets.length - 1 && (
                  <span className="text-slate-500">:</span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-center text-sm">
              <p className="text-slate-400">OUI (24 bits)</p>
              <p className="mt-2 font-mono text-slate-100">
                {result.allocation.oui}
              </p>
              <p className="mt-1 text-slate-300">{result.vendor.name}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-center text-sm">
              <p className="text-slate-400">NIC Specific (24 bits)</p>
              <p className="mt-2 font-mono text-slate-100">
                {result.allocation.nic}
              </p>
              <p className="mt-1 text-slate-300">Device Specific</p>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm text-slate-400">
          Enter a valid MAC address to see the OUI and device-specific
          breakdown.
        </p>
      )}
    </section>
  );
}

function UsagePanel() {
  const usageItems = [
    { label: "Network Devices (Routers, Switches, Access Points)", icon: Network },
    { label: "Server Network Interfaces", icon: Server },
    { label: "Virtual Machines", icon: Monitor },
    { label: "IoT / Embedded Devices", icon: Cpu },
  ];

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
      <h2 className="font-semibold">Where This MAC Might Be Used</h2>
      <div className="mt-4 space-y-3 text-sm text-slate-300">
        {usageItems.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3"
            >
              <span className="flex min-w-0 items-center gap-3">
                <Icon className="shrink-0 text-blue-300" size={18} />
                <span>{item.label}</span>
              </span>
              <CheckCircle2 className="shrink-0 text-emerald-400" size={18} />
            </div>
          );
        })}
      </div>
    </section>
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

  if (badge === "amber") {
    return "bg-amber-500/15 text-amber-300";
  }

  return "bg-slate-700 text-slate-300";
}

function getVendorMark(vendorName: string) {
  if (vendorName.toLowerCase().includes("dell")) {
    return "DELL";
  }

  if (
    vendorName === "Unknown Vendor" ||
    vendorName === "Private / Randomized MAC"
  ) {
    return "OUI";
  }

  return vendorName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getStatusBadgeClass(result: MacLookupResult) {
  if (result.status === "invalid") {
    return "bg-red-500/15 text-red-300";
  }

  if (result.status === "unknown") {
    return result.classification.localGlobal === "Locally Administered"
      ? "bg-blue-500/15 text-blue-300"
      : "bg-amber-500/15 text-amber-300";
  }

  return "bg-emerald-500/15 text-emerald-300";
}

function getStatusLabel(result: MacLookupResult) {
  if (result.status === "invalid") {
    return "Invalid MAC Address";
  }

  if (result.status === "unknown") {
    return result.classification.localGlobal === "Locally Administered"
      ? "Valid Private MAC"
      : "Valid MAC, Vendor Unknown";
  }

  return "Valid MAC Address";
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
