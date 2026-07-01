import { NextRequest } from "next/server";
import {
  classifyIpAddress,
  createUnavailablePublicLookupResult,
  demoIpLookupResult,
  normalizeIpInput,
  type IpLookupResult,
} from "@/lib/ipLookup";

export const runtime = "nodejs";

type PublicIpResponse = {
  ip?: string;
};

type FreeIpApiResponse = {
  ipVersion?: number;
  ipAddress?: string;
  latitude?: number;
  longitude?: number;
  countryName?: string;
  countryCode?: string;
  timeZones?: string[];
  zipCode?: string;
  cityName?: string;
  regionName?: string;
  asn?: string;
  asnOrganization?: string;
  isProxy?: boolean;
};

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const publicIp = await getPublicIpAddress(request);

  if (!publicIp) {
    return Response.json(
      {
        ...demoIpLookupResult,
        lookupMs: elapsed(startedAt),
        source: "Demo fallback",
        message: "The public IP address could not be detected right now.",
      },
      { status: 503 }
    );
  }

  const classification = classifyIpAddress(publicIp);

  if (!classification?.isPublic) {
    return Response.json(
      {
        ...demoIpLookupResult,
        lookupMs: elapsed(startedAt),
        source: "Demo fallback",
        message: "Only public internet addresses can be shown on this page.",
      },
      { status: 400 }
    );
  }

  const lookupResult = await lookupWithFreeIpApi(publicIp, elapsed(startedAt));

  if (lookupResult) {
    return Response.json(lookupResult);
  }

  return Response.json(
    createUnavailablePublicLookupResult(
      publicIp,
      classification,
      elapsed(startedAt)
    ),
    { status: 503 }
  );
}

async function getPublicIpAddress(request: NextRequest) {
  const headerIp = getPublicIpFromHeaders(request);

  if (headerIp) {
    return headerIp;
  }

  for (const url of [
    "https://api64.ipify.org?format=json",
    "https://api.ipify.org?format=json",
  ]) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        continue;
      }

      const data = (await response.json()) as PublicIpResponse;
      const ip = normalizeIpInput(data.ip ?? "");
      const classification = classifyIpAddress(ip);

      if (classification?.isPublic) {
        return ip;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function getPublicIpFromHeaders(request: NextRequest) {
  const headerValues = [
    request.headers.get("cf-connecting-ip"),
    request.headers.get("x-real-ip"),
    request.headers.get("x-forwarded-for")?.split(",")[0],
  ];

  for (const value of headerValues) {
    const ip = normalizeIpInput(value ?? "");
    const classification = classifyIpAddress(ip);

    if (classification?.isPublic) {
      return ip;
    }
  }

  return null;
}

async function lookupWithFreeIpApi(ip: string, lookupMs: number) {
  try {
    const response = await fetch(
      `https://freeipapi.com/api/json/${encodeURIComponent(ip)}`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Free IP lookup failed with ${response.status}`);
    }

    const data = (await response.json()) as FreeIpApiResponse;

    if (!data.ipAddress) {
      throw new Error("Free IP lookup returned no IP address");
    }

    return mapFreeIpApiLookup(data, ip, lookupMs);
  } catch {
    return null;
  }
}

function mapFreeIpApiLookup(
  data: FreeIpApiResponse,
  fallbackIp: string,
  lookupMs: number
): IpLookupResult {
  const ip = data.ipAddress ?? fallbackIp;
  const cityRegion = [data.cityName, data.regionName].filter(Boolean).join(", ");
  const latitude = data.latitude;
  const longitude = data.longitude;
  const hasCoordinates =
    typeof latitude === "number" && typeof longitude === "number";
  const organization = data.asnOrganization ?? "Not available";
  const asn = data.asn ? `AS${data.asn}` : "Not available";
  const version = data.ipVersion === 6 ? "IPv6" : "IPv4";
  const estimatedNetwork = estimateNetwork(ip, version);
  const domain = inferDomain(organization);

  return {
    status: "success",
    ip,
    label: organization,
    version,
    ipType: "Public",
    isPublic: true,
    summary:
      "This is the public IP address visible to websites and internet services.",
    source: "Public IP detection",
    lookupMs,
    coordinates: hasCoordinates
      ? {
          latitude,
          longitude,
        }
      : undefined,
    location: {
      cityRegion: cityRegion || "Not available",
      country: data.countryName ?? "Not available",
      latitudeLongitude: hasCoordinates
        ? formatCoordinates(latitude, longitude)
        : "Not available",
      timezone: data.timeZones?.[0] ?? "Not available",
      localTime: "Approximate timezone location",
      postalCode: data.zipCode ?? "Not available",
      mapUrl: hasCoordinates
        ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
        : undefined,
    },
    identity: {
      isp: organization,
      organization,
      asn,
      domain,
      reverseDns: domain,
      hostname: domain,
      abuseContact:
        domain === "Not available" ? "Not available" : `abuse@${domain}`,
    },
    network: {
      asn,
      asnName: organization,
      network: estimatedNetwork,
      cidr: estimatedNetwork,
      netmask: version === "IPv6" ? "Not used by IPv6" : "255.255.255.0",
      route: "Internet routable",
      countryCode: data.countryCode ?? "Not available",
    },
    connection: {
      ip,
      isp: organization,
      organization,
      connectionType: inferConnectionType(organization),
      services: inferService(ip, domain),
      usageType: inferUsageType(organization),
    },
    security: {
      proxy: data.isProxy ? "Yes" : "No",
      vpn: "Unknown",
      tor: "Unknown",
    },
  };
}

function elapsed(startedAt: number) {
  return Date.now() - startedAt;
}

function formatCoordinates(latitude: number, longitude: number) {
  const latDirection = latitude >= 0 ? "N" : "S";
  const lonDirection = longitude >= 0 ? "E" : "W";

  return `${Math.abs(latitude).toFixed(4)}° ${latDirection}, ${Math.abs(
    longitude
  ).toFixed(4)}° ${lonDirection}`;
}

function estimateNetwork(ip: string, version: "IPv4" | "IPv6") {
  if (version === "IPv6") {
    return "Provider assigned IPv6 prefix";
  }

  const parts = ip.split(".");

  if (parts.length !== 4) {
    return "Provider assigned";
  }

  return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
}

function inferConnectionType(organization: string) {
  const text = organization.toLowerCase();

  if (
    text.includes("cable") ||
    text.includes("comcast") ||
    text.includes("spectrum") ||
    text.includes("charter")
  ) {
    return "Cable";
  }

  if (
    text.includes("cloud") ||
    text.includes("google") ||
    text.includes("amazon") ||
    text.includes("cloudflare")
  ) {
    return "Corporate";
  }

  return "ISP";
}

function inferService(ip: string, domain: string) {
  if (
    ip === "8.8.8.8" ||
    ip === "8.8.4.4" ||
    ip === "1.1.1.1" ||
    ip === "1.0.0.1" ||
    domain.includes("dns")
  ) {
    return "DNS";
  }

  return "Internet access";
}

function inferUsageType(organization: string) {
  const text = organization.toLowerCase();

  if (
    text.includes("cloud") ||
    text.includes("google") ||
    text.includes("amazon") ||
    text.includes("cloudflare")
  ) {
    return "Content Delivery Network";
  }

  return "Residential or business ISP";
}

function inferDomain(organization: string) {
  const text = organization.toLowerCase();

  if (text.includes("cloudflare")) {
    return "cloudflare.com";
  }

  if (text.includes("google")) {
    return "google.com";
  }

  if (text.includes("amazon")) {
    return "amazon.com";
  }

  return "Not available";
}
