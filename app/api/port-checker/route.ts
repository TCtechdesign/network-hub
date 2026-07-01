import { lookup } from "node:dns/promises";
import { isIP, Socket } from "node:net";
import {
  connect as tlsConnect,
  type PeerCertificate,
} from "node:tls";
import { NextRequest } from "next/server";
import {
  createInvalidPortCheckResult,
  createPortScanRow,
  createSiteSecuritySummary,
  maxPortsPerScan,
  normalizeHostInput,
  parsePortsInput,
  summarizeRows,
  type PortCheckResult,
  type PortScanRow,
  type PortScanStatus,
  type PortTlsInfo,
} from "@/lib/portChecker";

export const runtime = "nodejs";

const defaultTimeoutMs = 1500;
const maxTimeoutMs = 5000;
const scanConcurrency = 12;
const tlsInspectablePorts = new Set([443, 465, 993, 995, 8443]);

export async function GET(request: NextRequest) {
  const startedAtMs = Date.now();
  const rawHost = request.nextUrl.searchParams.get("host") ?? "";
  const rawPorts = request.nextUrl.searchParams.get("ports") ?? "";
  const host = normalizeHostInput(rawHost);
  const timeoutMs = normalizeTimeout(
    request.nextUrl.searchParams.get("timeout")
  );

  if (!isValidHost(host)) {
    return Response.json(
      createInvalidPortCheckResult(
        host || rawHost,
        rawPorts,
        "Enter a valid host name or IP address.",
        elapsed(startedAtMs)
      ),
      { status: 400 }
    );
  }

  const parsedPorts = parsePortsInput(rawPorts, maxPortsPerScan);

  if (!parsedPorts.ok) {
    return Response.json(
      createInvalidPortCheckResult(
        host,
        rawPorts,
        parsedPorts.message,
        elapsed(startedAtMs)
      ),
      { status: 400 }
    );
  }

  const resolvedAddress = await resolveHostAddress(host);

  if (!resolvedAddress) {
    return Response.json(
      createInvalidPortCheckResult(
        host,
        rawPorts,
        "The host could not be resolved.",
        elapsed(startedAtMs)
      ),
      { status: 404 }
    );
  }

  const startedAt = new Date();
  const rows = await scanPorts(host, parsedPorts.ports, timeoutMs);
  const finishedAt = new Date();
  const lookupMs = elapsed(startedAtMs);
  const result: PortCheckResult = {
    status: "success",
    targetHost: host,
    ipAddress: resolvedAddress,
    portsInput: rawPorts,
    scannedAt: finishedAt.toISOString(),
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    scanDuration: formatDuration(finishedAt.getTime() - startedAt.getTime()),
    lookupMs,
    sourceIp: getSourceIp(request),
    scanType: "TCP Connect",
    rows,
    summary: summarizeRows(rows),
    siteSecurity: createSiteSecuritySummary(rows),
  };

  return Response.json(result);
}

async function resolveHostAddress(host: string) {
  if (isIP(host)) {
    return host;
  }

  try {
    const resolved = await lookup(host);

    return resolved.address;
  } catch {
    return null;
  }
}

async function scanPorts(host: string, ports: number[], timeoutMs: number) {
  const rows: PortScanRow[] = [];
  let index = 0;

  async function worker() {
    while (index < ports.length) {
      const currentIndex = index;
      index += 1;
      const port = ports[currentIndex];

      rows[currentIndex] = await scanPort(host, port, timeoutMs);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(scanConcurrency, ports.length) },
      () => worker()
    )
  );

  return rows;
}

async function scanPort(host: string, port: number, timeoutMs: number) {
  const probe = await probeTcpPort(host, port, timeoutMs);
  const tls =
    probe.status === "open" && tlsInspectablePorts.has(port)
      ? await inspectTls(host, port, timeoutMs)
      : undefined;

  return createPortScanRow(port, probe.status, probe.responseTime, tls);
}

function probeTcpPort(host: string, port: number, timeoutMs: number) {
  return new Promise<{ status: PortScanStatus; responseTime: string }>(
    (resolve) => {
      const startedAt = Date.now();
      const socket = new Socket();
      let settled = false;

      function finish(status: PortScanStatus) {
        if (settled) {
          return;
        }

        settled = true;
        socket.destroy();
        const responseTime =
          status === "open" ? `${Date.now() - startedAt} ms` : "-";

        resolve({ status, responseTime });
      }

      socket.setTimeout(timeoutMs);
      socket.once("connect", () => finish("open"));
      socket.once("timeout", () => finish("filtered"));
      socket.once("error", (error: NodeJS.ErrnoException) => {
        if (
          error.code === "ETIMEDOUT" ||
          error.code === "EHOSTUNREACH" ||
          error.code === "ENETUNREACH"
        ) {
          finish("filtered");
          return;
        }

        finish("closed");
      });
      socket.connect(port, host);
    }
  );
}

function inspectTls(host: string, port: number, timeoutMs: number) {
  return new Promise<PortTlsInfo>((resolve) => {
    let settled = false;
    const socket = tlsConnect({
      host,
      port,
      rejectUnauthorized: false,
      servername: isIP(host) ? undefined : host,
    });

    function finish(info: PortTlsInfo) {
      if (settled) {
        return;
      }

      settled = true;
      socket.destroy();
      resolve(info);
    }

    socket.setTimeout(timeoutMs);
    socket.once("secureConnect", () => {
      const certificate = socket.getPeerCertificate();
      const cipher = socket.getCipher();
      const authorizationError = socket.authorizationError;

      finish({
        checked: true,
        valid: socket.authorized,
        authorized: socket.authorized,
        protocol: socket.getProtocol() ?? "Unknown",
        cipher: cipher?.name ?? "Unknown",
        subject: getCertificateName(certificate.subject),
        issuer: getCertificateName(certificate.issuer),
        validFrom: certificate.valid_from ?? "Not available",
        validTo: certificate.valid_to ?? "Not available",
        error: authorizationError ? String(authorizationError) : undefined,
      });
    });
    socket.once("timeout", () => {
      finish(createTlsError(`TLS check timed out after ${timeoutMs} ms.`));
    });
    socket.once("error", (error: Error) => {
      finish(createTlsError(error.message));
    });
  });
}

function createTlsError(error: string): PortTlsInfo {
  return {
    checked: true,
    valid: false,
    authorized: false,
    protocol: "Not confirmed",
    cipher: "Not confirmed",
    subject: "Not available",
    issuer: "Not available",
    validFrom: "Not available",
    validTo: "Not available",
    error,
  };
}

function getCertificateName(value: PeerCertificate["subject"]) {
  if (!value) {
    return "Not available";
  }

  const name = [value.CN, value.O, ...Object.values(value)]
    .flatMap((field) => (Array.isArray(field) ? field : [field]))
    .filter(Boolean)
    .join(", ");

  return name || "Not available";
}

function normalizeTimeout(value: string | null) {
  const timeout = Number(value);

  if (!Number.isFinite(timeout)) {
    return defaultTimeoutMs;
  }

  return Math.min(Math.max(timeout, 500), maxTimeoutMs);
}

function isValidHost(host: string) {
  return host.length > 0 && host.length <= 253 && !/\s/.test(host);
}

function getSourceIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "App server"
  );
}

function elapsed(startedAt: number) {
  return Date.now() - startedAt;
}

function formatDuration(milliseconds: number) {
  if (milliseconds < 1000) {
    return `${milliseconds} ms`;
  }

  return `${(milliseconds / 1000).toFixed(2)}s`;
}
