"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  MessageSquareText,
  Search,
  Sparkles,
  Terminal,
  X,
} from "lucide-react";
import type { GuideAssistantSettings } from "@/data/tools";

type AssistantGuide = {
  slug: string;
  title: string;
  category: string;
  description: string;
  difficulty?: string;
  readTime?: string;
  content?: string;
};

type IssueProfile = {
  label: string;
  prompt: string;
  terms: string[];
  preferredGuideSlugs: string[];
  categoryBoosts: string[];
  commands: string[];
  checkpoints: string[];
};

type GuideAssistantProps = {
  guides: AssistantGuide[];
  className?: string;
  currentGuideSlug?: string;
  settings?: GuideAssistantSettings;
};

const issueProfiles: IssueProfile[] = [
  {
    label: "No internet",
    prompt: "My Wi-Fi is connected, but websites and apps cannot reach the internet.",
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
    label: "DNS errors",
    prompt: "Websites show DNS errors like server not found or this site cannot be reached.",
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
    label: "DHCP/IP issue",
    prompt: "My device is not getting a valid IP address or keeps changing IP addresses.",
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
    label: "Slow or laggy",
    prompt: "The connection works, but websites, games, or VPN sessions are slow or laggy.",
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
    label: "Packet loss",
    prompt: "I am seeing packet loss, dropped connections, or random disconnects.",
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
    commands: ["ping -n 50 google.com", "ping -c 50 google.com", "traceroute google.com"],
    checkpoints: [
      "Look for loss percentage and whether timeouts happen consistently.",
      "Compare wired and Wi-Fi results to narrow down the problem area.",
    ],
  },
  {
    label: "Ports/gaming",
    prompt: "A game, Xbox, server, or remote app needs port forwarding or NAT help.",
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
];

const guideKeywords: Record<string, string[]> = {
  "dhcp-troubleshooting": ["dhcp", "lease", "pool", "gateway", "ip conflict"],
  "dns-troubleshooting": ["dns", "nxdomain", "server not found", "flushdns"],
  "what-is-dns": ["dns", "domain", "hostname", "resolver"],
  "what-is-dhcp": ["dhcp", "automatic ip", "lease", "network settings"],
  "what-is-an-ip-address": ["ip address", "ipv4", "ipv6", "private ip", "public ip"],
  "what-is-a-mac-address": ["mac address", "physical address", "network adapter"],
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
};

const fallbackAssistantSettings: GuideAssistantSettings = {
  symptoms: issueProfiles.map((profile) => ({
    ...profile,
    id: normalize(profile.label).replace(/[^a-z0-9]+/g, "-") || "symptom",
  })),
  guideKeywords,
  fallbackCommands: ["ping 8.8.8.8", "ping google.com", "ipconfig /all"],
  fallbackCheckpoints: [
    "Write down the exact error message before changing settings.",
    "Test one thing at a time so you know which change helped.",
  ],
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^a-z0-9.'\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function getMatchedProfiles(query: string, settings: GuideAssistantSettings) {
  const normalizedQuery = normalize(query);

  return settings.symptoms.filter((profile) =>
    profile.terms.some((term) => normalizedQuery.includes(normalize(term)))
  );
}

function getGuideText(guide: AssistantGuide, settings: GuideAssistantSettings) {
  return normalize(
    [
      guide.title,
      guide.category,
      guide.description,
      guide.difficulty,
      guide.readTime,
      guide.content,
      ...(settings.guideKeywords[guide.slug] ?? []),
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function getRecommendations(
  guides: AssistantGuide[],
  query: string,
  currentGuideSlug: string | undefined,
  settings: GuideAssistantSettings
) {
  const normalizedQuery = normalize(query);
  const matchedProfiles = getMatchedProfiles(query, settings);
  const queryWords = normalizedQuery
    .split(" ")
    .filter((word) => word.length > 2);
  const profileTerms = matchedProfiles.flatMap((profile) =>
    profile.terms.map((term) => normalize(term))
  );
  const searchTerms = unique([...queryWords, ...profileTerms]);

  return guides
    .map((guide) => {
      const guideText = getGuideText(guide, settings);
      const matchedTerms: string[] = [];
      let score = 0;

      searchTerms.forEach((term) => {
        if (!term || !guideText.includes(term)) {
          return;
        }

        matchedTerms.push(term);
        score += term.includes(" ") ? 6 : 2;
      });

      matchedProfiles.forEach((profile) => {
        if (profile.preferredGuideSlugs.includes(guide.slug)) {
          score += 12;
        }

        if (profile.categoryBoosts.includes(guide.category)) {
          score += 4;
        }
      });

      if (currentGuideSlug && guide.slug === currentGuideSlug) {
        score += 2;
      }

      return {
        guide,
        matchedTerms: unique(matchedTerms).slice(0, 4),
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function getSuggestedCommands(query: string, settings: GuideAssistantSettings) {
  const matchedProfiles = getMatchedProfiles(query, settings);
  const commands = matchedProfiles.flatMap((profile) => profile.commands);

  if (commands.length === 0) {
    return settings.fallbackCommands;
  }

  return unique(commands).slice(0, 5);
}

function getCheckpoints(query: string, settings: GuideAssistantSettings) {
  const matchedProfiles = getMatchedProfiles(query, settings);
  const checkpoints = matchedProfiles.flatMap((profile) => profile.checkpoints);

  if (checkpoints.length === 0) {
    return settings.fallbackCheckpoints;
  }

  return unique(checkpoints).slice(0, 4);
}

export default function GuideAssistant({
  guides,
  className = "",
  currentGuideSlug,
  settings,
}: GuideAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const assistantSettings = settings ?? fallbackAssistantSettings;

  const hasQuery = query.trim().length > 0;
  const recommendations = useMemo(
    () =>
      hasQuery
        ? getRecommendations(guides, query, currentGuideSlug, assistantSettings)
        : [],
    [assistantSettings, currentGuideSlug, guides, hasQuery, query]
  );
  const commands = useMemo(
    () => (hasQuery ? getSuggestedCommands(query, assistantSettings) : []),
    [assistantSettings, hasQuery, query]
  );
  const checkpoints = useMemo(
    () => (hasQuery ? getCheckpoints(query, assistantSettings) : []),
    [assistantSettings, hasQuery, query]
  );

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;

    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const assistantDialog =
    isOpen
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/90 px-4 py-6 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-assistant-title"
          >
            <div className="relative z-[101] max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-slate-700 bg-[#020817] shadow-2xl shadow-slate-950/80">
              <div className="sticky top-0 z-10 border-b border-slate-800 bg-[#020817]/95 px-5 py-4 backdrop-blur sm:px-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 text-cyan-400">
                      <Sparkles size={22} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
                        Guide Assistant
                      </p>
                      <h2
                        id="guide-assistant-title"
                        className="truncate text-xl font-semibold text-white"
                      >
                        What are you trying to fix?
                      </h2>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-800 text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400"
                    aria-label="Close assistant"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <section className="min-w-0">
                  <label className="block text-sm font-medium text-slate-200">
                    Describe the problem
                  </label>
                  <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3 focus-within:border-cyan-500">
                    <div className="flex items-start gap-3">
                      <MessageSquareText
                        className="mt-2 shrink-0 text-cyan-400"
                        size={20}
                      />
                      <textarea
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Example: Wi-Fi is connected, but websites say server not found."
                        className="min-h-28 w-full resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {assistantSettings.symptoms.map((profile) => (
                      <button
                        key={profile.label}
                        type="button"
                        onClick={() => setQuery(profile.prompt)}
                        className="rounded-full border border-slate-800 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400"
                      >
                        {profile.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950/55 p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <Search size={18} className="text-cyan-400" />
                      Recommended Guides
                    </div>

                    {!hasQuery ? (
                      <p className="mt-4 text-sm leading-6 text-slate-400">
                        Choose a symptom or type what is happening, and matching
                        guide links will appear here.
                      </p>
                    ) : recommendations.length > 0 ? (
                      <div className="mt-4 space-y-3">
                        {recommendations.map(({ guide, matchedTerms }) => (
                          <Link
                            key={guide.slug}
                            href={`/guides/${guide.slug}`}
                            onClick={() => setIsOpen(false)}
                            className="block rounded-lg border border-slate-800 bg-slate-900/55 p-4 transition hover:border-cyan-500 hover:bg-slate-900"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-white">
                                  {guide.title}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-slate-400">
                                  {guide.description}
                                </p>
                              </div>
                              <ArrowRight
                                className="mt-1 shrink-0 text-cyan-400"
                                size={18}
                              />
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                              <span className="rounded-full bg-blue-600/15 px-2.5 py-1 text-cyan-300">
                                {guide.category}
                              </span>
                              {matchedTerms.map((term) => (
                                <span
                                  key={term}
                                  className="rounded-full bg-slate-800/80 px-2.5 py-1 text-slate-300"
                                >
                                  {term}
                                </span>
                              ))}
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm leading-6 text-slate-400">
                        I do not see a strong guide match yet. Try adding the
                        exact error message, device type, or command output.
                      </p>
                    )}
                  </div>
                </section>

                <aside className="space-y-4">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/55 p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <Terminal size={18} className="text-green-400" />
                      First Commands
                    </div>

                    {hasQuery ? (
                      <div className="mt-4 space-y-2">
                        {commands.map((command) => (
                          <code
                            key={command}
                            className="block overflow-x-auto rounded-md border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-xs text-green-400"
                          >
                            {command}
                          </code>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm leading-6 text-slate-400">
                        Commands will update after you describe the issue.
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950/55 p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <ClipboardList size={18} className="text-cyan-400" />
                      What To Check
                    </div>

                    {hasQuery ? (
                      <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                        {checkpoints.map((checkpoint) => (
                          <li key={checkpoint} className="flex gap-3">
                            <CheckCircle2
                              className="mt-0.5 shrink-0 text-green-400"
                              size={17}
                            />
                            <span>{checkpoint}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-4 text-sm leading-6 text-slate-400">
                        A short checklist will show up here.
                      </p>
                    )}
                  </div>
                </aside>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div
        className={`rounded-lg border border-slate-800 bg-slate-900/45 p-5 ${className}`}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
            <Bot size={28} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">Need Help?</h2>
            <p className="mt-2 text-sm text-slate-400">
              Try our AI Troubleshooting Assistant for personalized help.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          Open Assistant
          <ChevronRight size={16} />
        </button>
      </div>

      {assistantDialog}
    </>
  );
}
