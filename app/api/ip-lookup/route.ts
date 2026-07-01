import { NextRequest } from "next/server";
import {
  classifyIpAddress,
  createInvalidLookupResult,
  createLocalLookupResult,
  createUnavailablePublicLookupResult,
  demoIpLookupResult,
  normalizeIpInput,
  type IpLookupResult,
} from "@/lib/ipLookup";

export const runtime = "nodejs";

type IpWhoIsResponse = {
  ip?: string;
  success?: boolean;
  message?: string;
  type?: string;
  country?: string;
  country_code?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  postal?: string;
  connection?: {
    asn?: number;
    org?: string;
    isp?: string;
    domain?: string;
  };
  timezone?: {
    id?: string;
    abbr?: string;
    current_time?: string;
  };
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
  const rawIp = request.nextUrl.searchParams.get("ip") ?? "";
  const ip = normalizeIpInput(rawIp);
  const classification = classifyIpAddress(ip);

  if (!classification) {
    return Response.json(createInvalidLookupResult(ip, elapsed(startedAt)), {
      status: 400,
    });
  }

  if (!classification.isPublic) {
    return Response.json(
      createLocalLookupResult(ip, classification, elapsed(startedAt))
    );
  }

  const freeIpApiResult = await lookupWithFreeIpApi(ip, elapsed(startedAt));

  if (freeIpApiResult) {
    return Response.json(freeIpApiResult);
  }

  const ipWhoIsResult = await lookupWithIpWhoIs(ip, elapsed(startedAt));

  if (ipWhoIsResult) {
    return Response.json(ipWhoIsResult);
  }

  if (ip === demoIpLookupResult.ip) {
    return Response.json({
      ...demoIpLookupResult,
      lookupMs: elapsed(startedAt),
      source: "Demo fallback",
    });
  }

  return Response.json(
    createUnavailablePublicLookupResult(ip, classification, elapsed(startedAt))
  );
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

async function lookupWithIpWhoIs(ip: string, lookupMs: number) {
  try {
    const response = await fetch(
      `https://ipwho.is/${encodeURIComponent(ip)}`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`IP lookup failed with ${response.status}`);
    }

    const data = (await response.json()) as IpWhoIsResponse;

    if (data.success === false) {
      throw new Error(data.message ?? "IP lookup returned no result");
    }

    return mapIpWhoIsLookup(data, ip, lookupMs);
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
      "This is a public IP address. Location is approximate and usually points to an ISP, data center, or service region.",
    source: "freeipapi public lookup",
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

function mapIpWhoIsLookup(
  data: IpWhoIsResponse,
  fallbackIp: string,
  lookupMs: number
): IpLookupResult {
  const ip = data.ip ?? fallbackIp;
  const cityRegion = [data.city, data.region].filter(Boolean).join(", ");
  const latitude = data.latitude;
  const longitude = data.longitude;
  const hasCoordinates =
    typeof latitude === "number" && typeof longitude === "number";
  const asn = data.connection?.asn ? `AS${data.connection.asn}` : "Not available";
  const organization =
    data.connection?.org ?? data.connection?.isp ?? "Not available";
  const domain = data.connection?.domain ?? "Not available";
  const timezone = data.timezone?.id ?? "Not available";
  const version = data.type === "IPv6" ? "IPv6" : "IPv4";
  const estimatedNetwork = estimateNetwork(ip, version);

  return {
    status: "success",
    ip,
    label: organization,
    version,
    ipType: "Public",
    isPublic: true,
    summary:
      "This is a public IP address. Location is approximate and usually points to an ISP, data center, or service region.",
    source: "ipwho.is public lookup",
    lookupMs,
    coordinates: hasCoordinates
      ? {
          latitude,
          longitude,
        }
      : undefined,
    location: {
      cityRegion: cityRegion || "Not available",
      country: data.country ?? "Not available",
      latitudeLongitude: hasCoordinates
        ? formatCoordinates(latitude, longitude)
        : "Not available",
      timezone,
      localTime: data.timezone?.current_time ?? "Not available",
      postalCode: data.postal ?? "Not available",
      mapUrl: hasCoordinates
        ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
        : undefined,
    },
    identity: {
      isp: data.connection?.isp ?? "Not available",
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
      countryCode: data.country_code ?? "Not available",
    },
    connection: {
      ip,
      isp: data.connection?.isp ?? "Not available",
      organization,
      connectionType: inferConnectionType(organization),
      services: inferService(ip, domain),
      usageType: inferUsageType(organization),
    },
    security: {
      proxy: "Unknown",
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
    text.includes("cloud") ||
    text.includes("google") ||
    text.includes("amazon")
  ) {
    return "Corporate";
  }

  if (
    text.includes("comcast") ||
    text.includes("verizon") ||
    text.includes("charter")
  ) {
    return "ISP";
  }

  return "Public internet";
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

  return "Internet service";
}

function inferUsageType(organization: string) {
  const text = organization.toLowerCase();

  if (
    text.includes("google") ||
    text.includes("cloud") ||
    text.includes("amazon")
  ) {
    return "Content Delivery Network";
  }

  return "Public network";
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
