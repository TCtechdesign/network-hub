export const homepageCardIcons = [
  "activity",
  "book-open",
  "clipboard-copy",
  "globe",
  "network",
  "search",
  "server",
  "shapes",
  "terminal",
  "user-check",
  "wifi",
] as const;

export type HomepageCardIcon = (typeof homepageCardIcons)[number];

export type HomepageHeroContent = {
  eyebrow: string;
  title: string;
  highlightedTitle: string;
  intro: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
};

export type HomepageLinkCard = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: HomepageCardIcon;
  actionLabel: string;
};

export type HomepageCommandCard = {
  id: string;
  name: string;
  description: string;
  href: string;
  copyText: string;
};

export type HomepageInfoCard = {
  id: string;
  title: string;
  description: string;
  icon: HomepageCardIcon;
};

export type HomepageRecommendedCta = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  imageSrc: string;
  imageAlt: string;
};

export type HomepageContent = {
  hero: HomepageHeroContent;
  featuredGuidesTitle: string;
  featuredGuides: HomepageLinkCard[];
  featuredToolsEyebrow: string;
  featuredToolsTitle: string;
  featuredTools: HomepageLinkCard[];
  popularCommandsTitle: string;
  popularCommands: HomepageCommandCard[];
  recommendedCardsTitle: string;
  recommendedCards: HomepageInfoCard[];
  recommendedCta: HomepageRecommendedCta;
  updatedAt?: string;
};

export const defaultHomepageContent: HomepageContent = {
  hero: {
    eyebrow: "Network Troubleshooting Knowledge Base",
    title: "Network Troubleshooting",
    highlightedTitle: "Made Simple",
    intro:
      "Commands, troubleshooting guides, and resources to help diagnose and fix network issues faster.",
    primaryCtaLabel: "Browse Commands",
    primaryCtaHref: "/commands",
    secondaryCtaLabel: "Troubleshooting Guides",
    secondaryCtaHref: "/guides",
  },
  featuredGuidesTitle: "Quick Access",
  featuredGuides: [
    {
      id: "dns-issues",
      title: "DNS Issues",
      icon: "globe",
      href: "/guides/dns-troubleshooting",
      description: "Fix lookup failures and websites that will not load.",
      actionLabel: "Open Guide",
    },
    {
      id: "dhcp-issues",
      title: "DHCP Issues",
      icon: "network",
      href: "/guides/dhcp-troubleshooting",
      description: "Troubleshoot IP assignment and lease problems.",
      actionLabel: "Open Guide",
    },
    {
      id: "slow-wifi",
      title: "Slow WiFi",
      icon: "wifi",
      href: "/guides/how-to-fix-no-internet-connection",
      description: "Start with the basics when a connection feels broken.",
      actionLabel: "Open Guide",
    },
    {
      id: "packet-loss",
      title: "Packet Loss",
      icon: "activity",
      href: "/guides/how-to-troubleshoot-packet-loss",
      description: "Find dropped packets, lag, and unstable routes.",
      actionLabel: "Open Guide",
    },
  ],
  featuredToolsEyebrow: "Tool Ideas",
  featuredToolsTitle: "Quick Network Tools",
  featuredTools: [
    {
      id: "dns-check",
      title: "DNS Check",
      description: "Test DNS resolution and compare public resolvers.",
      href: "/tools/dns-lookup",
      icon: "search",
      actionLabel: "Explore",
    },
    {
      id: "ip-address-lookup",
      title: "IP Address Lookup",
      description: "Review address basics, private ranges, and device IDs.",
      href: "/tools/ip-address-lookup",
      icon: "network",
      actionLabel: "Explore",
    },
    {
      id: "port-lookup",
      title: "Port Lookup",
      description: "Search common ports by service, protocol, or category.",
      href: "/ports",
      icon: "server",
      actionLabel: "Explore",
    },
    {
      id: "ping-test",
      title: "Ping Test",
      description: "Use ping to check reachability and response time.",
      href: "/commands/ping",
      icon: "terminal",
      actionLabel: "Explore",
    },
  ],
  popularCommandsTitle: "Popular Commands",
  popularCommands: [
    {
      id: "ping",
      name: "ping",
      description: "Test connectivity to a device or website.",
      href: "/commands/ping",
      copyText: "ping 8.8.8.8",
    },
    {
      id: "nslookup",
      name: "nslookup",
      description: "Query DNS records and troubleshoot DNS issues.",
      href: "/commands/nslookup",
      copyText: "nslookup google.com",
    },
    {
      id: "ipconfig",
      name: "ipconfig",
      description: "View and manage network configuration.",
      href: "/commands/ipconfig",
      copyText: "ipconfig /all",
    },
    {
      id: "tracert",
      name: "tracert",
      description: "Trace the path packets take across the network.",
      href: "/commands/tracert",
      copyText: "tracert google.com",
    },
    {
      id: "netstat",
      name: "netstat",
      description: "Display active network connections.",
      href: "/commands/netstat",
      copyText: "netstat -ano",
    },
    {
      id: "arp",
      name: "arp",
      description: "View and troubleshoot ARP entries.",
      href: "/commands/arp",
      copyText: "arp -a",
    },
  ],
  recommendedCardsTitle: "Why Use Network Hub?",
  recommendedCards: [
    {
      id: "quick-reference",
      title: "Quick Reference",
      description: "Find commands fast when you need them.",
      icon: "book-open",
    },
    {
      id: "copy-paste",
      title: "Copy & Paste",
      description: "One click to copy commands.",
      icon: "clipboard-copy",
    },
    {
      id: "beginner-friendly",
      title: "Beginner Friendly",
      description: "Easy explanations and examples.",
      icon: "user-check",
    },
    {
      id: "real-examples",
      title: "Real Examples",
      description: "Real world outputs and use cases.",
      icon: "shapes",
    },
  ],
  recommendedCta: {
    title: "Still stuck with a network issue?",
    description:
      "Browse our troubleshooting guides with step-by-step solutions.",
    ctaLabel: "Explore Guides",
    ctaHref: "/guides",
    imageSrc: "/images/server.png",
    imageAlt: "Network servers connected to smaller devices.",
  },
};

