import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

type AuditKey = "status" | "ssl" | "dns" | "security" | "links" | "audit";
type Tone = "green" | "blue" | "amber" | "red" | "violet";

type DetailCheck = {
  id: AuditKey;
  title: string;
  description: string;
  status: string;
  tone: Tone;
  details: string[];
};

type Issue = {
  title: string;
  description: string;
  tone: Tone;
};

type SummaryInput = {
  actionableIssues: Issue[];
  hostname: string;
  performanceScore: number;
  score: number;
};

type BrokenLinkPage = {
  url: string;
  sourcePage: string;
  statusCode: string;
  issue: string;
  suggestion: string;
};

type AuditSelection = Record<AuditKey, boolean>;

type LinkCheckResult = {
  url: string;
  status: number | null;
  statusText: string;
  error?: string;
};

type SecurityHeaders = {
  csp: string | null;
  cspReportOnly: string | null;
  hsts: string | null;
  referrerPolicy: string | null;
  xContentTypeOptions: string | null;
  xFrameOptions: string | null;
};

const defaultChecks: AuditSelection = {
  status: true,
  ssl: true,
  dns: true,
  security: true,
  links: true,
  audit: true,
};
const fetchTimeoutMs = 9000;
const fetchTimeoutSeconds = Math.round(fetchTimeoutMs / 1000);
const maxLinksToCheck = 30;

class WebsiteCheckerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebsiteCheckerError";
  }
}

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const target = normalizeWebsiteUrl(request.nextUrl.searchParams.get("url") ?? "");
  const selectedChecks = parseChecks(request.nextUrl.searchParams.get("checks"));

  if (!target) {
    return Response.json(
      { message: "Enter a valid public website URL." },
      { status: 400 }
    );
  }

  const resolvedAddresses = await resolveTargetAddresses(target.hostname);

  if (resolvedAddresses.length === 0) {
    return Response.json(
      {
        message:
          "This is an invalid website URL. Check the spelling or enter a public website URL.",
      },
      { status: 502 }
    );
  }

  if (resolvedAddresses.some((address) => isPrivateAddress(address))) {
    return Response.json(
      { message: "For safety, this checker only scans public website URLs." },
      { status: 400 }
    );
  }

  try {
    const response = await fetchWithTimeout(target.href, {
      method: "GET",
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "user-agent": "NetworkHubWebsiteChecker/1.0",
      },
      redirect: "follow",
    });
    const finalUrl = new URL(response.url || target.href);
    const contentType = response.headers.get("content-type") ?? "";
    const isHtml = contentType.toLowerCase().includes("text/html");
    const html = isHtml ? await response.text() : "";
    const discoveredLinks =
      selectedChecks.links && html
        ? extractSameOriginLinks(html, finalUrl).slice(0, maxLinksToCheck)
        : [];
    const linkResults =
      selectedChecks.links && discoveredLinks.length > 0
        ? await Promise.all(discoveredLinks.map((link) => checkLink(link)))
        : [];
    const brokenLinkPages = linkResults
      .filter((link) => isBrokenLinkStatus(link.status))
      .map((link) => createBrokenLinkPage(link, finalUrl));
    const headers = getSecurityHeaders(response.headers);
    const result = createAuditResult({
      brokenLinkPages,
      checkedUrl: target,
      finalUrl,
      headers,
      htmlBytes: html.length,
      linkResults,
      response,
      resolvedAddresses,
      selectedChecks,
      startedAt,
    });

    return Response.json({ result });
  } catch (error) {
    return Response.json(
      { message: getWebsiteCheckErrorMessage(error) },
      { status: 502 }
    );
  }
}

