export const toolIconOptions = [
  "map-pin",
  "globe",
  "dns",
  "network",
  "activity",
  "ethernet",
  "gauge",
  "pulse",
  "shield",
] as const;

export const toolAccentOptions = [
  "blue",
  "green",
  "violet",
  "amber",
  "cyan",
  "red",
] as const;

export type ToolIcon = (typeof toolIconOptions)[number];
export type ToolAccent = (typeof toolAccentOptions)[number];

export type NetworkTool = {
  slug: string;
  title: string;
  description: string;
  category: string;
  icon: ToolIcon;
  accent: ToolAccent;
  tags: string[];
  features: string[];
  placeholder: string;
  example: string;
  featured: boolean;
  order: number;
  wide?: boolean;
};

export type AssistantSymptomProfile = {
  id: string;
  label: string;
  prompt: string;
  terms: string[];
  preferredGuideSlugs: string[];
  categoryBoosts: string[];
  commands: string[];
  checkpoints: string[];
};

export type GuideAssistantSettings = {
  symptoms: AssistantSymptomProfile[];
  guideKeywords: Record<string, string[]>;
  fallbackCommands: string[];
  fallbackCheckpoints: string[];
};

export type ToolsContent = {
  tools: NetworkTool[];
  assistant: GuideAssistantSettings;
  updatedAt?: string;
};

export const tools: NetworkTool[] = [
  {
    slug: "ip-address-lookup",
    title: "IP Address Lookup",
    description:
      "Lookup IP address details including location, ISP, organization and more.",
    category: "Lookup",
    icon: "map-pin",
    accent: "blue",
    tags: ["IPv4 / IPv6", "GeoIP"],
    features: ["IP location", "ISP details", "Organization lookup"],
    placeholder: "Enter an IP address",
    example: "8.8.8.8",
    featured: true,
    order: 10,
  },
  {
    slug: "public-ip-lookup",
    title: "Public IP Lookup",
    description:
      "Find your public IP address and view details about your connection and ISP.",
    category: "Lookup",
    icon: "globe",
    accent: "green",
    tags: ["IPv4 / IPv6", "ISP Info"],
    features: ["Public IP display", "Connection details", "ISP summary"],
    placeholder: "Your public IP will appear here",
    example: "Auto-detect public IP",
    featured: true,
    order: 20,
  },
  {
    slug: "dns-lookup",
    title: "DNS Lookup",
    description:
      "Lookup DNS records including A, AAAA, MX, NS, TXT, CNAME and more.",
    category: "DNS",
    icon: "dns",
    accent: "violet",
    tags: ["All Record Types"],
    features: ["A and AAAA records", "MX records", "TXT and CNAME lookup"],
    placeholder: "Enter a domain name",
    example: "google.com",
    featured: true,
    order: 30,
  },
  {
    slug: "mac-address-lookup",
    title: "MAC Address Lookup",
    description:
      "Lookup MAC address details including vendor, OUI and other information.",
    category: "Lookup",
    icon: "network",
    accent: "amber",
    tags: ["Vendor Lookup", "OUI"],
    features: ["Vendor lookup", "OUI details", "Hardware identification"],
    placeholder: "Enter a MAC address",
    example: "00:1A:2B:3C:4D:5E",
    featured: false,
    order: 40,
  },
  {
    slug: "traffic-analyzer",
    title: "Traffic Analyzer",
    description:
      "Upload Wireshark files to analyze network traffic and protocols.",
    category: "Analysis",
    icon: "activity",
    accent: "cyan",
    tags: ["Wireshark Upload", "Deep Analysis"],
    features: ["Protocol summary", "Conversation view", "Packet insights"],
    placeholder: "Upload .pcap or .pcapng",
    example: "capture.pcapng",
    featured: false,
    order: 50,
  },
  {
    slug: "port-checker",
    title: "Port Checker",
    description:
      "Check if a port is open on a host and identify the service running on that port.",
    category: "Connectivity",
    icon: "ethernet",
    accent: "red",
    tags: ["TCP / UDP", "Port Scan"],
    features: ["Open port check", "Service hints", "Firewall validation"],
    placeholder: "Enter host and port",
    example: "example.com:443",
    featured: true,
    order: 60,
  },
  {
    slug: "internet-speed-test",
    title: "Internet Speed Test",
    description:
      "Test your download, upload and ping speed with detailed results and history.",
    category: "Performance",
    icon: "gauge",
    accent: "green",
    tags: ["Speed Test", "History"],
    features: ["Download speed", "Upload speed", "Latency report"],
    placeholder: "Start a speed test",
    example: "Run speed test",
    featured: false,
    order: 70,
  },
  {
    slug: "ping-test-analyzer",
    title: "Ping Test Analyzer",
    description:
      "Upload ping results or run ping tests to analyze latency, packet loss and performance.",
    category: "Performance",
    icon: "pulse",
    accent: "violet",
    tags: ["Ping Upload", "Stats & Graphs"],
    features: ["Latency analysis", "Packet loss summary", "Jitter trends"],
    placeholder: "Paste ping output",
    example: "ping 8.8.8.8",
    featured: true,
    order: 80,
  },
  {
    slug: "website-bug-checker",
    title: "Website Bug Checker",
    description: "Comprehensive website analysis and status check.",
    category: "Reports",
    icon: "shield",
    accent: "blue",
    tags: ["Full Website Audit", "Detailed Report"],
    features: [
      "Website Status",
      "SSL Checker",
      "DNS Checker",
      "Security Checker",
      "Broken Link Checker",
    ],
    placeholder: "Enter a website URL",
    example: "https://example.com",
    featured: false,
    order: 90,
    wide: true,
  },
  {
    slug: "port-forward-wizard",
    title: "Port Forward Wizard",
    description:
      "Get guided help setting up port forwarding for games, cameras, servers, remote access, and other home network services.",
    category: "Connectivity",
    icon: "ethernet",
    accent: "violet",
    tags: ["Port Forwarding", "Router Setup", "NAT"],
    features: [
      "Step-by-step setup guidance",
      "Common port recommendations",
      "Private vs public IP checks",
      "Router and device checklist",
      "Port forwarding troubleshooting tips",
    ],
    placeholder: "Enter a service, game, or port number",
    example: "Minecraft server port 25565",
    featured: true,
    order: 100,
  },
];

