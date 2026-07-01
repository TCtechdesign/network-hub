"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  AlertCircle,
  Building2,
  Cable,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  Gauge,
  Globe2,
  Hash,
  Info,
  Loader2,
  MapPin,
  Network,
  Search,
  ShieldCheck,
  Wifi,
} from "lucide-react";
import { FormEvent, useState } from "react";
import SiteNav from "@/components/SiteNav";
import { tools, type ToolIcon } from "@/data/tools";
import {
  classifyIpAddress,
  createInvalidLookupResult,
  createLocalLookupResult,
  createUnavailablePublicLookupResult,
  demoIpLookupResult,
  normalizeIpInput,
  type IpLookupResult,
} from "@/lib/ipLookup";

type IconComponent = typeof MapPin;

type DetailRow = {
  label: string;
  value: string;
  badge?: "green" | "blue" | "amber" | "slate";
};

const iconMap: Record<ToolIcon, IconComponent> = {
  "map-pin": MapPin,
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

export default function IpAddressLookupPage() {
  const [query, setQuery] = useState(demoIpLookupResult.ip);
  const [result, setResult] = useState<IpLookupResult>(demoIpLookupResult);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function runLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = query.trim();
    const startedAt = performance.now();

    if (!value) {
      setError("Enter an IP address first.");
      return;
    }

    setIsLoading(true);
    setError("");
    setCopied(false);

    try {
      const response = await fetch(
        `/api/ip-lookup?ip=${encodeURIComponent(value)}`,
        {
          cache: "no-store",
        }
      );
      const data = (await response.json()) as IpLookupResult;

      setResult(data);

      if (!response.ok || data.status === "invalid") {
        setError(data.message ?? "That IP address could not be looked up.");
      } else if (data.status === "unavailable") {
        setError(
          data.message ??
            "The public lookup provider did not return live details for this IP."
        );
      }
    } catch {
      const fallbackResult = createClientFallbackResult(
        value,
        Math.round(performance.now() - startedAt)
      );

      setResult(fallbackResult);
      setError(
        fallbackResult.status === "invalid"
          ? fallbackResult.message ?? "That IP address could not be looked up."
          : "The live lookup service is unavailable, so this is the local classification."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function copyIp() {
    try {
      await navigator.clipboard.writeText(result.ip);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const ipInformation: DetailRow[] = [
    { label: "IP Version", value: result.version },
    { label: "Reverse DNS", value: result.identity.reverseDns },
    { label: "Hostname", value: result.identity.hostname },
    {
      label: "IP Type",
      value: result.ipType,
      badge: result.isPublic ? "green" : "amber",
    },
    { label: "Proxy", value: result.security.proxy, badge: "green" },
    { label: "VPN", value: result.security.vpn, badge: "green" },
    { label: "TOR", value: result.security.tor, badge: "green" },
    { label: "Abuse Contact", value: result.identity.abuseContact, badge: "blue" },
  ];

  const networkInformation: DetailRow[] = [
    { label: "ASN", value: result.network.asn },
    { label: "ASN Name", value: result.network.asnName },
    { label: "Network", value: result.network.network },
    { label: "CIDR", value: result.network.cidr },
    { label: "Netmask", value: result.network.netmask },
    { label: "Route", value: result.network.route },
    { label: "Country Code", value: result.network.countryCode },
  ];

  const connectionDetails: DetailRow[] = [
    { label: "IP", value: result.connection.ip },
    { label: "ISP", value: result.connection.isp },
    { label: "Organization", value: result.connection.organization },
    { label: "Connection Type", value: result.connection.connectionType },
    { label: "Services", value: result.connection.services },
    { label: "Usage Type", value: result.connection.usageType },
  ];

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
                const isActive = tool.slug === "ip-address-lookup";

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
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-500/40 bg-blue-500/10 text-blue-300">
                  <ShieldCheck size={20} />
                </span>
                <h2 className="font-semibold">Lookup Notes</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Public IP results are approximate. Private IPs show local
                network details instead of fake location data.
              </p>
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
            <span>IP Address Lookup</span>
          </div>

          <div className="mt-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              IP Address Lookup
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
              Lookup IP address details including approximate location, ISP,
              organization, network information, and private address status.
            </p>
          </div>

          <form
            onSubmit={runLookup}
            className="mt-6 rounded-lg border border-slate-800 bg-slate-950/65 p-5 shadow-[0_0_60px_rgba(14,165,233,0.06)]"
          >
            <label
              htmlFor="ip-address"
              className="text-sm font-medium text-slate-300"
            >
              Enter an IP address
            </label>
            <div className="mt-2 grid gap-3 md:grid-cols-[minmax(0,1fr)_16rem]">
              <input
                id="ip-address"
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="8.8.8.8"
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
            <div className="mt-3 flex flex-col gap-2 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <span>Supports IPv4 and IPv6 addresses</span>
              <span>Try 1.1.1.1, 8.8.8.8, or 192.168.1.1</span>
            </div>
            {error && (
              <p className="mt-3 flex items-center gap-2 text-sm text-amber-300">
                <AlertCircle size={16} />
                {error}
              </p>
            )}
          </form>

          <section className="mt-5 grid gap-6 rounded-lg border border-slate-800 bg-slate-950/65 p-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,0.85fr)_minmax(19rem,1.15fr)]">
            <div>
              <div className="flex items-start gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="break-all text-3xl font-bold">
                      {result.ip || "No IP"}
                    </h2>
                    <button
                      type="button"
                      onClick={copyIp}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-300 transition hover:border-blue-500 hover:text-blue-300"
                      aria-label="Copy IP address"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  <p className="mt-2 text-slate-300">{result.label}</p>
                  {copied && (
                    <p className="mt-1 text-xs text-green-300">Copied</p>
                  )}
                </div>
              </div>

              <span
                className={`mt-4 inline-flex rounded-md px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(
                  result
                )}`}
              >
                {result.version} {result.ipType}
              </span>

              <p className="mt-4 text-sm leading-6 text-slate-400">
                {result.summary}
              </p>

              <div className="mt-5 space-y-4 text-sm">
                <SummaryRow
                  icon={Wifi}
                  label="ISP"
                  value={result.identity.isp}
                />
                <SummaryRow
                  icon={Building2}
                  label="Organization"
                  value={result.identity.organization}
                />
                <SummaryRow
                  icon={Network}
                  label="ASN"
                  value={result.identity.asn}
                />
                <SummaryRow
                  icon={Globe2}
                  label="Domain"
                  value={result.identity.domain}
                />
              </div>
            </div>

            <div className="border-slate-800 xl:border-l xl:pl-5">
              <div className="space-y-5 text-sm">
                <SummaryRow
                  icon={MapPin}
                  label="Location"
                  value={`${result.location.cityRegion}\n${result.location.country}`}
                />
                <SummaryRow
                  icon={Hash}
                  label="Latitude / Longitude"
                  value={result.location.latitudeLongitude}
                />
                <SummaryRow
                  icon={Clock3}
                  label="Timezone"
                  value={`${result.location.timezone}\n${result.location.localTime}`}
                />
                <SummaryRow
                  icon={MapPin}
                  label="Postal Code"
                  value={result.location.postalCode}
                />
              </div>
            </div>

            <MapPanel result={result} />
          </section>

          <div className="mt-5 grid gap-5 xl:grid-cols-3">
            <DetailPanel title="IP Information" rows={ipInformation} />
            <DetailPanel title="Network Information" rows={networkInformation} />
            <DetailPanel title="Connection Details" rows={connectionDetails} />
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/65 px-5 py-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2">
              <Info size={16} />
              Results are for informational purposes only. IP geolocation is not
              exact.
            </span>
            <span>Lookup Time: {result.lookupMs} ms</span>
          </div>
        </section>
      </div>
    </main>
  );
}

function createClientFallbackResult(ipInput: string, lookupMs: number) {
  const ip = normalizeIpInput(ipInput);
  const classification = classifyIpAddress(ip);

  if (!classification) {
    return createInvalidLookupResult(ip, lookupMs);
  }

  if (!classification.isPublic) {
    return createLocalLookupResult(ip, classification, lookupMs);
  }

  return createUnavailablePublicLookupResult(ip, classification, lookupMs);
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
    <div className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3">
      <Icon className="mt-1 text-blue-300" size={17} />
      <div>
        <p className="text-slate-400">{label}</p>
        <p className="mt-1 whitespace-pre-line break-words text-slate-100">
          {value}
        </p>
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
            className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] gap-4 py-2 text-sm"
          >
            <span className="text-slate-400">{row.label}</span>
            <span className="min-w-0 text-right text-slate-100">
              {row.badge ? (
                <span
                  className={`inline-flex max-w-full rounded-md px-2 py-0.5 text-xs font-semibold ${getRowBadgeClass(
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

function MapPanel({ result }: { result: IpLookupResult }) {
  const pinStyle = getPinStyle(result.coordinates);

  return (
    <div className="relative min-h-[17rem] overflow-hidden rounded-lg border border-slate-800 bg-[#061426] shadow-[inset_0_0_46px_rgba(14,165,233,0.12)]">
      <Image
        src="/images/map.png"
        alt=""
        fill
        sizes="(max-width: 1280px) 100vw, 34rem"
        loading="eager"
        className="object-cover opacity-95"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_42%,rgba(37,99,235,0.16),transparent_32%),linear-gradient(180deg,rgba(2,8,23,0.12),rgba(2,8,23,0.02)_48%,rgba(2,8,23,0.28))]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.045)_1px,transparent_1px)] bg-[size:40px_40px]" />

      {result.coordinates ? (
        <div
          className="absolute z-10 -translate-x-1/2 -translate-y-full text-blue-400 drop-shadow-[0_0_18px_rgba(59,130,246,0.95)]"
          style={pinStyle}
        >
          <MapPin className="fill-blue-500/80" size={44} />
        </div>
      ) : (
        <div className="absolute inset-x-6 top-1/2 z-10 -translate-y-1/2 rounded-lg border border-slate-700/80 bg-slate-950/80 p-4 text-center backdrop-blur">
          <p className="font-semibold text-slate-200">No public map available</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Private and local IP addresses do not have public location
            coordinates.
          </p>
        </div>
      )}

      <div className="absolute bottom-4 right-4 z-10 rounded-lg border border-slate-700/80 bg-slate-950/85 px-3 py-2 backdrop-blur">
        {result.location.mapUrl ? (
          <a
            href={result.location.mapUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-300 transition hover:text-blue-200"
          >
            View on Map
            <ExternalLink size={15} />
          </a>
        ) : (
          <span className="text-sm text-slate-500">No public map available</span>
        )}
      </div>
    </div>
  );
}

function getPinStyle(coordinates: IpLookupResult["coordinates"]) {
  if (!coordinates) {
    return {
      left: "50%",
      top: "50%",
    };
  }

  const latitude = coordinates.latitude;
  const longitude = coordinates.longitude;
  const left = ((longitude + 180) / 360) * 100;
  const top = ((90 - latitude) / 180) * 100;

  return {
    left: `${clamp(left, 8, 92)}%`,
    top: `${clamp(top, 12, 86)}%`,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getStatusBadgeClass(result: IpLookupResult) {
  if (result.status === "invalid") {
    return "bg-red-500/15 text-red-300";
  }

  if (!result.isPublic) {
    return "bg-amber-500/15 text-amber-300";
  }

  if (result.status === "unavailable") {
    return "bg-slate-700/80 text-slate-200";
  }

  return "bg-green-500/15 text-green-300";
}

function getRowBadgeClass(badge: DetailRow["badge"]) {
  if (badge === "green") {
    return "bg-green-500/15 text-green-300";
  }

  if (badge === "blue") {
    return "bg-blue-500/15 text-blue-300";
  }

  if (badge === "amber") {
    return "bg-amber-500/15 text-amber-300";
  }

  return "bg-slate-700/80 text-slate-200";
}