function createAuditResult({
  brokenLinkPages,
  checkedUrl,
  finalUrl,
  headers,
  htmlBytes,
  linkResults,
  response,
  resolvedAddresses,
  selectedChecks,
  startedAt,
}: {
  brokenLinkPages: BrokenLinkPage[];
  checkedUrl: URL;
  finalUrl: URL;
  headers: SecurityHeaders;
  htmlBytes: number;
  linkResults: LinkCheckResult[];
  response: Response;
  resolvedAddresses: string[];
  selectedChecks: AuditSelection;
  startedAt: number;
}) {
  const elapsedMs = Date.now() - startedAt;
  const isHttps = finalUrl.protocol === "https:";
  const statusOk = response.status >= 200 && response.status < 400;
  const hasCsp = Boolean(headers.csp);
  const hasReportOnlyCsp = Boolean(headers.cspReportOnly);
  const hasFrameProtection =
    Boolean(headers.xFrameOptions) ||
    Boolean(headers.csp && /(^|;)\s*frame-ancestors\s+/i.test(headers.csp));
  const largePage = htmlBytes > 2_500_000;
  const performanceScore = calculatePerformanceScore(elapsedMs, htmlBytes);
  const issues = buildIssues({
    brokenLinks: brokenLinkPages.length,
    hasCsp,
    hasFrameProtection,
    hasReportOnlyCsp,
    isHttps,
    largePage,
    selectedChecks,
    statusOk,
  });
  const securityStatus =
    !selectedChecks.security || (hasCsp && hasFrameProtection && isHttps)
      ? "Good"
      : "Review";
  const score = calculateOverallScore({
    brokenLinks: brokenLinkPages.length,
    hasCsp,
    hasFrameProtection,
    isHttps,
    largePage,
    performanceScore,
    statusOk,
  });
  const actionableIssues = issues.filter((issue) => issue.tone !== "green");
  const errors = issues.filter((issue) => issue.tone === "red").length;
  const warnings = issues.filter((issue) => issue.tone === "amber").length;
  const checkedAt = new Date().toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return {
    url: finalUrl.href,
    hostname: finalUrl.hostname,
    ipAddress: resolvedAddresses[0] ?? "Not available",
    server:
      response.headers.get("server") ??
      response.headers.get("x-powered-by") ??
      "Not disclosed",
    checkedAt,
    duration: `${(elapsedMs / 1000).toFixed(2)} s`,
    statusCode: `${response.status} ${response.statusText || "HTTP"}`,
    sslStatus: !selectedChecks.ssl ? "Not checked" : isHttps ? "Valid" : "Review",
    performanceScore,
    brokenLinks: brokenLinkPages.length,
    securityStatus,
    totalChecks: countCompletedChecks({
      linkResults,
      resolvedAddresses,
      selectedChecks,
    }),
    passed: Math.max(
      0,
      countCompletedChecks({ linkResults, resolvedAddresses, selectedChecks }) -
        actionableIssues.length
    ),
    warnings,
    errors,
    info: selectedChecks.security ? 4 : 2,
    score,
    scoreLabel: getScoreLabel(score),
    summary: getSummary({
      actionableIssues,
      hostname: finalUrl.hostname,
      performanceScore,
      score,
    }),
    details: buildDetailChecks({
      brokenLinkPages,
      checkedUrl,
      finalUrl,
      headers,
      isHttps,
      linkResults,
      performanceScore,
      resolvedAddresses,
      response,
      selectedChecks,
    }),
    issues,
    brokenLinkPages,
  };
}