export const defaultGuideAssistantSettings: GuideAssistantSettings = {
  symptoms: [
    {
      id: "no-internet",
      label: "No internet",
      prompt:
        "My Wi-Fi is connected, but websites and apps cannot reach the internet.",
      terms: [
        "no internet",
        "offline",
        "connected without internet",
        "wifi",
        "router",
        "modem",
        "gateway",
        "cannot browse",
      ],
      preferredGuideSlugs: [
        "how-to-fix-no-internet-connection",
        "dhcp-troubleshooting",
        "dns-troubleshooting",
      ],
      categoryBoosts: ["Connectivity", "Troubleshooting"],
      commands: ["ping 8.8.8.8", "ping google.com", "ipconfig /all"],
      checkpoints: [
        "Separate internet reachability from DNS by testing an IP address first.",
        "Check whether your device has a valid IP address and default gateway.",
      ],
    },
    {
      id: "dns-errors",
      label: "DNS errors",
      prompt:
        "Websites show DNS errors like server not found or this site cannot be reached.",
      terms: [
        "dns",
        "server not found",
        "site cannot be reached",
        "site can't be reached",
        "nxdomain",
        "dns probe",
        "hostname",
      ],
      preferredGuideSlugs: [
        "dns-troubleshooting",
        "what-is-dns",
        "how-to-test-dns-resolution",
      ],
      categoryBoosts: ["Troubleshooting", "Networking Basics"],
      commands: ["nslookup google.com", "ping 8.8.8.8", "ipconfig /flushdns"],
      checkpoints: [
        "If pinging 8.8.8.8 works but pinging google.com fails, DNS is the likely issue.",
        "Confirm the DNS server listed on the device is reachable.",
      ],
    },
    {
      id: "dhcp-ip-issue",
      label: "DHCP/IP issue",
      prompt:
        "My device is not getting a valid IP address or keeps changing IP addresses.",
      terms: [
        "dhcp",
        "ip address",
        "169.254",
        "lease",
        "ip conflict",
        "subnet mask",
        "default gateway",
        "pool",
      ],
      preferredGuideSlugs: [
        "dhcp-troubleshooting",
        "what-is-dhcp",
        "How-to-Set-Up-a-DHCP-Server",
        "how-to-configure-a-static-IP-address",
      ],
      categoryBoosts: ["Troubleshooting", "Configuration", "Networking Basics"],
      commands: ["ipconfig /all", "ipconfig /release", "ipconfig /renew"],
      checkpoints: [
        "Look for DHCP Enabled, DHCP Server, IP Address, and Default Gateway.",
        "Make sure only one device on the network is assigning addresses.",
      ],
    },
    {
      id: "slow-or-laggy",
      label: "Slow or laggy",
      prompt:
        "The connection works, but websites, games, or VPN sessions are slow or laggy.",
      terms: [
        "slow",
        "lag",
        "latency",
        "jitter",
        "vpn",
        "performance",
        "delay",
        "unstable",
      ],
      preferredGuideSlugs: [
        "how-to-use-traceroute-to-find-network-problems",
        "how-to-troubleshoot-packet-loss",
        "How-to-Use-Ping-to-Test-Connectivity",
      ],
      categoryBoosts: ["Connectivity", "Performance"],
      commands: ["ping google.com", "traceroute google.com", "tracert google.com"],
      checkpoints: [
        "Use ping first to confirm latency and packet loss.",
        "Use traceroute when ping shows latency but you need to find where it starts.",
      ],
    },
    {
      id: "packet-loss",
      label: "Packet loss",
      prompt:
        "I am seeing packet loss, dropped connections, or random disconnects.",
      terms: [
        "packet loss",
        "dropped",
        "disconnect",
        "timeout",
        "request timed out",
        "lost",
        "unstable",
      ],
      preferredGuideSlugs: [
        "how-to-troubleshoot-packet-loss",
        "how-to-resolve-connection-timeouts",
        "How-to-Use-Ping-to-Test-Connectivity",
      ],
      categoryBoosts: ["Connectivity", "Troubleshooting"],
      commands: [
        "ping -n 50 google.com",
        "ping -c 50 google.com",
        "traceroute google.com",
      ],
      checkpoints: [
        "Look for loss percentage and whether timeouts happen consistently.",
        "Compare wired and Wi-Fi results to narrow down the problem area.",
      ],
    },
    {
      id: "ports-gaming",
      label: "Ports/gaming",
      prompt:
        "A game, Xbox, server, or remote app needs port forwarding or NAT help.",
      terms: [
        "port",
        "ports",
        "gaming",
        "xbox",
        "nat",
        "forward",
        "remote",
        "server",
        "firewall",
      ],
      preferredGuideSlugs: [
        "How-to-Configure-Port-Forwarding",
        "what-is-NAT",
        "what-is-an-ip-address",
      ],
      categoryBoosts: ["Configuration", "Networking Basics", "Security"],
      commands: ["ipconfig /all", "netstat -an", "nmap -sV 192.168.1.1"],
      checkpoints: [
        "Confirm the device local IP before creating a forwarding rule.",
        "Forward only the required ports and avoid exposing unnecessary services.",
      ],
    },
  ],
  guideKeywords: {
    "dhcp-troubleshooting": ["dhcp", "lease", "pool", "gateway", "ip conflict"],
    "dns-troubleshooting": ["dns", "nxdomain", "server not found", "flushdns"],
    "what-is-dns": ["dns", "domain", "hostname", "resolver"],
    "what-is-dhcp": ["dhcp", "automatic ip", "lease", "network settings"],
    "what-is-an-ip-address": [
      "ip address",
      "ipv4",
      "ipv6",
      "private ip",
      "public ip",
    ],
    "what-is-a-mac-address": [
      "mac address",
      "physical address",
      "network adapter",
    ],
    "what-is-a-subnet": ["subnet", "cidr", "subnet mask", "network range"],
    "what-is-NAT": ["nat", "port forwarding", "public ip", "private ip"],
    "how-to-use-traceroute-to-find-network-problems": [
      "traceroute",
      "tracert",
      "hop",
      "route",
      "latency",
    ],
    "How-to-Use-Ping-to-Test-Connectivity": [
      "ping",
      "latency",
      "packet loss",
      "reachable",
    ],
    "how-to-fix-no-internet-connection": [
      "no internet",
      "wifi",
      "router",
      "modem",
      "gateway",
    ],
    "how-to-troubleshoot-packet-loss": [
      "packet loss",
      "dropped packets",
      "latency",
      "jitter",
    ],
    "how-to-test-dns-resolution": ["dns", "nslookup", "resolver", "domain"],
    "how-to-resolve-connection-timeouts": [
      "timeout",
      "request timed out",
      "connection timeout",
      "slow",
    ],
    "how-to-configure-a-static-IP-address": [
      "static ip",
      "manual ip",
      "ip address",
      "configuration",
    ],
    "How-to-Set-Up-a-DHCP-Server": ["dhcp server", "scope", "ip pool", "lease"],
    "How-to-Configure-Port-Forwarding": [
      "port forwarding",
      "ports",
      "gaming",
      "server",
      "nat",
    ],
  },
  fallbackCommands: ["ping 8.8.8.8", "ping google.com", "ipconfig /all"],
  fallbackCheckpoints: [
    "Write down the exact error message before changing settings.",
    "Test one thing at a time so you know which change helped.",
  ],
};

