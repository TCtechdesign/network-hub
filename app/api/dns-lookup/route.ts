import { Resolver } from "node:dns/promises";
import { isIP } from "node:net";
import { NextRequest } from "next/server";
import {
  createEmptyDnsLookupResult,
  createInvalidDnsLookupResult,
  dnsServerOptions,
  emptySoa,
  emptySummary,
  normalizeDnsInput,
  type DnsLookupResult,
  type DnsRecord,
} from "@/lib/dnsLookup";

export const runtime = "nodejs";

type DnsServerConfig = {
  address?: string;
  display: string;
};

type AddressRecord = {
  address: string;
  ttl: number;
};

type SoaRecord = {
  nsname: string;
  hostmaster: string;
  serial: number;
  refresh: number;
  retry: number;
  expire: number;
  minttl: number;
};

type SrvRecord = {
  name: string;
  port: number;
  priority: number;
  weight: number;
};

type RdapResponse = {
  entities?: Array<{
    roles?: string[];
    vcardArray?: [
      string,
      Array<[string, Record<string, unknown>, string, string | string[]]>,
    ];
  }>;
  events?: Array<{
    eventAction?: string;
    eventDate?: string;
  }>;
  nameservers?: Array<{
    ldhName?: string;
  }>;
  secureDNS?: {
    delegationSigned?: boolean;
    dsData?: Array<{
      algorithm?: number;
      keyTag?: number;
    }>;
  };
};

const dnsServers: Record<string, DnsServerConfig> = {
  system: { display: dnsServerOptions[0].display },
  cloudflare: { address: "1.1.1.1", display: dnsServerOptions[1].display },
  google: { address: "8.8.8.8", display: dnsServerOptions[2].display },
  quad9: { address: "9.9.9.9", display: dnsServerOptions[3].display },
};

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const target = normalizeDnsInput(
    request.nextUrl.searchParams.get("domain") ?? ""
  );
  const serverKey = request.nextUrl.searchParams.get("server") ?? "cloudflare";
  const dnsServer = dnsServers[serverKey] ?? dnsServers.cloudflare;

  if (!target || !isValidDnsTarget(target)) {
    return Response.json(
      createInvalidDnsLookupResult(target, elapsed(startedAt)),
      { status: 400 }
    );
  }

  const resolver = createResolver(dnsServer);
  const lookup = isIP(target)
    ? await resolveReverseRecords(resolver, target)
    : await resolveForwardRecords(resolver, target);
  const rdap = isIP(target) ? null : await lookupRdap(target);
  const summary = summarizeRecords(lookup.records);
  const resultStatus = lookup.records.length > 0 ? "success" : "not-found";
  const baseResult = createEmptyDnsLookupResult(target, elapsed(startedAt));
  const nameServers =
    rdap?.domainInfo.nameServers.length
      ? rdap.domainInfo.nameServers
      : lookup.records
          .filter((record) => record.type === "NS")
          .map((record) => record.value);

  const result: DnsLookupResult = {
    ...baseResult,
    status: resultStatus,
    message:
      resultStatus === "success"
        ? undefined
        : "No DNS records were found for this lookup.",
    displayName: target,
    queriedAt: new Date().toISOString(),
    dnsServer: dnsServer.display,
    lookupMs: elapsed(startedAt),
    records: lookup.records,
    summary,
    domainInfo: {
      registrar: rdap?.domainInfo.registrar ?? "Not available",
      registrationDate: rdap?.domainInfo.registrationDate ?? "Not available",
      expirationDate: rdap?.domainInfo.expirationDate ?? "Not available",
      nameServers,
    },
    soa: lookup.soa,
    dnssec: rdap?.dnssec ?? baseResult.dnssec,
  };

  return Response.json(result, { status: resultStatus === "success" ? 200 : 404 });
}

function createResolver(dnsServer: DnsServerConfig) {
  const resolver = new Resolver();

  if (dnsServer.address) {
    resolver.setServers([dnsServer.address]);
  }

  return resolver;
}

async function resolveForwardRecords(resolver: Resolver, domain: string) {
  const [aRecords, aaaaRecords, cnameRecords, mxRecords, nsRecords, txtRecords, srvRecords, soaRecord] =
    await Promise.all([
      resolveAddressRecords(resolver, domain, "A"),
      resolveAddressRecords(resolver, domain, "AAAA"),
      safeResolveArray(() => resolver.resolveCname(domain)),
      safeResolveArray(() => resolver.resolveMx(domain)),
      safeResolveArray(() => resolver.resolveNs(domain)),
      safeResolveArray(() => resolver.resolveTxt(domain)),
      safeResolveArray(() => resolver.resolveSrv(domain)),
      safeResolveValue(() => resolver.resolveSoa(domain) as Promise<SoaRecord>),
    ]);

  const records: DnsRecord[] = [
    ...aRecords,
    ...aaaaRecords,
    ...cnameRecords.map((value, index) =>
      createRecord("CNAME", domain, value, index, "300")
    ),
    ...mxRecords.map((record, index) =>
      createRecord("MX", domain, record.exchange, index, "3600", record.priority)
    ),
    ...nsRecords.map((value, index) =>
      createRecord("NS", domain, value, index, "3600")
    ),
    ...txtRecords.map((value, index) =>
      createRecord("TXT", domain, value.join(""), index, "3600")
    ),
    ...srvRecords.map((record: SrvRecord, index) =>
      createRecord(
        "SRV",
        domain,
        `${record.name}:${record.port} (weight ${record.weight})`,
        index,
        "3600",
        record.priority
      )
    ),
  ];

  if (soaRecord) {
    records.push(createRecord("SOA", domain, soaRecord.nsname, 0, "3600"));
  }

  return {
    records,
    soa: soaRecord ? mapSoaRecord(soaRecord) : { ...emptySoa },
  };
}

