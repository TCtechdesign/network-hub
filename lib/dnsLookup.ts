export type DnsRecordType =
  | "A"
  | "AAAA"
  | "CNAME"
  | "MX"
  | "NS"
  | "TXT"
  | "SRV"
  | "SOA"
  | "PTR";

export type DnsLookupStatus = "success" | "invalid" | "not-found" | "partial";

export type DnsRecord = {
  id: string;
  type: DnsRecordType;
  name: string;
  value: string;
  ttl: string;
  priority: string;
};

export type DnsLookupResult = {
  status: DnsLookupStatus;
  domain: string;
  displayName: string;
  message?: string;
  queriedAt: string;
  dnsServer: string;
  lookupMs: number;
  records: DnsRecord[];
  summary: Record<DnsRecordType, number>;
  domainInfo: {
    registrar: string;
    registrationDate: string;
    expirationDate: string;
    nameServers: string[];
  };
  soa: {
    primaryNs: string;
    adminEmail: string;
    serialNumber: string;
    refresh: string;
    retry: string;
    expire: string;
    minimumTtl: string;
  };
  dnssec: {
    enabled: boolean;
    status: string;
    algorithm: string;
    keyTag: string;
  };
};

export const dnsRecordTabs: DnsRecordType[] = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "NS",
  "TXT",
  "SRV",
  "SOA",
  "PTR",
];

export const dnsServerOptions = [
  { label: "System Resolver", value: "system", display: "System resolver" },
  { label: "Cloudflare", value: "cloudflare", display: "1.1.1.1 (Cloudflare)" },
  { label: "Google", value: "google", display: "8.8.8.8 (Google)" },
  { label: "Quad9", value: "quad9", display: "9.9.9.9 (Quad9)" },
];

export const emptySummary: Record<DnsRecordType, number> = {
  A: 0,
  AAAA: 0,
  CNAME: 0,
  MX: 0,
  NS: 0,
  TXT: 0,
  SRV: 0,
  SOA: 0,
  PTR: 0,
};

export const emptySoa: DnsLookupResult["soa"] = {
  primaryNs: "Not available",
  adminEmail: "Not available",
  serialNumber: "Not available",
  refresh: "Not available",
  retry: "Not available",
  expire: "Not available",
  minimumTtl: "Not available",
};

export const demoDnsLookupResult: DnsLookupResult = {
  status: "success",
  domain: "example.com",
  displayName: "example.com",
  queriedAt: "Example lookup",
  dnsServer: "1.1.1.1 (Cloudflare)",
  lookupMs: 156,
  records: [
    {
      id: "demo-a",
      type: "A",
      name: "example.com",
      value: "93.184.216.34",
      ttl: "300",
      priority: "-",
    },
    {
      id: "demo-aaaa",
      type: "AAAA",
      name: "example.com",
      value: "2606:2800:220:1:248:1893:25c8:1946",
      ttl: "300",
      priority: "-",
    },
    {
      id: "demo-cname",
      type: "CNAME",
      name: "www.example.com",
      value: "example.com",
      ttl: "300",
      priority: "-",
    },
    {
      id: "demo-mx-10",
      type: "MX",
      name: "example.com",
      value: "mail.example.com",
      ttl: "3600",
      priority: "10",
    },
    {
      id: "demo-mx-20",
      type: "MX",
      name: "example.com",
      value: "mail2.example.com",
      ttl: "3600",
      priority: "20",
    },
    {
      id: "demo-ns-a",
      type: "NS",
      name: "example.com",
      value: "a.iana-servers.net",
      ttl: "3600",
      priority: "-",
    },
    {
      id: "demo-ns-b",
      type: "NS",
      name: "example.com",
      value: "b.iana-servers.net",
      ttl: "3600",
      priority: "-",
    },
    {
      id: "demo-txt-spf",
      type: "TXT",
      name: "example.com",
      value: "v=spf1 -all",
      ttl: "3600",
      priority: "-",
    },
    {
      id: "demo-txt-note",
      type: "TXT",
      name: "example.com",
      value: "Example domain reserved for documentation.",
      ttl: "3600",
      priority: "-",
    },
    {
      id: "demo-soa",
      type: "SOA",
      name: "example.com",
      value: "a.iana-servers.net",
      ttl: "3600",
      priority: "-",
    },
  ],
  summary: {
    ...emptySummary,
    A: 1,
    AAAA: 1,
    CNAME: 1,
    MX: 2,
    NS: 2,
    TXT: 2,
    SOA: 1,
  },
  domainInfo: {
    registrar: "IANA",
    registrationDate: "1995-08-14",
    expirationDate: "2025-08-13",
    nameServers: ["a.iana-servers.net", "b.iana-servers.net"],
  },
  soa: {
    primaryNs: "a.iana-servers.net",
    adminEmail: "noc.dns.icann.org",
    serialNumber: "2024052001",
    refresh: "7200",
    retry: "3600",
    expire: "1209600",
    minimumTtl: "3600",
  },
  dnssec: {
    enabled: true,
    status: "Enabled",
    algorithm: "RSA/SHA-256",
    keyTag: "20326",
  },
};

export function normalizeDnsInput(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^dns:\/\//i, "")
    .split(/[/?#]/)[0]
    .replace(/\.$/, "")
    .toLowerCase();
}

export function createInvalidDnsLookupResult(
  domain: string,
  lookupMs = 0
): DnsLookupResult {
  return {
    ...createEmptyDnsLookupResult(domain || "Invalid domain", lookupMs),
    status: "invalid",
    message: "Enter a valid domain, hostname, or IP address.",
  };
}

export function createEmptyDnsLookupResult(domain: string, lookupMs = 0) {
  return {
    status: "not-found" as const,
    domain,
    displayName: domain,
    message: "No DNS records were found for this lookup.",
    queriedAt: new Date().toISOString(),
    dnsServer: "System resolver",
    lookupMs,
    records: [],
    summary: { ...emptySummary },
    domainInfo: {
      registrar: "Not available",
      registrationDate: "Not available",
      expirationDate: "Not available",
      nameServers: [],
    },
    soa: { ...emptySoa },
    dnssec: {
      enabled: false,
      status: "Not detected",
      algorithm: "Not available",
      keyTag: "Not available",
    },
  };
}
