import { ports as portReferences } from "@/data/ports";

export type PortScanStatus = "open" | "closed" | "filtered";
export type PortSecurityLevel = "secure" | "insecure" | "sensitive" | "unknown";
export type SiteSecurityStatus = "secure" | "review" | "insecure" | "unknown";

export type PortTlsInfo = {
  checked: boolean;
  valid: boolean;
  authorized: boolean;
  protocol: string;
  cipher: string;
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  error?: string;
};

export type PortSecurityInfo = {
  level: PortSecurityLevel;
  label: string;
  summary: string;
  recommendation: string;
  tls?: PortTlsInfo;
};

export type PortScanRow = {
  port: number;
  status: PortScanStatus;
  service: string;
  protocol: "TCP";
  responseTime: string;
  details: string;
  security: PortSecurityInfo;
};

export type SiteSecuritySummary = {
  status: SiteSecurityStatus;
  label: string;
  summary: string;
  httpsOpen: boolean;
  hasValidTls: boolean;
  securePorts: number;
  riskyPorts: number;
  notes: string[];
};

export type PortCheckResult = {
  status: "success" | "invalid" | "partial";
  targetHost: string;
  ipAddress: string;
  portsInput: string;
  scannedAt: string;
  startedAt: string;
  finishedAt: string;
  scanDuration: string;
  lookupMs: number;
  sourceIp: string;
  scanType: string;
  message?: string;
  rows: PortScanRow[];
  summary: {
    open: number;
    closed: number;
    filtered: number;
    scanned: number;
  };
  siteSecurity: SiteSecuritySummary;
};

export type ParsedPortsResult =
  | {
      ok: true;
      ports: number[];
    }
  | {
      ok: false;
      message: string;
    };

type PortMetadata = {
  service: string;
  details: string;
};

type PortSecurityTemplate = Omit<PortSecurityInfo, "tls">;

export const defaultPortsInput = "20, 21, 22, 25, 53, 80, 110, 443, 3306, 3389";
export const maxPortsPerScan = 64;

const commonPortMetadata: Record<number, PortMetadata> = {
  20: { service: "FTP-DATA", details: "File Transfer [Data]" },
  21: { service: "FTP", details: "File Transfer Protocol" },
  22: { service: "SSH", details: "Secure Shell" },
  23: { service: "TELNET", details: "Telnet Remote Login" },
  25: { service: "SMTP", details: "Simple Mail Transfer Protocol" },
  53: { service: "DNS", details: "Domain Name System" },
  67: { service: "DHCP Server", details: "Dynamic Host Configuration Protocol" },
  68: { service: "DHCP Client", details: "Dynamic Host Configuration Protocol" },
  80: { service: "HTTP", details: "Hypertext Transfer Protocol" },
  110: { service: "POP3", details: "Post Office Protocol v3" },
  123: { service: "NTP", details: "Network Time Protocol" },
  143: { service: "IMAP", details: "Internet Message Access Protocol" },
  161: { service: "SNMP", details: "Simple Network Management Protocol" },
  389: { service: "LDAP", details: "Lightweight Directory Access Protocol" },
  443: { service: "HTTPS", details: "HTTP Secure" },
  445: { service: "SMB", details: "Server Message Block" },
  465: { service: "SMTPS", details: "SMTP over TLS" },
  587: { service: "SMTP Submission", details: "Mail submission with STARTTLS" },
  993: { service: "IMAPS", details: "IMAP over TLS" },
  995: { service: "POP3S", details: "POP3 over TLS" },
  8443: { service: "HTTPS Alternate", details: "Alternate HTTPS service" },
  3306: { service: "MySQL", details: "MySQL Database" },
  3389: { service: "RDP", details: "Remote Desktop Protocol" },
};