export function cloneHomepageContent(
  content: HomepageContent = defaultHomepageContent
) {
  return JSON.parse(JSON.stringify(content)) as HomepageContent;
}

export function createHomepageItemId(value: string) {
  const id = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return id || "homepage-item";
}

export function normalizeHomepageContent(value: unknown): HomepageContent {
  const fallback = defaultHomepageContent;
  const source = isRecord(value) ? value : {};

  return {
    hero: normalizeHero(source.hero, fallback.hero),
    featuredGuidesTitle: readString(
      source.featuredGuidesTitle,
      fallback.featuredGuidesTitle
    ),
    featuredGuides: normalizeLinkCards(
      source.featuredGuides,
      fallback.featuredGuides
    ),
    featuredToolsEyebrow: readString(
      source.featuredToolsEyebrow,
      fallback.featuredToolsEyebrow
    ),
    featuredToolsTitle: readString(
      source.featuredToolsTitle,
      fallback.featuredToolsTitle
    ),
    featuredTools: normalizeLinkCards(
      source.featuredTools,
      fallback.featuredTools
    ),
    popularCommandsTitle: readString(
      source.popularCommandsTitle,
      fallback.popularCommandsTitle
    ),
    popularCommands: normalizeCommandCards(
      source.popularCommands,
      fallback.popularCommands
    ),
    recommendedCardsTitle: readString(
      source.recommendedCardsTitle,
      fallback.recommendedCardsTitle
    ),
    recommendedCards: normalizeInfoCards(
      source.recommendedCards,
      fallback.recommendedCards
    ),
    recommendedCta: normalizeRecommendedCta(
      source.recommendedCta,
      fallback.recommendedCta
    ),
    updatedAt: readOptionalString(source.updatedAt),
  };
}