function buildDetailChecks({
  brokenLinkPages,
  checkedUrl,
  finalUrl,
  headers,
  isHttps,
  linkResults,
  performanceScore,
  resolvedAddresses,
  response,
  selectedChecks,
}: {
  brokenLinkPages: BrokenLinkPage[];
  checkedUrl: URL;
  finalUrl: URL;
  headers: SecurityHeaders;
  isHttps: boolean;
  linkResults: LinkCheckResult[];
  performanceScore: number;
  resolvedAddresses: string[];
  response: Response;
  selectedChecks: AuditSelection;
}) {
  const checks: DetailCheck[] = [];
  const hasCsp = Boolean(headers.csp);
  const hasReportOnlyCsp = Boolean(headers.cspReportOnly);
  const hasFrameProtection =
    Boolean(headers.xFrameOptions) ||
    Boolean(headers.csp && /(^|;)\s*frame-ancestors\s+/i.test(headers.csp));

  if (selectedChecks.status) {
    checks.push({
      id: "status",
      title: "Website Status",
      description: "Checks whether the site is reachable and returning a valid response.",
      status: response.status >= 200 && response.status < 400 ? "Up" : "Review",
      tone: response.status >= 200 && response.status < 400 ? "green" : "amber",
      details: [
        `Requested URL: ${checkedUrl.href}`,
        `Final URL: ${finalUrl.href}`,
        `Response: ${response.status} ${response.statusText || "HTTP"}`,
      ],
    });
  }

  if (selectedChecks.ssl) {
    checks.push({
      id: "ssl",
      title: "SSL Checker",
      description: "Reviews whether the site is using HTTPS.",
      status: isHttps ? "Valid" : "Review",
      tone: isHttps ? "green" : "amber",
      details: isHttps
        ? [
            "The final URL uses HTTPS.",
            "The connection completed without a browser-level certificate failure.",
          ]
        : [
            "The final URL uses HTTP instead of HTTPS.",
            "Use HTTPS to protect visitors and avoid browser security warnings.",
          ],
    });
  }

  if (selectedChecks.dns) {
    checks.push({
      id: "dns",
      title: "DNS Checker",
      description: "Checks whether the hostname resolves to public IP addresses.",
      status: resolvedAddresses.length > 0 ? "Resolved" : "Review",
      tone: resolvedAddresses.length > 0 ? "green" : "amber",
      details:
        resolvedAddresses.length > 0
          ? resolvedAddresses.map((address) => `Resolved address: ${address}`)
          : ["No public DNS addresses were found before the fetch."],
    });
  }

  if (selectedChecks.security) {
    checks.push({
      id: "security",
      title: "Security Checker",
      description: "Reviews common security header signals.",
      status: hasCsp && hasFrameProtection && isHttps ? "Good" : "Review",
      tone: hasCsp && hasFrameProtection && isHttps ? "green" : "amber",
      details: [
        hasCsp
          ? "Content-Security-Policy detected."
          : hasReportOnlyCsp
            ? "Content-Security-Policy-Report-Only detected, but enforcing CSP was not found."
            : "Content-Security-Policy was not found.",
        hasFrameProtection
          ? "Clickjacking protection detected through X-Frame-Options or CSP frame-ancestors."
          : "Clickjacking protection was not found. Add X-Frame-Options or CSP frame-ancestors.",
        headers.hsts
          ? "Strict-Transport-Security detected."
          : "Strict-Transport-Security was not found.",
        headers.referrerPolicy
          ? `Referrer-Policy detected: ${headers.referrerPolicy}.`
          : "Referrer-Policy was not found.",
      ],
    });
  }

  if (selectedChecks.links) {
    checks.push({
      id: "links",
      title: "Broken Link Checker",
      description: "Checks same-site links found on the submitted page.",
      status:
        brokenLinkPages.length > 0
          ? `${brokenLinkPages.length} Issues`
          : "No Issues",
      tone: brokenLinkPages.length > 0 ? "amber" : "green",
      details:
        linkResults.length > 0
          ? [
              `${linkResults.length} same-site links were checked from the submitted page.`,
              brokenLinkPages.length > 0
                ? `${brokenLinkPages.length} broken link pages were found.`
                : "No broken same-site links were found.",
            ]
          : [
              "No same-site links were found on the submitted page.",
              "Only links present in the fetched HTML can be checked.",
            ],
    });
  }

  if (selectedChecks.audit) {
    checks.push({
      id: "audit",
      title: "Full Website Audit",
      description: "Summarizes performance, reliability, and best-practice checks.",
      status: getPerformanceLabel(performanceScore),
      tone: performanceScore >= 75 ? "blue" : "amber",
      details: [
        `Performance score: ${performanceScore} / 100.`,
        "This score is based on response time and fetched page size, not a full Lighthouse audit.",
      ],
    });
  }

  return checks;
}

function buildIssues({
  brokenLinks,
  hasCsp,
  hasFrameProtection,
  hasReportOnlyCsp,
  isHttps,
  largePage,
  selectedChecks,
  statusOk,
}: {
  brokenLinks: number;
  hasCsp: boolean;
  hasFrameProtection: boolean;
  hasReportOnlyCsp: boolean;
  isHttps: boolean;
  largePage: boolean;
  selectedChecks: AuditSelection;
  statusOk: boolean;
}) {
  const issues: Issue[] = [];

  if (selectedChecks.status && !statusOk) {
    issues.push({
      title: "Website returned a non-success status",
      description: "The submitted URL did not return a 2xx or 3xx response.",
      tone: "red",
    });
  }

  if (selectedChecks.links && brokenLinks > 0) {
    issues.push({
      title: `${brokenLinks} broken links found`,
      description: "Review the same-site links listed below and update or remove stale URLs.",
      tone: "amber",
    });
  }

  if (selectedChecks.ssl && !isHttps) {
    issues.push({
      title: "HTTPS is not enabled",
      description: "Use HTTPS to protect visitors and avoid browser security warnings.",
      tone: "amber",
    });
  }

  if (selectedChecks.security && !hasCsp) {
    issues.push({
      title: hasReportOnlyCsp ? "CSP is report-only" : "Missing CSP header",
      description: hasReportOnlyCsp
        ? "A report-only CSP logs policy violations but does not enforce the policy."
        : "Content-Security-Policy was not found in the website response headers.",
      tone: "amber",
    });
  }

  if (selectedChecks.security && !hasFrameProtection) {
    issues.push({
      title: "Missing clickjacking protection",
      description: "Add X-Frame-Options or a CSP frame-ancestors directive.",
      tone: "blue",
    });
  }

  if (selectedChecks.audit && largePage) {
    issues.push({
      title: "Large page size",
      description: "Compress large images and remove unused assets to improve load speed.",
      tone: "blue",
    });
  }

  if (issues.length === 0) {
    issues.push({
      title: "No major issues found",
      description: "The selected checks look healthy for the fetched page.",
      tone: "green",
    });
  }

  return issues;
}