const portSecurityTemplates: Record<number, PortSecurityTemplate> = {
  20: {
    level: "insecure",
    label: "Plain FTP",
    summary: "FTP data can expose files because it is not encrypted by default.",
    recommendation: "Use SFTP, SCP, or FTPS instead of plain FTP.",
  },
  21: {
    level: "insecure",
    label: "Plain FTP",
    summary: "FTP control traffic can expose usernames, passwords, and commands.",
    recommendation: "Replace public FTP with SFTP, SCP, or FTPS.",
  },
  22: {
    level: "secure",
    label: "Encrypted",
    summary: "SSH encrypts remote administration traffic.",
    recommendation: "Allow trusted IPs only, disable password login when possible, and use keys.",
  },
  23: {
    level: "insecure",
    label: "Telnet",
    summary: "Telnet sends remote login traffic without encryption.",
    recommendation: "Disable Telnet and use SSH instead.",
  },
  25: {
    level: "sensitive",
    label: "Mail Server",
    summary: "SMTP can be abused for spam relay if it is misconfigured.",
    recommendation: "Require authentication, use TLS where supported, and restrict relay access.",
  },
  53: {
    level: "sensitive",
    label: "DNS Service",
    summary: "Public DNS can leak query traffic or be abused for amplification if open recursion is enabled.",
    recommendation: "Disable open recursion and restrict DNS service to intended clients.",
  },
  80: {
    level: "insecure",
    label: "HTTP",
    summary: "HTTP does not encrypt traffic.",
    recommendation: "Redirect HTTP to HTTPS and keep port 443 configured with a valid certificate.",
  },
  110: {
    level: "insecure",
    label: "Plain POP3",
    summary: "POP3 often sends mailbox traffic without encryption.",
    recommendation: "Use POP3S on port 995 or another encrypted mail option.",
  },
  143: {
    level: "insecure",
    label: "Plain IMAP",
    summary: "IMAP on this port is commonly unencrypted unless STARTTLS is enforced.",
    recommendation: "Use IMAPS on port 993 or require STARTTLS.",
  },
  443: {
    level: "secure",
    label: "HTTPS",
    summary: "HTTPS is intended to encrypt web traffic.",
    recommendation: "Keep TLS certificates valid and disable outdated TLS versions.",
  },
  445: {
    level: "sensitive",
    label: "SMB Exposure",
    summary: "SMB should usually stay private because it exposes file sharing services.",
    recommendation: "Block SMB from the public internet and allow it only on trusted networks.",
  },
  465: {
    level: "secure",
    label: "TLS Mail",
    summary: "SMTPS encrypts mail submission traffic with TLS.",
    recommendation: "Keep the certificate valid and require authenticated mail submission.",
  },
  587: {
    level: "sensitive",
    label: "Mail Submission",
    summary: "SMTP submission should require authentication and STARTTLS.",
    recommendation: "Require STARTTLS, disable open relay behavior, and enforce strong authentication.",
  },
  993: {
    level: "secure",
    label: "TLS Mail",
    summary: "IMAPS encrypts mailbox access with TLS.",
    recommendation: "Keep the certificate valid and disable plain IMAP access when possible.",
  },
  995: {
    level: "secure",
    label: "TLS Mail",
    summary: "POP3S encrypts mailbox access with TLS.",
    recommendation: "Keep the certificate valid and disable plain POP3 access when possible.",
  },
  8443: {
    level: "secure",
    label: "HTTPS Alt",
    summary: "This port is commonly used for alternate HTTPS services.",
    recommendation: "Keep TLS certificates valid and restrict admin interfaces when this is a management port.",
  },
  3306: {
    level: "sensitive",
    label: "Database",
    summary: "MySQL should not usually be reachable from the public internet.",
    recommendation: "Bind databases privately and require firewall, VPN, or private network access.",
  },
  3389: {
    level: "sensitive",
    label: "Remote Desktop",
    summary: "Public RDP is a common target for brute force and credential attacks.",
    recommendation: "Place RDP behind a VPN, require MFA, and restrict allowed source IPs.",
  },
};

const demoTlsInfo: PortTlsInfo = {
  checked: true,
  valid: true,
  authorized: true,
  protocol: "TLSv1.3",
  cipher: "TLS_AES_256_GCM_SHA384",
  subject: "example.com",
  issuer: "Demo Certificate Authority",
  validFrom: "May 20, 2026",
  validTo: "May 20, 2027",
};

const demoRows: PortScanRow[] = [
  createDemoRow(20, "open", "23.45 ms"),
  createDemoRow(21, "open", "22.18 ms"),
  createDemoRow(22, "open", "18.67 ms"),
  createDemoRow(25, "closed", "-"),
  createDemoRow(53, "open", "16.32 ms"),
  createDemoRow(80, "open", "15.21 ms"),
  createDemoRow(110, "closed", "-"),
  createDemoRow(443, "open", "19.11 ms", demoTlsInfo),
  createDemoRow(3306, "closed", "-"),
  createDemoRow(3389, "closed", "-"),
];

