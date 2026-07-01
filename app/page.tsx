import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import CopyCommandButton from "@/components/CopyCommandButton";
import SiteNav from "@/components/SiteNav";
import Terminal from "@/components/Terminal";
import type { HomepageCardIcon } from "@/data/homepage";
import { getPublishedHomepageContent } from "@/lib/homepageStore";
import {
  ArrowRight,
  BookOpen,
  ClipboardCopy,
  Globe,
  Network,
  Wifi,
  Activity,
  Search,
  Server,
  Shapes,
  Terminal as TerminalIcon,
  UserCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<HomepageCardIcon, LucideIcon> = {
  activity: Activity,
  "book-open": BookOpen,
  "clipboard-copy": ClipboardCopy,
  globe: Globe,
  network: Network,
  search: Search,
  server: Server,
  shapes: Shapes,
  terminal: TerminalIcon,
  "user-check": UserCheck,
  wifi: Wifi,
};

function getHomepageIcon(icon: HomepageCardIcon) {
  return iconMap[icon] ?? Network;
}

export default async function Home() {
  await connection();

  const content = await getPublishedHomepageContent();

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <SiteNav active="home" />

      {/* HERO */}
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-2 lg:py-24">
        <div>
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-400">
            {content.hero.eyebrow}
          </span>

          <h2 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl">
            {content.hero.title}
            <span className="block text-cyan-400">
              {content.hero.highlightedTitle}
            </span>
          </h2>

          <p className="mt-6 max-w-xl text-lg text-slate-400">
            {content.hero.intro}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href={content.hero.primaryCtaHref}
              className="rounded-lg bg-cyan-500 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-400"
            >
              {content.hero.primaryCtaLabel}
            </Link>

            <Link
              href={content.hero.secondaryCtaHref}
              className="rounded-lg border border-slate-700 px-6 py-3 transition hover:border-cyan-500"
            >
              {content.hero.secondaryCtaLabel}
            </Link>
          </div>
        </div>

        {/* TERMINAL */}
        <div className="relative flex min-h-[22rem] items-center justify-center overflow-hidden sm:min-h-[27rem] lg:justify-end">
          <div className="absolute h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl sm:h-96 sm:w-96"></div>

          <div className="absolute inset-y-0 -left-12 -right-8 z-0 opacity-90">
            <Image
              src="/images/network-hub.png"
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="pointer-events-none select-none object-contain object-right"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/10 to-slate-950/20"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-transparent to-slate-950/60"></div>
          </div>

          <div className="relative z-10 mt-6 w-full max-w-[27rem] overflow-hidden rounded-xl border border-cyan-400/20 bg-slate-950/90 shadow-[0_24px_80px_rgba(0,0,0,0.65),0_0_45px_rgba(6,182,212,0.18)] backdrop-blur-md sm:mr-8 lg:mr-14">
            <div className="border-b border-cyan-400/10 bg-slate-950/75 px-4 py-3">
              <div className="flex gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
              </div>
            </div>

            <div className="min-h-[15rem] p-5">
              <Terminal />
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ACCESS */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <h3 className="mb-8 text-2xl font-bold sm:text-3xl">
          {content.featuredGuidesTitle}
        </h3>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {content.featuredGuides.map((item) => {
            const Icon = getHomepageIcon(item.icon);

            return (
              <Link
                key={item.id}
                href={item.href}
                className="group rounded-xl border border-slate-800 bg-slate-900 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Icon size={24} />
                </div>

                <h4 className="text-xl font-semibold">
                  {item.title}
                </h4>

                <p className="mt-2 text-slate-400">
                  {item.description}
                </p>

                <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-cyan-400 transition group-hover:text-cyan-300">
                  {item.actionLabel}
                  <ArrowRight size={15} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* TOOL IDEAS */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-sm font-semibold uppercase text-cyan-400">
              {content.featuredToolsEyebrow}
            </span>
            <h3 className="mt-2 text-2xl font-bold sm:text-3xl">
              {content.featuredToolsTitle}
            </h3>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {content.featuredTools.map((tool) => {
            const Icon = getHomepageIcon(tool.icon);

            return (
              <Link
                key={tool.id}
                href={tool.href}
                className="group rounded-lg border border-slate-800 bg-slate-900/70 p-5 transition hover:border-cyan-500 hover:bg-slate-900"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Icon size={22} />
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-semibold text-white">{tool.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {tool.description}
                    </p>
                  </div>
                </div>

                <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-400 transition group-hover:text-cyan-300">
                  {tool.actionLabel}
                  <ArrowRight size={15} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* POPULAR COMMANDS */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <h3 className="mb-8 text-2xl font-bold sm:text-3xl">
          {content.popularCommandsTitle}
        </h3>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {content.popularCommands.map((command) => (
            <div
              key={command.id}
              className="rounded-xl border border-slate-800 bg-slate-900 p-6"
            >
              <h4 className="text-2xl font-bold text-cyan-400">
                {command.name}
              </h4>

              <p className="mt-3 text-slate-400">
                {command.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={command.href}
                  className="inline-flex min-w-[5.25rem] items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400"
                  aria-label={`View ${command.name} details`}
                >
                  View
                  <ArrowRight size={16} />
                </Link>

                <CopyCommandButton text={command.copyText} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WHY USE NETWORK HUB */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <h3 className="text-2xl font-bold sm:text-3xl">
          {content.recommendedCardsTitle}
        </h3>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {content.recommendedCards.map((item) => {
            const Icon = getHomepageIcon(item.icon);

            return (
              <div key={item.id} className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-cyan-500/15 bg-slate-900 text-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.12)]">
                  <Icon size={28} />
                </div>

                <div className="min-w-0">
                  <h4 className="text-lg font-semibold text-white">
                    {item.title}
                  </h4>
                  <p className="mt-2 max-w-[14rem] text-sm leading-6 text-slate-400">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 overflow-hidden rounded-xl border border-cyan-500/25 bg-slate-900/60 shadow-[0_0_45px_rgba(6,182,212,0.08)]">
          <div className="grid items-center gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,36rem)] xl:grid-cols-[minmax(0,1fr)_42rem]">
            <div>
              <h4 className="text-2xl font-bold sm:text-3xl">
                {content.recommendedCta.title}
              </h4>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                {content.recommendedCta.description}
              </p>
            </div>

            <div className="flex min-w-0 flex-col items-stretch gap-5 md:flex-row md:items-center lg:justify-end">
              <Link
                href={content.recommendedCta.ctaHref}
                className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-500 md:w-auto md:min-w-[11rem]"
              >
                {content.recommendedCta.ctaLabel}
                <ArrowRight size={17} />
              </Link>

              <div className="relative mx-auto aspect-[3/2] w-full max-w-[19rem] overflow-hidden md:mx-0 md:max-w-[22rem] lg:max-w-[26rem] xl:max-w-[30rem]">
                <Image
                  src={content.recommendedCta.imageSrc}
                  alt={content.recommendedCta.imageAlt}
                  fill
                  sizes="(min-width: 1280px) 30rem, (min-width: 1024px) 26rem, (min-width: 768px) 22rem, 100vw"
                  className="object-contain object-center lg:object-right"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