async function resolveReverseRecords(resolver: Resolver, ipAddress: string) {
  const ptrRecords = await safeResolveArray(() => resolver.reverse(ipAddress));

  return {
    records: ptrRecords.map((value, index) =>
      createRecord("PTR", ipAddress, value, index, "300")
    ),
    soa: { ...emptySoa },
  };
}

async function resolveAddressRecords(
  resolver: Resolver,
  domain: string,
  type: "A" | "AAAA"
) {
  const records =
    type === "A"
      ? await safeResolveArray(() => resolver.resolve4(domain, { ttl: true }))
      : await safeResolveArray(() => resolver.resolve6(domain, { ttl: true }));

  return records.map((record, index) => {
    const addressRecord = record as AddressRecord;

    return createRecord(
      type,
      domain,
      addressRecord.address,
      index,
      addressRecord.ttl.toString()
    );
  });
}

async function safeResolveArray<T>(resolver: () => Promise<T[]>) {
  try {
    return await resolver();
  } catch {
    return [];
  }
}

async function safeResolveValue<T>(resolver: () => Promise<T>) {
  try {
    return await resolver();
  } catch {
    return null;
  }
}

function createRecord(
  type: DnsRecord["type"],
  name: string,
  value: string,
  index: number,
  ttl = "-",
  priority: string | number = "-"
): DnsRecord {
  return {
    id: `${type}-${index}-${value}`,
    type,
    name,
    value,
    ttl,
    priority: String(priority),
  };
}

function summarizeRecords(records: DnsRecord[]) {
  const summary = { ...emptySummary };

  for (const record of records) {
    summary[record.type] += 1;
  }

  return summary;
}

function mapSoaRecord(record: SoaRecord): DnsLookupResult["soa"] {
  return {
    primaryNs: record.nsname,
    adminEmail: record.hostmaster,
    serialNumber: String(record.serial),
    refresh: String(record.refresh),
    retry: String(record.retry),
    expire: String(record.expire),
    minimumTtl: String(record.minttl),
  };
}

async function lookupRdap(domain: string) {
  try {
    const response = await fetch(
      `https://rdap.org/domain/${encodeURIComponent(domain)}`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/rdap+json, application/json",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as RdapResponse;
    const dsData = data.secureDNS?.dsData?.[0];
    const dnssecEnabled = data.secureDNS?.delegationSigned === true;

    return {
      domainInfo: {
        registrar: parseRegistrar(data),
        registrationDate: parseRdapDate(data, "registration"),
        expirationDate: parseRdapDate(data, "expiration"),
        nameServers:
          data.nameservers
            ?.map((server) => server.ldhName?.toLowerCase())
            .filter((server): server is string => Boolean(server)) ?? [],
      },
      dnssec: {
        enabled: dnssecEnabled,
        status: dnssecEnabled ? "Enabled" : "Not detected",
        algorithm: dsData?.algorithm ? `Algorithm ${dsData.algorithm}` : "Not available",
        keyTag: dsData?.keyTag ? String(dsData.keyTag) : "Not available",
      },
    };
  } catch {
    return null;
  }
}

function parseRegistrar(data: RdapResponse) {
  const registrar = data.entities?.find((entity) =>
    entity.roles?.includes("registrar")
  );
  const vcardFields = registrar?.vcardArray?.[1] ?? [];
  const nameField = vcardFields.find(
    ([fieldName]) => fieldName === "fn" || fieldName === "org"
  );
  const value = nameField?.[3];

  return Array.isArray(value) ? value.join(" ") : value ?? "Not available";
}

function parseRdapDate(data: RdapResponse, action: string) {
  const event = data.events?.find((item) =>
    item.eventAction?.toLowerCase().includes(action)
  );

  return event?.eventDate ? event.eventDate.slice(0, 10) : "Not available";
}

function isValidDnsTarget(target: string) {
  if (isIP(target)) {
    return true;
  }

  if (target.length > 253) {
    return false;
  }

  return target.split(".").every((label) =>
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)
  );
}

function elapsed(startedAt: number) {
  return Date.now() - startedAt;
}