export const demoPortCheckResult: PortCheckResult = {
  status: "success",
  targetHost: "example.com",
  ipAddress: "93.184.216.34",
  portsInput: defaultPortsInput,
  scannedAt: "Example scan",
  startedAt: "Example start",
  finishedAt: "Example finish",
  scanDuration: "1.52s",
  lookupMs: 1520,
  sourceIp: "192.168.1.105",
  scanType: "TCP Connect",
  rows: demoRows,
  summary: summarizeRows(demoRows),
  siteSecurity: createSiteSecuritySummary(demoRows),
};

export function normalizeHostInput(value: string) {
  const trimmed = value.trim();
  const withoutProtocol = trimmed.replace(/^https?:\/\//i, "");
  const withoutPath = withoutProtocol.split(/[/?#]/)[0];

  if (withoutPath.startsWith("[") && withoutPath.includes("]")) {
    return withoutPath.slice(1, withoutPath.indexOf("]"));
  }

  if ((withoutPath.match(/:/g) ?? []).length === 1) {
    return withoutPath.split(":")[0];
  }

  return withoutPath;
}

export function parsePortsInput(input: string, maxPorts = maxPortsPerScan): ParsedPortsResult {
  const rawParts = input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const parsedPorts = new Set<number>();

  if (rawParts.length === 0) {
    return {
      ok: false,
      message: "Enter at least one port number.",
    };
  }

  for (const part of rawParts) {
    if (part.includes("-")) {
      const [startText, endText] = part.split("-").map((value) => value.trim());
      const start = Number(startText);
      const end = Number(endText);

      if (!isValidPort(start) || !isValidPort(end) || start > end) {
        return {
          ok: false,
          message: `Invalid port range: ${part}`,
        };
      }

      for (let port = start; port <= end; port += 1) {
        parsedPorts.add(port);

        if (parsedPorts.size > maxPorts) {
          return {
            ok: false,
            message: `Please scan ${maxPorts} ports or fewer at a time.`,
          };
        }
      }
    } else {
      const port = Number(part);

      if (!isValidPort(port)) {
        return {
          ok: false,
          message: `Invalid port number: ${part}`,
        };
      }

      parsedPorts.add(port);
    }
  }

  if (parsedPorts.size > maxPorts) {
    return {
      ok: false,
      message: `Please scan ${maxPorts} ports or fewer at a time.`,
    };
  }

  return {
    ok: true,
    ports: Array.from(parsedPorts).sort((a, b) => a - b),
  };
}

export function createInvalidPortCheckResult(
  host: string,
  portsInput: string,
  message: string,
  lookupMs = 0
): PortCheckResult {
  return {
    status: "invalid",
    targetHost: host,
    ipAddress: "Not available",
    portsInput,
    scannedAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    scanDuration: "0s",
    lookupMs,
    sourceIp: "App server",
    scanType: "TCP Connect",
    message,
    rows: [],
    summary: {
      open: 0,
      closed: 0,
      filtered: 0,
      scanned: 0,
    },
    siteSecurity: createSiteSecuritySummary([]),
  };
}

export function createPortScanRow(
  port: number,
  status: PortScanStatus,
  responseTime: string,
  tls?: PortTlsInfo
): PortScanRow {
  const metadata = getPortMetadata(port);

  return {
    port,
    status,
    service: metadata.service,
    protocol: "TCP",
    responseTime,
    details: metadata.details,
    security: getPortSecurity(port, status, tls),
  };
}

export function createSiteSecuritySummary(
  rows: PortScanRow[]
): SiteSecuritySummary {
  const openRows = rows.filter((row) => row.status === "open");
  const httpsRow = openRows.find((row) => row.port === 443);
  const validTlsRows = openRows.filter((row) => row.security.tls?.valid);
  const riskyRows = openRows.filter(
    (row) =>
      row.security.level === "insecure" || row.security.level === "sensitive"
  );
  const notes: string[] = [];

  if (rows.length === 0) {
    return {
      status: "unknown",
      label: "No Scan Yet",
      summary: "Run a scan to review exposed ports and TLS status.",
      httpsOpen: false,
      hasValidTls: false,
      securePorts: 0,
      riskyPorts: 0,
      notes: ["No ports have been checked yet."],
    };
  }

  if (httpsRow?.security.tls?.valid) {
    notes.push("HTTPS responded with a valid TLS certificate.");
  } else if (httpsRow?.security.tls?.checked) {
    notes.push("HTTPS is open, but the TLS certificate needs review.");
  } else if (httpsRow) {
    notes.push("HTTPS is open, but TLS certificate details were not available.");
  } else {
    notes.push("Port 443 was not confirmed open in this scan.");
  }

  if (openRows.some((row) => row.port === 80)) {
    notes.push("Port 80 is open. Redirect HTTP traffic to HTTPS when this is a website.");
  }

  for (const row of riskyRows.slice(0, 3)) {
    notes.push(`${row.port}/${row.service}: ${row.security.recommendation}`);
  }

  if (riskyRows.length > 3) {
    notes.push(`${riskyRows.length - 3} more open ports need security review.`);
  }

  if (riskyRows.length > 0) {
    return {
      status: "review",
      label: "Review Open Ports",
      summary:
        "The host has open ports that may be risky if they are exposed publicly.",
      httpsOpen: Boolean(httpsRow),
      hasValidTls: validTlsRows.length > 0,
      securePorts: openRows.filter((row) => row.security.level === "secure").length,
      riskyPorts: riskyRows.length,
      notes,
    };
  }

  if (httpsRow?.security.tls?.valid) {
    return {
      status: "secure",
      label: "HTTPS Looks Secure",
      summary:
        "The scanned web port uses a valid TLS certificate and no risky open ports were found.",
      httpsOpen: true,
      hasValidTls: true,
      securePorts: openRows.filter((row) => row.security.level === "secure").length,
      riskyPorts: 0,
      notes,
    };
  }

  if (httpsRow && !httpsRow.security.tls?.valid) {
    return {
      status: "insecure",
      label: "TLS Needs Attention",
      summary:
        "HTTPS is reachable, but the certificate check did not confirm a trusted TLS setup.",
      httpsOpen: true,
      hasValidTls: false,
      securePorts: openRows.filter((row) => row.security.level === "secure").length,
      riskyPorts: 0,
      notes,
    };
  }

  return {
    status: "unknown",
    label: "Limited Signal",
    summary:
      "No obvious risky ports were found, but this scan did not confirm HTTPS security.",
    httpsOpen: false,
    hasValidTls: false,
    securePorts: openRows.filter((row) => row.security.level === "secure").length,
    riskyPorts: 0,
    notes,
  };
}

export function summarizeRows(rows: PortScanRow[]) {
  return rows.reduce(
    (summary, row) => {
      summary[row.status] += 1;
      summary.scanned += 1;
      return summary;
    },
    {
      open: 0,
      closed: 0,
      filtered: 0,
      scanned: 0,
    }
  );
}

function createDemoRow(
  port: number,
  status: PortScanStatus,
  responseTime: string,
  tls?: PortTlsInfo
) {
  return createPortScanRow(port, status, responseTime, tls);
}

function getPortMetadata(port: number): PortMetadata {
  const commonMetadata = commonPortMetadata[port];

  if (commonMetadata) {
    return commonMetadata;
  }

  const portReference = portReferences.find((reference) => reference.port === port);

  if (portReference) {
    return {
      service: portReference.service,
      details: portReference.description,
    };
  }

  return {
    service: "Unknown",
    details: "No common service mapping found",
  };
}

function isValidPort(port: number) {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

function getPortSecurity(
  port: number,
  status: PortScanStatus,
  tls?: PortTlsInfo
): PortSecurityInfo {
  if (status !== "open") {
    return {
      level: "unknown",
      label: capitalize(status),
      summary: "No exposed TCP service was confirmed during this scan.",
      recommendation: "Closed or filtered ports still depend on firewall policy and server configuration.",
    };
  }

  if (tls?.checked) {
    if (tls.valid) {
      return {
        level: "secure",
        label: "TLS Verified",
        summary: `${tls.protocol} responded with a certificate that could be validated.`,
        recommendation: "Keep the certificate renewed and disable outdated TLS versions.",
        tls,
      };
    }

    return {
      level: "insecure",
      label: "TLS Issue",
      summary: tls.error
        ? `TLS responded, but trust could not be verified: ${tls.error}.`
        : "TLS responded, but trust could not be verified.",
      recommendation: "Check the certificate chain, expiration date, hostname, and TLS configuration.",
      tls,
    };
  }

  const securityTemplate = portSecurityTemplates[port];

  if (securityTemplate) {
    return securityTemplate;
  }

  return {
    level: "unknown",
    label: "Needs Review",
    summary: "This open port is not in the common security profile.",
    recommendation: "Confirm which service is running and expose it only if it is required.",
  };
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