function normalizeHero(value: unknown, fallback: HomepageHeroContent) {
  const source = isRecord(value) ? value : {};

  return {
    eyebrow: readString(source.eyebrow, fallback.eyebrow),
    title: readString(source.title, fallback.title),
    highlightedTitle: readString(
      source.highlightedTitle,
      fallback.highlightedTitle
    ),
    intro: readString(source.intro, fallback.intro),
    primaryCtaLabel: readString(
      source.primaryCtaLabel,
      fallback.primaryCtaLabel
    ),
    primaryCtaHref: readHref(source.primaryCtaHref, fallback.primaryCtaHref),
    secondaryCtaLabel: readString(
      source.secondaryCtaLabel,
      fallback.secondaryCtaLabel
    ),
    secondaryCtaHref: readHref(
      source.secondaryCtaHref,
      fallback.secondaryCtaHref
    ),
  } satisfies HomepageHeroContent;
}

function normalizeLinkCards(value: unknown, fallback: HomepageLinkCard[]) {
  const cards = Array.isArray(value)
    ? value.map((card, index) => normalizeLinkCard(card, index)).filter(isLinkCard)
    : [];

  return cards.length > 0 ? cards : fallback;
}

function normalizeLinkCard(value: unknown, index: number) {
  if (!isRecord(value)) {
    return null;
  }

  const title = readString(value.title, `Featured Item ${index + 1}`);

  return {
    id: createHomepageItemId(readString(value.id, title)),
    title,
    description: readString(value.description, "Featured homepage item."),
    href: readHref(value.href, "/"),
    icon: readIcon(value.icon),
    actionLabel: readString(value.actionLabel, "Open"),
  } satisfies HomepageLinkCard;
}

function normalizeCommandCards(
  value: unknown,
  fallback: HomepageCommandCard[]
) {
  const cards = Array.isArray(value)
    ? value
        .map((card, index) => normalizeCommandCard(card, index))
        .filter(isCommandCard)
    : [];

  return cards.length > 0 ? cards : fallback;
}

function normalizeCommandCard(value: unknown, index: number) {
  if (!isRecord(value)) {
    return null;
  }

  const name = readString(value.name, `command-${index + 1}`);

  return {
    id: createHomepageItemId(readString(value.id, name)),
    name,
    description: readString(value.description, "Popular network command."),
    href: readHref(value.href, "/commands"),
    copyText: readString(value.copyText, name),
  } satisfies HomepageCommandCard;
}

function normalizeInfoCards(value: unknown, fallback: HomepageInfoCard[]) {
  const cards = Array.isArray(value)
    ? value.map((card, index) => normalizeInfoCard(card, index)).filter(isInfoCard)
    : [];

  return cards.length > 0 ? cards : fallback;
}

function normalizeInfoCard(value: unknown, index: number) {
  if (!isRecord(value)) {
    return null;
  }

  const title = readString(value.title, `Recommended Item ${index + 1}`);

  return {
    id: createHomepageItemId(readString(value.id, title)),
    title,
    description: readString(value.description, "Recommended homepage item."),
    icon: readIcon(value.icon),
  } satisfies HomepageInfoCard;
}

function normalizeRecommendedCta(
  value: unknown,
  fallback: HomepageRecommendedCta
) {
  const source = isRecord(value) ? value : {};

  return {
    title: readString(source.title, fallback.title),
    description: readString(source.description, fallback.description),
    ctaLabel: readString(source.ctaLabel, fallback.ctaLabel),
    ctaHref: readHref(source.ctaHref, fallback.ctaHref),
    imageSrc: readLocalPath(source.imageSrc, fallback.imageSrc),
    imageAlt: readString(source.imageAlt, fallback.imageAlt),
  } satisfies HomepageRecommendedCta;
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function readOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readHref(value: unknown, fallback: string) {
  const href = readString(value, fallback);

  return href.startsWith("/") || href.startsWith("https://") ? href : fallback;
}

function readLocalPath(value: unknown, fallback: string) {
  const path = readString(value, fallback);

  return path.startsWith("/") ? path : fallback;
}

function readIcon(value: unknown): HomepageCardIcon {
  return homepageCardIcons.includes(value as HomepageCardIcon)
    ? (value as HomepageCardIcon)
    : "network";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLinkCard(value: HomepageLinkCard | null): value is HomepageLinkCard {
  return value !== null;
}

function isCommandCard(
  value: HomepageCommandCard | null
): value is HomepageCommandCard {
  return value !== null;
}

function isInfoCard(value: HomepageInfoCard | null): value is HomepageInfoCard {
  return value !== null;
}