export function getToolBySlug(slug: string, toolList = tools) {
  return toolList.find((tool) => tool.slug === slug);
}

export function cloneToolsContent(
  content: ToolsContent = {
    tools,
    assistant: defaultGuideAssistantSettings,
  }
): ToolsContent {
  return JSON.parse(JSON.stringify(content)) as ToolsContent;
}

export function createToolSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "network-tool";
}

export function createAssistantItemId(value: string) {
  return createToolSlug(value || "assistant-item");
}

export function normalizeToolsContent(value: unknown): ToolsContent {
  const source = isRecord(value) ? value : {};
  const rawTools = Array.isArray(source.tools) ? source.tools : [];
  const normalizedTools = rawTools
    .map((tool, index) => normalizeTool(tool, index))
    .filter(isNetworkTool);

  return {
    tools: sortTools(normalizedTools.length > 0 ? normalizedTools : tools),
    assistant: normalizeGuideAssistantSettings(source.assistant),
    updatedAt: readOptionalString(source.updatedAt),
  };
}

export function sortTools(toolList: NetworkTool[]) {
  return [...toolList].sort((a, b) => {
    if (a.featured !== b.featured) {
      return a.featured ? -1 : 1;
    }

    const orderDifference = a.order - b.order;

    return orderDifference === 0
      ? a.title.localeCompare(b.title)
      : orderDifference;
  });
}

