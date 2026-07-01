"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BookOpen,
  Check,
  ChevronRight,
  FileText,
  Gauge,
  Globe,
  Laptop,
  Layers,
  Link as LinkIcon,
  Router,
  Search,
  Settings,
  ShieldPlus,
  Terminal,
  Wrench,
  Wifi,
} from "lucide-react";
import GuideAssistant from "@/components/GuideAssistant";
import SiteNav from "@/components/SiteNav";
import { getGuideCategories } from "@/data/guideCategories";
import type { Guide } from "@/data/guides";
import type { GuideAssistantSettings } from "@/data/tools";

const categoryIcons = {
  "Networking Basics": Globe,
  Connectivity: LinkIcon,
  Troubleshooting: Wrench,
  Security: ShieldPlus,
  Performance: Gauge,
  Configuration: Settings,
  Wireless: Wifi,
  Protocols: Layers,
  Monitoring: FileText,
};

function getCategoryIcon(categoryName: string) {
  return categoryIcons[categoryName as keyof typeof categoryIcons] ?? BookOpen;
}

function renderCategoryIcon(
  categoryName: string,
  props: { className?: string; size: number }
) {
  const Icon = getCategoryIcon(categoryName);

  return <Icon {...props} />;
}

export default function GuidesIndex({
  assistantSettings,
  guides,
}: {
  assistantSettings: GuideAssistantSettings;
  guides: Guide[];
}) {
  const [search, setSearch] = useState("");
  const guideCategories = getGuideCategories(guides);

  const visibleCategories = guideCategories.filter((category) => {
    const searchText = search.toLowerCase();

    return (
      category.name.toLowerCase().includes(searchText) ||
      category.description.toLowerCase().includes(searchText) ||
      category.command.toLowerCase().includes(searchText)
    );
  });

  const featuredGuide = guides[0];

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <SiteNav active="guides" />

      <div className="mx-auto grid max-w-[96rem] gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[20rem_1fr] lg:px-8">
        <aside className="hidden rounded-lg border border-slate-800 bg-slate-950/45 p-5 lg:block">
          <p className="px-2 text-sm font-semibold uppercase text-cyan-400">Guides</p>

          <Link
            href="/guides"
            className="mt-5 flex items-center gap-3 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium"
          >
            <BookOpen size={18} />
            All Guides
          </Link>

          <p className="mt-8 px-2 text-sm font-medium uppercase text-slate-400">
            Categories
          </p>

          <div className="mt-4 space-y-2">
            {guideCategories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-300 transition hover:bg-slate-900 hover:text-cyan-400"
              >
                {renderCategoryIcon(category.name, { size: 20 })}
                {category.name}
              </Link>
            ))}
          </div>

          <GuideAssistant
            guides={guides}
            settings={assistantSettings}
            className="mt-28"
          />
        </aside>

        <section className="min-w-0">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Link href="/" className="hover:text-cyan-400">
                  Home
                </Link>
                <ChevronRight size={15} />
                <span>Guides</span>
              </div>

              <h1 className="mt-5 text-4xl font-bold sm:text-5xl">Guides</h1>
              <p className="mt-3 max-w-4xl text-slate-400">
                Step-by-step guides and tutorials to help you master networking
                concepts and solve real-world problems.
              </p>
            </div>

            <label className="relative w-full xl:w-[24rem]">
              <span className="sr-only">Search guides</span>
              <input
                type="text"
                placeholder="Search guides..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3 pr-11 text-sm outline-none transition focus:border-cyan-500"
              />
              <Search
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
            </label>
          </div>

          <GuideAssistant
            guides={guides}
            settings={assistantSettings}
            className="mt-6 lg:hidden"
          />

          {featuredGuide && (
            <div className="mt-8 overflow-hidden rounded-lg border border-slate-800 bg-slate-950/60">
              <div className="relative grid min-h-[18rem] gap-6 p-5 sm:p-8 lg:grid-cols-[20rem_19rem_1fr] lg:gap-8">
                <div className="absolute inset-0 opacity-45">
                  <div className="h-full w-full bg-[radial-gradient(circle_at_70%_45%,rgba(14,165,233,0.35),transparent_34%),linear-gradient(90deg,rgba(2,8,23,0.9),rgba(2,8,23,0.35)),url('/images/network-hub.png')] bg-cover bg-center"></div>
                </div>

                <div className="relative z-10">
                  <p className="text-sm font-semibold uppercase text-cyan-400">
                    Featured Guide
                  </p>
                  <h2 className="mt-5 text-2xl font-bold leading-tight sm:text-3xl">
                    {featuredGuide.title}
                  </h2>
                  <p className="mt-5 text-slate-300">
                    {featuredGuide.description}
                  </p>

                  <Link
                    href={`/guides/${featuredGuide.slug}`}
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium transition hover:bg-blue-500"
                  >
                    View Guide
                    <ChevronRight size={16} />
                  </Link>
                </div>

                <div className="relative z-10 overflow-hidden rounded-lg border border-cyan-400/20 bg-slate-950/90 shadow-[0_20px_70px_rgba(0,0,0,0.6)]">
                  <div className="border-b border-slate-800 bg-slate-900 px-4 py-3">
                    <div className="flex gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
                      <span className="h-2.5 w-2.5 rounded-full bg-yellow-500"></span>
                      <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span>
                    </div>
                  </div>
                  <pre className="overflow-x-auto p-5 font-mono text-xs leading-5 text-green-400">{`> ping google.com

Pinging google.com [142.250.72.46]
Reply from 142.250.72.46: time=10ms
Reply from 142.250.72.46: time=10ms
Reply from 142.250.72.46: time=11ms

Packets: Sent = 4, Received = 4
Minimum = 10ms, Maximum = 11ms`}</pre>
                </div>

                <div className="relative z-10 hidden items-center justify-center gap-6 text-center text-sm text-slate-200 xl:flex">
                  <div>
                    <Laptop className="mx-auto text-blue-500" size={48} />
                    <div className="mx-auto mt-4 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-slate-950">
                      <Check size={15} />
                    </div>
                    <p className="mt-2">Host</p>
                  </div>
                  <div className="h-px w-12 border-t border-dashed border-cyan-500/70"></div>
                  <div>
                    <Router className="mx-auto text-blue-500" size={52} />
                    <div className="mx-auto mt-4 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-slate-950">
                      <Check size={15} />
                    </div>
                    <p className="mt-2">Router</p>
                  </div>
                  <div className="h-px w-12 border-t border-dashed border-cyan-500/70"></div>
                  <div>
                    <Globe className="mx-auto text-blue-500" size={54} />
                    <div className="mx-auto mt-4 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-slate-950">
                      <Check size={15} />
                    </div>
                    <p className="mt-2">Internet</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <h2 className="mt-8 text-xl font-semibold">Browse by Category</h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {visibleCategories.map((category) => {
              return (
                <article
                  key={category.name}
                  className="min-w-0 rounded-lg border border-slate-800 bg-slate-950/65 p-5 transition hover:-translate-y-1 hover:border-cyan-500"
                >
                  <div className="flex gap-5">
                    {renderCategoryIcon(category.name, {
                      className: "shrink-0 text-blue-500",
                      size: 44,
                    })}
                    <div>
                      <h3 className="text-lg font-semibold">{category.name}</h3>
                      <p className="mt-2 min-h-[3rem] text-sm text-slate-400">
                        {category.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 overflow-hidden text-ellipsis whitespace-nowrap rounded-md border border-slate-800 bg-slate-950 px-4 py-3 font-mono text-sm text-green-400">
                    <Terminal className="mr-2 inline text-green-400" size={14} />
                    {category.command}
                  </div>

                  <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <FileText size={17} />
                      {category.count} {category.count === 1 ? "guide" : "guides"}
                    </span>
                    <Link
                      href={category.href}
                      className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                    >
                      View Guides
                      <ChevronRight size={15} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
