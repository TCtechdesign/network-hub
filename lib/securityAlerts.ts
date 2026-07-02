export type SecurityAlertSource = "cisa-kev" | "nvd";

export type SecurityAlert = {
  id: string;
  source: SecurityAlertSource;
  sourceLabel: string;
  sourceUrl: string;
  title: string;
  cveId: string;
  affectedProduct: string;
  vendor?: string;
  product?: string;
  severity: "critical" | "high" | "known-exploited";
  severityLabel: string;
  score?: number;
  date: string;
  dueDate?: string;
  description: string;
  action: string;
  ransomwareUse?: string;
  tags: string[];
};

export type SecuritySourceStatus = {
  source: string;
  ok: boolean;
  message: string;
  url: string;
};

export type SecurityAlertsData = {
  alerts: SecurityAlert[];
  fetchedAt: string;
  sourceStatuses: SecuritySourceStatus[];
  summary: {
    criticalCount: number;
    knownExploitedCount: number;
    ransomwareLinkedCount: number;
    sourceIssueCount: number;
  };
};

type CisaKevFeed = {
  vulnerabilities?: CisaKevItem[];
};

type CisaKevItem = {
  cveID?: string;
  vendorProject?: string;
  product?: string;
  vulnerabilityName?: string;
  dateAdded?: string;
  shortDescription?: string;
  requiredAction?: string;
  dueDate?: string;
  knownRansomwareCampaignUse?: string;
  notes?: string;
};

type NvdFeed = {
  vulnerabilities?: NvdVulnerability[];
};

type NvdVulnerability = {
  cve?: {
    id?: string;
    published?: string;
    descriptions?: NvdDescription[];
    metrics?: NvdMetrics;
  };
};

type NvdDescription = {
  lang?: string;
  value?: string;
};

type NvdMetrics = {
  cvssMetricV40?: NvdMetric[];
  cvssMetricV31?: NvdMetric[];
  cvssMetricV30?: NvdMetric[];
  cvssMetricV2?: NvdMetric[];
};

type NvdMetric = {
  cvssData?: {
    baseScore?: number;
    baseSeverity?: string;
  };
};

const cisaKevUrl =
  "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";
const cisaCatalogUrl =
  "https://www.cisa.gov/known-exploited-vulnerabilities-catalog";
const nvdApiUrl = "https://services.nvd.nist.gov/rest/json/cves/2.0";
const nvdDocsUrl = "https://nvd.nist.gov/developers/vulnerabilities";
const nvdRecentDays = 45;
const feedRevalidateSeconds = 60 * 60 * 6;
const feedTimeoutMs = 7000;

export async function getSecurityAlertsData(): Promise<SecurityAlertsData> {
  const [cisaResult, nvdResult] = await Promise.allSettled([
    fetchCisaKevAlerts(),
    fetchRecentCriticalCves(),
  ]);
  const cisaAlerts =
    cisaResult.status === "fulfilled" ? cisaResult.value.alerts : [];
  const nvdAlerts =
    nvdResult.status === "fulfilled" ? nvdResult.value.alerts : [];
  const alerts = dedupeAlerts([...cisaAlerts, ...nvdAlerts])
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 24);
  const sourceStatuses: SecuritySourceStatus[] = [
    cisaResult.status === "fulfilled"
      ? cisaResult.value.status
      : createSourceStatus(
          "CISA KEV",
          false,
          "CISA known-exploited vulnerabilities could not be loaded.",
          cisaCatalogUrl
        ),
    nvdResult.status === "fulfilled"
      ? nvdResult.value.status
      : createSourceStatus(
          "NVD",
          false,
          "Recent critical CVEs could not be loaded.",
          nvdDocsUrl
        ),
  ];

  return {
    alerts,
    fetchedAt: new Date().toISOString(),
    sourceStatuses,
    summary: {
      criticalCount: alerts.filter((alert) => alert.severity === "critical")
        .length,
      knownExploitedCount: alerts.filter(
        (alert) => alert.source === "cisa-kev"
      ).length,
      ransomwareLinkedCount: alerts.filter(
        (alert) => alert.ransomwareUse?.toLowerCase() === "known"
      ).length,
      sourceIssueCount: sourceStatuses.filter((status) => !status.ok).length,
    },
  };
}

