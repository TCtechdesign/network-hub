"use client";

import Link from "next/link";
import {
  Activity,
  BarChart3,
  Cable,
  Check,
  ChevronRight,
  Gauge,
  Globe2,
  Lock,
  MapPin,
  Network,
  Search,
  ShieldCheck,
  ShieldPlus,
  Star,
  Zap,
} from "lucide-react";
import { useState } from "react";
import SiteNav from "@/components/SiteNav";
import type { NetworkTool, ToolIcon } from "@/data/tools";

const iconMap = {
  "map-pin": MapPin,
  globe: Globe2,
  dns: Globe2,
  network: Network,
  activity: Activity,
  ethernet: Cable,
  gauge: Gauge,
  pulse: Activity,
  shield: ShieldCheck,
};

const accentStyles = {
  blue: {
    ring: "border-blue-500/50 bg-blue-500/15 text-blue-300",
    glow: "group-hover:shadow-[0_0_38px_rgba(59,130,246,0.16)]",
  },
  green: {
    ring: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
    glow: "group-hover:shadow-[0_0_38px_rgba(16,185,129,0.14)]",
  },
  violet: {
    ring: "border-violet-500/50 bg-violet-500/15 text-violet-300",
    glow: "group-hover:shadow-[0_0_38px_rgba(139,92,246,0.14)]",
  },
  amber: {
    ring: "border-amber-500/50 bg-amber-500/15 text-amber-300",
    glow: "group-hover:shadow-[0_0_38px_rgba(245,158,11,0.14)]",
  },
  cyan: {
    ring: "border-cyan-500/50 bg-cyan-500/15 text-cyan-300",
    glow: "group-hover:shadow-[0_0_38px_rgba(6,182,212,0.14)]",
  },
  red: {
    ring: "border-red-500/50 bg-red-500/15 text-red-300",
    glow: "group-hover:shadow-[0_0_38px_rgba(239,68,68,0.14)]",
  },
};

function renderToolIcon(icon: ToolIcon, size: number) {
  const Icon = iconMap[icon];

  return <Icon size={size} />;
}

function ToolCard({ tool }: { tool: NetworkTool }) {
  const accent = accentStyles[tool.accent];

  if (tool.wide) {
    return (
      <article className="group rounded-lg border border-slate-800 bg-slate-950/65 p-5 transition hover:border-cyan-500/70 md:col-span-2">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border ${accent.ring}`}
          >
            {renderToolIcon(tool.icon, 34)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold">{tool.title}</h2>
              {tool.featured && <FeaturedBadge />}
            </div>
            <p className="mt-2 text-slate-300">{tool.description}</p>

            <div className="mt-5 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
              {tool.features.map((feature) => (
                <span key={feature} className="inline-flex items-center gap-2">
                  <Check
                    className="rounded-full border border-green-500 text-green-400"
                    size={18}
                  />
                  {feature}
                </span>
              ))}
            </div>

            <ToolTags tool={tool} />

            <OpenToolLink slug={tool.slug} />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`group rounded-lg border border-slate-800 bg-slate-950/65 p-5 transition hover:-translate-y-1 hover:border-cyan-500/70 ${accent.glow}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full border ${accent.ring}`}
        >
          {renderToolIcon(tool.icon, 34)}
        </div>
        {tool.featured && <FeaturedBadge />}
      </div>

      <h2 className="mt-4 text-xl font-bold">{tool.title}</h2>
      <p className="mt-3 min-h-[5.75rem] text-sm leading-6 text-slate-300">
        {tool.description}
      </p>

      <ToolTags tool={tool} />
      <OpenToolLink slug={tool.slug} />
    </article>
  );
}

export default function ToolsIndex({ tools }: { tools: NetworkTool[] }) {
  const [search, setSearch] = useState("");
  const searchText = search.trim().toLowerCase();
  const filteredTools = tools.filter((tool) =>
    [tool.title, tool.description, tool.category, ...tool.tags]
      .join(" ")
      .toLowerCase()
      .includes(searchText)
  );

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <SiteNav active="tools" />

      <section className="mx-auto max-w-[96rem] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              All-in-One Network Tools
            </h1>
            <p className="mt-4 text-lg text-slate-300">
              Powerful tools to analyze, diagnose and optimize your network.
            </p>
          </div>

          <label className="relative w-full lg:w-[24rem]">
            <span className="sr-only">Search tools</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tools..."
              className="h-12 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-12 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
            />
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
          </label>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="mt-8 rounded-lg border border-slate-800 bg-slate-950/65 px-6 py-12 text-center">
            <p className="text-xl font-semibold">No tools found</p>
            <p className="mt-2 text-slate-400">
              Try searching for DNS, ping, port, IP, or website.
            </p>
          </div>
        )}

        <div className="mt-8 grid overflow-hidden rounded-lg border border-slate-800 bg-slate-950/65 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Accurate & Reliable",
              description: "Trusted checks and clear network diagnostics.",
              icon: ShieldPlus,
            },
            {
              title: "Fast & Efficient",
              description: "Get focused results without extra noise.",
              icon: Zap,
            },
            {
              title: "Private & Secure",
              description: "Designed for local troubleshooting workflows.",
              icon: Lock,
            },
            {
              title: "Detailed Reports",
              description: "Structure results into readable summaries.",
              icon: BarChart3,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="flex gap-4 border-slate-800 p-6 md:border-r md:last:border-r-0"
              >
                <Icon className="shrink-0 text-blue-400" size={42} />
                <div>
                  <h2 className="font-semibold text-blue-400">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function FeaturedBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-200">
      <Star size={13} />
      Featured
    </span>
  );
}

function ToolTags({ tool }: { tool: NetworkTool }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tool.tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function OpenToolLink({ slug }: { slug: string }) {
  return (
    <Link
      href={`/tools/${slug}`}
      className="mt-5 inline-flex w-full items-center justify-between rounded-lg border border-blue-500/70 px-4 py-3 text-blue-300 transition hover:bg-blue-500/10"
    >
      Open Tool
      <ChevronRight size={19} />
    </Link>
  );
}