function normalizeTool(value: unknown, index: number): NetworkTool | null {
  if (!isRecord(value)) {
    return null;
  }

  const fallback = tools[index] ?? tools[0];
  const title = readString(value.title, fallback?.title ?? `Tool ${index + 1}`);
  const slug = createToolSlug(readString(value.slug, fallback?.slug ?? title));

  return {
    slug,
    title,
    description: readString(
      value.description,
      fallback?.description ?? "Network troubleshooting tool."
    ),
    category: readString(value.category, fallback?.category ?? "Tools"),
    icon: readToolIcon(value.icon, fallback?.icon ?? "network"),
    accent: readToolAccent(value.accent, fallback?.accent ?? "blue"),
    tags: readStringList(value.tags, fallback?.tags ?? []),
    features: readStringList(value.features, fallback?.features ?? []),
    placeholder: readString(value.placeholder, fallback?.placeholder ?? ""),
    example: readString(value.example, fallback?.example ?? ""),
    featured: readBoolean(value.featured, fallback?.featured ?? false),
    order: readNumber(value.order, fallback?.order ?? (index + 1) * 10),
    wide: readBoolean(value.wide, fallback?.wide ?? false),
  } satisfies NetworkTool;
}

function normalizeGuideAssistantSettings(value: unknown): GuideAssistantSettings {
  const source = isRecord(value) ? value : {};
  const fallback = defaultGuideAssistantSettings;
  const rawSymptoms = Array.isArray(source.symptoms) ? source.symptoms : [];
  const symptoms = rawSymptoms
    .map((symptom, index) => normalizeSymptomProfile(symptom, index))
    .filter(isAssistantSymptomProfile);

  return {
    symptoms: symptoms.length > 0 ? symptoms : cloneSettings(fallback).symptoms,
    guideKeywords: normalizeGuideKeywords(source.guideKeywords),
    fallbackCommands: readStringList(
      source.fallbackCommands,
      fallback.fallbackCommands
    ),
    fallbackCheckpoints: readStringList(
      source.fallbackCheckpoints,
      fallback.fallbackCheckpoints
    ),
  };
}