async function fetchCisaKevAlerts() {
  const response = await fetch(cisaKevUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Network Hub security alerts",
    },
    next: { revalidate: feedRevalidateSeconds },
    signal: createTimeoutSignal(),
  });

  if (!response.ok) {
    throw new Error(`CISA returned ${response.status}`);
  }

  const feed = (await response.json()) as CisaKevFeed;
  const vulnerabilities = Array.isArray(feed.vulnerabilities)
    ? feed.vulnerabilities
    : [];
  const alerts = vulnerabilities
    .filter((item) => item.cveID && item.vulnerabilityName)
    .sort((a, b) => dateSortValue(b.dateAdded) - dateSortValue(a.dateAdded))
    .slice(0, 14)
    .map(cisaItemToAlert);

  return {
    alerts,
    status: createSourceStatus(
      "CISA KEV",
      true,
      `${alerts.length} exploited vulnerabilities loaded.`,
      cisaCatalogUrl
    ),
  };
}

async function fetchRecentCriticalCves() {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setUTCDate(startDate.getUTCDate() - nvdRecentDays);
  const url = new URL(nvdApiUrl);

  url.searchParams.set("cvssV3Severity", "CRITICAL");
  url.searchParams.set("pubStartDate", startDate.toISOString());
  url.searchParams.set("pubEndDate", now.toISOString());
  url.searchParams.set("resultsPerPage", "12");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Network Hub security alerts",
    },
    next: { revalidate: feedRevalidateSeconds },
    signal: createTimeoutSignal(),
  });

  if (!response.ok) {
    throw new Error(`NVD returned ${response.status}`);
  }

  const feed = (await response.json()) as NvdFeed;
  const vulnerabilities = Array.isArray(feed.vulnerabilities)
    ? feed.vulnerabilities
    : [];
  const alerts = vulnerabilities
    .map(nvdItemToAlert)
    .filter((alert): alert is SecurityAlert => Boolean(alert))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 10);

  return {
    alerts,
    status: createSourceStatus(
      "NVD",
      true,
      `${alerts.length} recent critical CVEs loaded.`,
      nvdDocsUrl
    ),
  };
}

function cisaItemToAlert(item: CisaKevItem): SecurityAlert {
  const cveId = item.cveID ?? "";
  const vendor = normalizeText(item.vendorProject);
  const product = normalizeText(item.product);
  const affectedProduct = [vendor, product].filter(Boolean).join(" ") || cveId;
  const title = normalizeText(item.vulnerabilityName) || `${cveId} alert`;
  const description =
    normalizeText(item.shortDescription) ||
    "CISA lists this vulnerability as known to be exploited in the wild.";
  const action =
    normalizeText(item.requiredAction) ||
    "Review vendor guidance and apply mitigations or updates.";

  return {
    id: `cisa-${cveId}`,
    source: "cisa-kev",
    sourceLabel: "CISA KEV",
    sourceUrl: cisaCatalogUrl,
    title,
    cveId,
    affectedProduct,
    vendor,
    product,
    severity: "known-exploited",
    severityLabel: "Known exploited",
    date: normalizeDate(item.dateAdded),
    dueDate: normalizeDate(item.dueDate),
    description,
    action,
    ransomwareUse: normalizeText(item.knownRansomwareCampaignUse),
    tags: createAudienceTags(`${affectedProduct} ${title} ${description}`),
  };
}

