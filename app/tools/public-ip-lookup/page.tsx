"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  Cable,
  CheckCircle2,
  ChevronRight,
  Copy,
  Crown,
  ExternalLink,
  Gauge,
  Globe2,
  Loader2,
  MapPin,
  Network,
  RefreshCw,
  ShieldCheck,
  Wifi,
} from "lucide-react";
import { useEffect, useState } from "react";
import SiteNav from "@/components/SiteNav";
import { tools, type ToolIcon } from "@/data/tools";
import { demoIpLookupResult, type IpLookupResult } from "@/lib/ipLookup";

type IconComponent = typeof MapPin;

type DetailRow = {
  label: string;
  value: string;
  badge?: "green" | "blue" | "slate";
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

const demoPublicIpResult: IpLookupResult = {
  ...demoIpLookupResult,
  ip: "203.0.113.45",
  label: "Example ISP, Inc.",
  summary: "This is the public IP address visible to the internet.",
  lookupMs: 142,
  coordinates: {
    latitude: 40.7128,
    longitude: -74.006,
  },
  location: {
    cityRegion: "New York, New York",
    country: "United States",
    latitudeLongitude: "40.7128° N, 74.0060° W",
    timezone: "America/New_York",
    localTime: "Example local time",
    postalCode: "10001",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=40.7128,-74.006",
  },
  identity: {
    isp: "Example ISP, Inc.",
    organization: "Example ISP, Inc.",
    asn: "AS12345",
    domain: "example-isp.com",
    reverseDns: "203.0.113.45.in-addr.arpa",
    hostname: "host-203-0-113-45.isp.net",
    abuseContact: "abuse@example-isp.com",
  },
  network: {
    asn: "AS12345",
    asnName: "EXAMPLE-ISP",
    network: "203.0.113.0/24",
    cidr: "203.0.113.0/24",
    netmask: "255.255.255.0",
    route: "203.0.113.0/24",
    countryCode: "US",
  },
  connection: {
    ip: "203.0.113.45",
    isp: "Example ISP, Inc.",
    organization: "Example ISP, Inc.",
    connectionType: "Cable",
    services: "Internet access",
    usageType: "Residential or business ISP",
  },
};

export default function PublicIpLookupPage() {
  const [result, setResult] = useState<IpLookupResult>(demoPublicIpResult);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedValue, setCopiedValue] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadInitialPublicIp() {
      try {
        const { response, data } = await requestPublicIpResult();

        if (!isMounted) {
          return;
        }

        setResult(data);
        setUpdatedAt(new Date());

        if (!response.ok || data.status === "unavailable") {
          setError(
            data.message ??
              "Public IP lookup is unavailable, so the example result is still shown."
          );
        }
      } catch {
        if (!isMounted) {
          return;
        }

        setError(
          "Public IP lookup is unavailable, so the example result is still shown."
        );
        setUpdatedAt(new Date());
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialPublicIp();

    return () => {
      isMounted = false;
    };
  }, []);

  async function refreshPublicIp() {
    setIsLoading(true);
    setError("");
    setCopiedValue("");

    try {
      const { response, data } = await requestPublicIpResult();

      setResult(data);
      setUpdatedAt(new Date());

      if (!response.ok || data.status === "unavailable") {
        setError(
          data.message ??
            "Public IP lookup is unavailable, so the example result is still shown."
        );
      }
    } catch {
      setError("Public IP lookup is unavailable, so the example result is still shown.");
      setUpdatedAt(new Date());
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

  const countryCode = result.network.countryCode;
  const locationParts = parseLocation(result.location.cityRegion);
  const publicIpCardRows: DetailRow[] = [
    { label: "IP Version", value: result.version },
    { label: "IP Address", value: result.ip },
    { label: "Reverse DNS", value: result.identity.reverseDns },
    { label: "Hostname", value: result.identity.hostname },
    { label: "IP Type", value: result.ipType, badge: "green" },
    { label: "Proxy", value: result.security.proxy, badge: getSafetyBadge(result.security.proxy) },
    { label: "VPN", value: result.security.vpn, badge: getSafetyBadge(result.security.vpn) },
    { label: "TOR", value: result.security.tor, badge: getSafetyBadge(result.security.tor) },
  ];
  const geolocationRows: DetailRow[] = [
    {
      label: "Country",
      value: `${result.location.country} ${countryFlag(countryCode)}`.trim(),
    },
    { label: "Region", value: locationParts.region },
    { label: "City", value: locationParts.city },
    { label: "ZIP / Postal Code", value: result.location.postalCode },
    { label: "Latitude", value: formatCoordinatePart(result.coordinates?.latitude) },
    { label: "Longitude", value: formatCoordinatePart(result.coordinates?.longitude) },
    { label: "Timezone", value: result.location.timezone },
    { label: "Local Time", value: result.location.localTime },
  ];
  const ispRows: DetailRow[] = [
    { label: "ISP", value: result.identity.isp },
    { label: "ASN", value: result.identity.asn },
    { label: "ASN Name", value: result.network.asnName },
    { label: "Organization", value: result.identity.organization },
    { label: "Connection Type", value: result.connection.connectionType },
    { label: "Network", value: result.network.network },
    { label: "Abuse Email", value: result.identity.abuseContact, badge: "blue" },
    { label: "Website", value: getWebsiteUrl(result.identity.domain), badge: "blue" },
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
                const isActive = tool.slug === "public-ip-lookup";

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
                Unlock advanced features, history, and priority support.
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
            <span>Public IP Lookup</span>
          </div>

          <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Public IP Lookup
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
                Find your public IP address and view details about your internet
                connection and ISP.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span>Last updated: {formatUpdatedAt(updatedAt)}</span>
              <button
                type="button"
                onClick={refreshPublicIp}
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

          {error && (
            <p className="mt-5 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <AlertCircle size={17} />
              {error}
            </p>
          )}

          <section className="mt-6 grid gap-6 rounded-lg border border-slate-800 bg-slate-950/65 p-5 shadow-[0_0_60px_rgba(14,165,233,0.06)] xl:grid-cols-[minmax(0,0.78fr)_minmax(0,0.88fr)_minmax(20rem,1.05fr)]">
            <div className="flex flex-col justify-center">
              <p className="font-semibold text-slate-100">Your Public IP Address</p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <h2 className="break-all text-4xl font-bold tracking-tight sm:text-5xl">
                  {result.ip}
                </h2>
                <CopyButton
                  value={result.ip}
                  copiedValue={copiedValue}
                  onCopy={copyValue}
                  label="Copy public IP address"
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300">
                  {result.version}
                </span>
                <span className="inline-flex items-center gap-2 text-sm text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Internet is reachable
                </span>
              </div>
            </div>

            <div className="space-y-5 border-slate-800 xl:border-l xl:pl-6">
              <SummaryRow
                icon={Wifi}
                label="ISP"
                value={result.identity.isp}
              />
              <SummaryRow
                icon={MapPin}
                label="Location"
                value={`${result.location.cityRegion}, ${result.location.country} ${countryFlag(
                  countryCode
                )}`.trim()}
              />
              <SummaryRow
                icon={Network}
                label="Connection Type"
                value={result.connection.connectionType}
              />
            </div>

            <MapPreview result={result} />
          </section>

          <div className="mt-5 grid gap-5 xl:grid-cols-3">
            <DetailPanel title="IP Information" rows={publicIpCardRows} />
            <DetailPanel title="Geolocation" rows={geolocationRows} />
            <DetailPanel title="ISP & Connection" rows={ispRows} />
          </div>

          <section className="mt-5 rounded-lg border border-slate-800 bg-slate-950/65 p-5">
            <h2 className="font-semibold">IP Addresses</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <AddressTile
                label="IPv4 Address"
                value={result.version === "IPv4" ? result.ip : "Not Detected"}
                status={result.version === "IPv4" ? "Public" : "N/A"}
                copiedValue={copiedValue}
                onCopy={copyValue}
              />
              <AddressTile
                label="IPv6 Address"
                value={result.version === "IPv6" ? result.ip : "Not Detected"}
                status={result.version === "IPv6" ? "Public" : "N/A"}
                copiedValue={copiedValue}
                onCopy={copyValue}
              />
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-800 pt-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                This is the public IP address visible to the internet.
              </span>
              <span>Lookup Time: {result.lookupMs} ms</span>
            </div>
          </section>
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

function AddressTile({
  label,
  value,
  status,
  copiedValue,
  onCopy,
}: {
  label: string;
  value: string;
  status: string;
  copiedValue: string;
  onCopy: (value: string) => void;
}) {
  const isDetected = value !== "Not Detected";

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/55 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span
          className={`break-all text-2xl font-semibold ${
            isDetected ? "text-white" : "text-slate-400"
          }`}
        >
          {value}
        </span>
        <span
          className={`rounded-md px-2 py-1 text-xs font-semibold ${
            status === "Public"
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-slate-700 text-slate-300"
          }`}
        >
          {status}
        </span>
        {isDetected && (
          <CopyButton
            value={value}
            copiedValue={copiedValue}
            onCopy={onCopy}
            label={`Copy ${label}`}
          />
        )}
      </div>
    </div>
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
      <Copy size={16} />
    </button>
  );
}

function MapPreview({ result }: { result: IpLookupResult }) {
  const pinStyle = getPinStyle(result.coordinates);

  return (
    <div className="relative min-h-[13rem] overflow-hidden rounded-lg border border-slate-800 bg-[#061426]">
      <Image
        src="/images/map.png"
        alt=""
        fill
        sizes="(max-width: 1280px) 100vw, 28rem"
        loading="eager"
        className="object-cover opacity-95"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,23,0.08),rgba(2,8,23,0.16))]" />

      {result.coordinates && (
        <div
          className="absolute z-10 -translate-x-1/2 -translate-y-full text-blue-400 drop-shadow-[0_0_18px_rgba(59,130,246,0.95)]"
          style={pinStyle}
        >
          <MapPin className="fill-blue-500/85" size={42} />
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-blue-500/40 bg-slate-950/85 px-3 py-2 backdrop-blur">
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

  const left = ((coordinates.longitude + 180) / 360) * 100;
  const top = ((90 - coordinates.latitude) / 180) * 100;

  return {
    left: `${clamp(left, 8, 92)}%`,
    top: `${clamp(top, 12, 86)}%`,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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

function getSafetyBadge(value: string): DetailRow["badge"] {
  return value.toLowerCase() === "yes" ? "slate" : "green";
}

function parseLocation(value: string) {
  const parts = value.split(",").map((part) => part.trim()).filter(Boolean);

  return {
    city: parts[0] ?? "Not available",
    region: parts[1] ?? "Not available",
  };
}

function formatCoordinatePart(value: number | undefined) {
  return typeof value === "number" ? value.toFixed(4) : "Not available";
}

function formatUpdatedAt(value: Date | null) {
  if (!value) {
    return "Loading...";
  }

  return value.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getWebsiteUrl(domain: string) {
  return domain === "Not available" ? "Not available" : `https://www.${domain}`;
}

function countryFlag(countryCode: string) {
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return "";
  }

  return String.fromCodePoint(
    ...countryCode
      .split("")
      .map((letter) => 127397 + letter.charCodeAt(0))
  );
}

async function requestPublicIpResult() {
  const response = await fetch("/api/public-ip-lookup", {
    cache: "no-store",
  });
  const data = (await response.json()) as IpLookupResult;

  return { response, data };
}