function normalizeSymptomProfile(
  value: unknown,
  index: number
): AssistantSymptomProfile | null {
  if (!isRecord(value)) {
    return null;
  }

  const fallback = defaultGuideAssistantSettings.symptoms[index];
  const label = readString(value.label, fallback?.label ?? `Symptom ${index + 1}`);

  return {
    id: createAssistantItemId(readString(value.id, label)),
    label,
    prompt: readString(value.prompt, fallback?.prompt ?? label),
    terms: readStringList(value.terms, fallback?.terms ?? [label]),
    preferredGuideSlugs: readStringList(
      value.preferredGuideSlugs,
      fallback?.preferredGuideSlugs ?? []
    ),
    categoryBoosts: readStringList(
      value.categoryBoosts,
      fallback?.categoryBoosts ?? []
    ),
    commands: readStringList(value.commands, fallback?.commands ?? []),
    checkpoints: readStringList(value.checkpoints, fallback?.checkpoints ?? []),
  };
}

function normalizeGuideKeywords(value: unknown) {
  if (!isRecord(value)) {
    return cloneSettings(defaultGuideAssistantSettings).guideKeywords;
  }

  const entries = Object.entries(value)
    .map(([slug, keywords]) => [
      slug.trim(),
      readStringList(keywords, []),
    ] as const)
    .filter(([slug, keywords]) => slug.length > 0 && keywords.length > 0);

  return entries.length > 0
    ? Object.fromEntries(entries)
    : cloneSettings(defaultGuideAssistantSettings).guideKeywords;
}

function cloneSettings(settings: GuideAssistantSettings) {
  return JSON.parse(JSON.stringify(settings)) as GuideAssistantSettings;
}

function readStringList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  return value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function readOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function readNumber(value: unknown, fallback: number) {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function readToolIcon(value: unknown, fallback: ToolIcon) {
  return toolIconOptions.includes(value as ToolIcon) ? (value as ToolIcon) : fallback;
}

function readToolAccent(value: unknown, fallback: ToolAccent) {
  return toolAccentOptions.includes(value as ToolAccent)
    ? (value as ToolAccent)
    : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNetworkTool(value: NetworkTool | null): value is NetworkTool {
  return value !== null;
}

function isAssistantSymptomProfile(
  value: AssistantSymptomProfile | null
): value is AssistantSymptomProfile {
  return value !== null;
}