function nvdItemToAlert(item: NvdVulnerability): SecurityAlert | null {
  const cve = item.cve;
  const cveId = cve?.id ?? "";

  if (!cveId) {
    return null;
  }

  const metric = extractBestMetric(cve?.metrics);
  const description = getEnglishDescription(cve?.descriptions);

  return {
    id: `nvd-${cveId}`,
    source: "nvd",
    sourceLabel: "NVD",
    sourceUrl: `https://nvd.nist.gov/vuln/detail/${encodeURIComponent(cveId)}`,
    title: cveId,
    cveId,
    affectedProduct: inferAffectedProduct(description),
    severity: "critical",
    severityLabel: metric?.severity ?? "Critical",
    score: metric?.score,
    date: normalizeDate(cve?.published),
    description:
      description ||
      "NVD published this critical CVE recently. Review vendor details before taking action.",
    action:
      "Review the vendor advisory, patch affected systems, and reduce internet exposure until fixed.",
    tags: createAudienceTags(`${cveId} ${description}`),
  };
}

function dedupeAlerts(alerts: SecurityAlert[]) {
  const seen = new Set<string>();

  return alerts.filter((alert) => {
    const key = alert.cveId || alert.id;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function extractBestMetric(metrics?: NvdMetrics) {
  const metric =
    metrics?.cvssMetricV40?.[0] ??
    metrics?.cvssMetricV31?.[0] ??
    metrics?.cvssMetricV30?.[0] ??
    metrics?.cvssMetricV2?.[0];
  const score = metric?.cvssData?.baseScore;
  const severity = metric?.cvssData?.baseSeverity;

  if (typeof score !== "number" && !severity) {
    return null;
  }

  return {
    score,
    severity: severity ? titleCase(severity) : "Critical",
  };
}

function getEnglishDescription(descriptions?: NvdDescription[]) {
  return normalizeText(
    descriptions?.find((description) => description.lang === "en")?.value ??
      descriptions?.[0]?.value
  );
}

function inferAffectedProduct(description: string) {
  const firstSentence = description.split(".")[0]?.trim();

  if (!firstSentence) {
    return "Affected software";
  }

  return firstSentence.length > 96
    ? `${firstSentence.slice(0, 93).trim()}...`
    : firstSentence;
}

function createAudienceTags(text: string) {
  const lowerText = text.toLowerCase();
  const tagRules: Array<[string, string[]]> = [
    ["Windows", ["windows", "microsoft", "exchange", "office", "outlook"]],
    ["macOS", ["macos", "apple", "ios", "ipados", "safari"]],
    ["Linux", ["linux", "ubuntu", "debian", "red hat", "kernel"]],
    ["Browsers", ["chrome", "chromium", "firefox", "edge", "browser"]],
    ["Routers", ["router", "gateway", "firmware", "vpn", "firewall"]],
    ["Servers", ["server", "apache", "nginx", "iis", "openssh", "tomcat"]],
    ["Cloud", ["cloud", "aws", "azure", "google cloud", "kubernetes"]],
    ["Email", ["email", "mail", "smtp", "imap", "exchange", "outlook"]],
    ["Home Network", ["router", "nas", "camera", "printer", "iot"]],
  ];
  const tags = tagRules
    .filter(([, matches]) => matches.some((match) => lowerText.includes(match)))
    .map(([tag]) => tag);

  return tags.length > 0 ? Array.from(new Set(tags)) : ["General"];
}

function createSourceStatus(
  source: string,
  ok: boolean,
  message: string,
  url: string
): SecuritySourceStatus {
  return {
    source,
    ok,
    message,
    url,
  };
}

function createTimeoutSignal() {
  if (typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(feedTimeoutMs);
  }

  const controller = new AbortController();
  setTimeout(() => controller.abort(), feedTimeoutMs);

  return controller.signal;
}

function normalizeText(value?: string) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function normalizeDate(value?: string) {
  if (!value) {
    return new Date(0).toISOString();
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

function dateSortValue(value?: string) {
  return Date.parse(normalizeDate(value));
}

function titleCase(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