function parseChecks(value: string | null): AuditSelection {
  const selected = { ...defaultChecks };

  if (!value) {
    return selected;
  }

  const allowed = new Set<AuditKey>([
    "status",
    "ssl",
    "dns",
    "security",
    "links",
    "audit",
  ]);
  const keys = new Set(value.split(",").filter((key): key is AuditKey => allowed.has(key as AuditKey)));

  return {
    status: keys.has("status"),
    ssl: keys.has("ssl"),
    dns: keys.has("dns"),
    security: keys.has("security"),
    links: keys.has("links"),
    audit: keys.has("audit"),
  };
}

function normalizeWebsiteUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);

    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      !url.hostname.includes(".")
    ) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs);

  try {
    return await fetch(url, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new WebsiteCheckerError(
        `This website URL is invalid or did not respond within ${fetchTimeoutSeconds} seconds. Enter a public website URL and try again.`
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function getWebsiteCheckErrorMessage(error: unknown) {
  if (error instanceof WebsiteCheckerError) {
    return error.message;
  }

  if (isAbortError(error)) {
    return `This website URL is invalid or did not respond within ${fetchTimeoutSeconds} seconds. Enter a public website URL and try again.`;
  }

  return "This website URL is invalid or could not be reached. Enter a public website URL and try again.";
}

function isAbortError(error: unknown) {
  return (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  );
}

async function resolveTargetAddresses(hostname: string) {
  if (isIP(hostname)) {
    return [hostname];
  }

  try {
    const addresses = await lookup(hostname, { all: true });

    return addresses.map((address) => address.address);
  } catch {
    return [];
  }
}

function getSecurityHeaders(headers: Headers): SecurityHeaders {
  return {
    csp: headers.get("content-security-policy"),
    cspReportOnly: headers.get("content-security-policy-report-only"),
    hsts: headers.get("strict-transport-security"),
    referrerPolicy: headers.get("referrer-policy"),
    xContentTypeOptions: headers.get("x-content-type-options"),
    xFrameOptions: headers.get("x-frame-options"),
  };
}

function extractSameOriginLinks(html: string, baseUrl: URL) {
  const links = new Set<string>();
  const hrefPattern = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let match: RegExpExecArray | null;

  while ((match = hrefPattern.exec(html)) && links.size < maxLinksToCheck * 2) {
    const href = (match[1] ?? match[2] ?? match[3] ?? "").replaceAll("&amp;", "&").trim();

    if (
      !href ||
      href.startsWith("#") ||
      /^(mailto|tel|javascript|data|blob):/i.test(href)
    ) {
      continue;
    }

    try {
      const linkUrl = new URL(href, baseUrl);

      linkUrl.hash = "";

      if (
        linkUrl.origin === baseUrl.origin &&
        linkUrl.href !== baseUrl.href &&
        ["http:", "https:"].includes(linkUrl.protocol)
      ) {
        links.add(linkUrl.href);
      }
    } catch {
      continue;
    }
  }

  return Array.from(links);
}

async function checkLink(url: string): Promise<LinkCheckResult> {
  try {
    const response = await fetchWithTimeout(url, {
      method: "HEAD",
      redirect: "follow",
      headers: { "user-agent": "NetworkHubWebsiteChecker/1.0" },
    });

    if ([405, 501].includes(response.status)) {
      return await checkLinkWithGet(url);
    }

    return {
      url,
      status: response.status,
      statusText: response.statusText || "HTTP",
    };
  } catch {
    return await checkLinkWithGet(url);
  }
}

async function checkLinkWithGet(url: string): Promise<LinkCheckResult> {
  try {
    const response = await fetchWithTimeout(url, {
      method: "GET",
      redirect: "follow",
      headers: { "user-agent": "NetworkHubWebsiteChecker/1.0" },
    });

    return {
      url,
      status: response.status,
      statusText: response.statusText || "HTTP",
    };
  } catch (error) {
    return {
      url,
      status: null,
      statusText: "Network Error",
      error:
        error instanceof Error
          ? error.message
          : "The link could not be reached.",
    };
  }
}

function isBrokenLinkStatus(status: number | null) {
  if (status === null) {
    return false;
  }

  return status === 400 || status === 404 || status === 410 || status >= 500;
}

function createBrokenLinkPage(
  link: LinkCheckResult,
  finalUrl: URL
): BrokenLinkPage {
  const statusCode =
    link.status === null ? link.statusText : `${link.status} ${link.statusText}`;

  return {
    url: link.url,
    sourcePage: finalUrl.pathname === "/" ? "Home page" : finalUrl.pathname,
    statusCode,
    issue: link.error ?? "The linked page returned an error status.",
    suggestion:
      link.status && link.status >= 500
        ? "Check the destination route or server error logs."
        : "Update the link, restore the page, or add a redirect.",
  };
}

function isPrivateAddress(address: string) {
  if (address === "::1" || address.startsWith("fc") || address.startsWith("fd")) {
    return true;
  }

  if (!isIP(address)) {
    return true;
  }

  if (address.includes(":")) {
    return address.startsWith("fe80:");
  }

  const parts = address.split(".").map(Number);
  const [first, second] = parts;

  return (
    first === 10 ||
    first === 127 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254) ||
    (first === 0 && second === 0) ||
    first >= 224
  );
}

function calculatePerformanceScore(elapsedMs: number, htmlBytes: number) {
  const timePenalty = Math.min(32, Math.round(elapsedMs / 150));
  const sizePenalty = Math.min(28, Math.round(htmlBytes / 120_000));

  return clamp(100 - timePenalty - sizePenalty, 35, 100);
}

function calculateOverallScore({
  brokenLinks,
  hasCsp,
  hasFrameProtection,
  isHttps,
  largePage,
  performanceScore,
  statusOk,
}: {
  brokenLinks: number;
  hasCsp: boolean;
  hasFrameProtection: boolean;
  isHttps: boolean;
  largePage: boolean;
  performanceScore: number;
  statusOk: boolean;
}) {
  const performancePenalty = Math.min(
    18,
    Math.round(Math.max(0, 90 - performanceScore) * 0.35)
  );

  return clamp(
    100 -
      brokenLinks * 5 -
      (statusOk ? 0 : 20) -
      (isHttps ? 0 : 12) -
      (hasCsp ? 0 : 8) -
      (hasFrameProtection ? 0 : 5) -
      performancePenalty -
      (largePage ? 6 : 0),
    20,
    100
  );
}

function countCompletedChecks({
  linkResults,
  resolvedAddresses,
  selectedChecks,
}: {
  linkResults: LinkCheckResult[];
  resolvedAddresses: string[];
  selectedChecks: AuditSelection;
}) {
  return (
    Number(selectedChecks.status) +
    Number(selectedChecks.ssl) +
    (selectedChecks.dns ? Math.max(1, resolvedAddresses.length) : 0) +
    (selectedChecks.security ? 5 : 0) +
    (selectedChecks.links ? Math.max(1, linkResults.length) : 0) +
    Number(selectedChecks.audit)
  );
}

function getPerformanceLabel(score: number) {
  if (score >= 86) {
    return "Excellent";
  }

  if (score >= 75) {
    return "Good";
  }

  if (score >= 60) {
    return "Fair";
  }

  return "Slow";
}

function getScoreLabel(score: number) {
  if (score >= 90) {
    return "Excellent";
  }

  if (score >= 78) {
    return "Good";
  }

  if (score >= 62) {
    return "Fair";
  }

  return "Needs Work";
}

function getSummary({
  actionableIssues,
  hostname,
  performanceScore,
  score,
}: SummaryInput) {
  if (actionableIssues.length === 0) {
    return `${hostname} looks healthy across the selected live checks. Keep monitoring status, SSL, and security headers over time.`;
  }

  const issueTitles = actionableIssues.map((issue) => issue.title.toLowerCase());
  const reviewAreas = [
    issueTitles.some((title) => title.includes("status")) ? "status" : "",
    issueTitles.some((title) => title.includes("https")) ? "HTTPS" : "",
    issueTitles.some((title) => title.includes("broken links")) ? "broken links" : "",
    issueTitles.some((title) => title.includes("csp") || title.includes("clickjacking"))
      ? "security headers"
      : "",
    performanceScore < 75 ? "performance" : "",
  ].filter(Boolean);

  if (score >= 78) {
    return reviewAreas.length > 0
      ? `${hostname} is in good shape. Review ${reviewAreas.join(", ")} when you have time.`
      : `${hostname} is in good shape, with a few best-practice items worth reviewing.`;
  }

  return reviewAreas.length > 0
    ? `${hostname} needs attention. Start with ${reviewAreas.join(", ")}.`
    : `${hostname} needs attention. Review the detailed results below.`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
