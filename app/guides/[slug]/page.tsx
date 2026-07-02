import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  BookOpen,
  ChevronRight,
  HelpCircle,
  Info,
  Network,
  Search,
} from "lucide-react";
import GuideAssistant from "@/components/GuideAssistant";
import GuideChecklistItem from "@/components/GuideChecklistItem";
import GuideFeedback from "@/components/GuideFeedback";
import SiteNav from "@/components/SiteNav";
import { getGuideCategories } from "@/data/guideCategories";
import { guides as defaultGuides, type Guide } from "@/data/guides";
import { getPublishedGuides } from "@/lib/guidesStore";
import { getPublishedGuideAssistantSettings } from "@/lib/toolsStore";

type GuideSection = {
  id: string;
  title: string;
  lines: string[];
};

type InlineGuideImage = {
  src: string;
  alt: string;
  caption?: string;
  layout?: "default" | "large" | "portrait";
};

const codeBlockPrefix = "__GUIDE_CODE_BLOCK__";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseInlineImage(line: string): InlineGuideImage | null {
  const match = line.match(/^\[image:(.+)\]$/);

  if (!match) {
    return null;
  }

  const [src, alt, caption, layout] = match[1]
    .split("|")
    .map((part) => part.trim());

  if (!src) {
    return null;
  }

  return {
    src,
    alt: alt || "",
    caption: caption || undefined,
    layout:
      layout === "large" || layout === "portrait" ? layout : "default",
  };
}

function isInlineImageLine(line: string) {
  return parseInlineImage(line) !== null;
}

function isSectionHeadingLine(lines: string[], index: number) {
  const line = lines[index].trim();
  const previousLine = lines[index - 1]?.trim() ?? "";
  const nextLine = lines[index + 1]?.trim() ?? "";
  const nextContentLine =
    lines
      .slice(index + 1)
      .find((item) => item.trim())
      ?.trim() ?? "";

  if (!line || !nextContentLine || isInlineImageLine(line)) {
    return false;
  }

  if (
    line.startsWith("•") ||
    line.startsWith("☐") ||
    line.endsWith(":") ||
    line.startsWith("http") ||
    line.includes("|") ||
    /^\d+\./.test(line) ||
    isCommandLine(line)
  ) {
    return false;
  }

  const hasSectionSpacing = index === 0 || previousLine === "";
  const hasBodyAfterHeading = nextLine === "";
  const endsLikeSentence = /[.!]$/.test(line);

  return hasSectionSpacing && hasBodyAfterHeading && !endsLikeSentence;
}

function parseGuideContent(content: string): GuideSection[] {
  const lines = content
    .trim()
    .split("\n");

  const sections: GuideSection[] = [];
  let currentSection: GuideSection | null = null;
  let codeBlockLines: string[] = [];
  let codeBlockLanguage = "";

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith("```")) {
      if (codeBlockLines.length > 0 || codeBlockLanguage) {
        currentSection?.lines.push(
          `${codeBlockPrefix}:${codeBlockLanguage}\n${codeBlockLines.join("\n")}`
        );
        codeBlockLines = [];
        codeBlockLanguage = "";
        return;
      }

      codeBlockLanguage = trimmedLine.replace(/^```/, "").trim() || "text";
      return;
    }

    if (codeBlockLanguage) {
      codeBlockLines.push(line.replace(/\s+$/, ""));
      return;
    }

    if (!trimmedLine) {
      return;
    }

    if (isSectionHeadingLine(lines, index)) {
      currentSection = {
        id: slugify(trimmedLine),
        title: trimmedLine,
        lines: [],
      };
      sections.push(currentSection);
      return;
    }

    if (!currentSection) {
      currentSection = {
        id: slugify(trimmedLine),
        title: trimmedLine,
        lines: [],
      };
      sections.push(currentSection);
      return;
    }

    currentSection.lines.push(trimmedLine);
  });

  const lastSection = sections[sections.length - 1];

  if (codeBlockLanguage && lastSection) {
    lastSection.lines.push(
      `${codeBlockPrefix}:${codeBlockLanguage}\n${codeBlockLines.join("\n")}`
    );
  }

  if (sections.length === 0) {
    return [
      {
        id: "guide",
        title: "Guide",
        lines: [],
      },
    ];
  }

  return sections;
}

function getRelatedGuides(currentGuide: Guide, guides: Guide[]) {
  const relatedGuides = guides.filter(
    (guide) =>
      guide.category === currentGuide.category &&
      guide.slug !== currentGuide.slug
  );

  if (relatedGuides.length > 0) {
    return relatedGuides;
  }

  return guides.filter((guide) => guide.slug !== currentGuide.slug);
}

function isCommandLine(line: string) {
  const commandPrefixes = [
    "arp",
    "cat",
    "ifconfig",
    "ipconfig",
    "iperf3",
    "iwconfig",
    "netstat",
    "networksetup",
    "nmap",
    "nslookup",
    "ping",
    "scutil",
    "sudo",
    "tcpdump",
    "tracert",
    "traceroute",
  ];

  return commandPrefixes.some(
    (prefix) => line === prefix || line.startsWith(`${prefix} `)
  );
}

function renderGuideLine(line: string, key: string, storageKey: string) {
  if (line.startsWith(codeBlockPrefix)) {
    const code = line.replace(new RegExp(`^${codeBlockPrefix}:[^\\n]*\\n?`), "");

    return (
      <pre
        key={key}
        className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/70 p-4 font-mono text-sm leading-6 text-green-400"
      >
        {code}
      </pre>
    );
  }

  const inlineImage = parseInlineImage(line);

  if (inlineImage) {
    const imageFrameClass =
      inlineImage.layout === "portrait"
        ? "relative aspect-[2/3] min-h-[32rem] bg-slate-950 sm:min-h-[42rem]"
        : inlineImage.layout === "large"
          ? "relative aspect-[4/3] min-h-[24rem] bg-slate-950 sm:min-h-[34rem]"
          : "relative aspect-[16/9] min-h-[12rem] bg-slate-950";

    return (
      <figure
        key={key}
        className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/45"
      >
        <div className={imageFrameClass}>
          <Image
            src={inlineImage.src}
            alt={inlineImage.alt}
            fill
            sizes="(min-width: 1280px) 44rem, (min-width: 1024px) calc(100vw - 43rem), 100vw"
            className="object-contain"
          />
        </div>

        {inlineImage.caption && (
          <figcaption className="border-t border-slate-800 px-4 py-3 text-sm text-slate-400">
            {inlineImage.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  if (isCommandLine(line)) {
    return (
      <pre
        key={key}
        className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/70 p-4 font-mono text-sm text-green-400"
      >
        {line}
      </pre>
    );
  }

  if (line.startsWith("•")) {
    return (
      <p key={key} className="flex gap-3">
        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"></span>
        <span>{line.replace(/^•\s*/, "")}</span>
      </p>
    );
  }

  if (line.startsWith("☐")) {
    return (
      <GuideChecklistItem
        key={key}
        label={line.replace(/^☐\s*/, "")}
        storageKey={storageKey}
      />
    );
  }

  if (line.endsWith(":")) {
    return (
      <p key={key} className="pt-2 font-semibold text-slate-100">
        {line}
      </p>
    );
  }

  return (
    <p key={key} className="leading-7">
      {line}
    </p>
  );
}

export function generateStaticParams() {
  return defaultGuides.map((guide) => ({
    slug: guide.slug,
  }));
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connection();

  const [guides, assistantSettings] = await Promise.all([
    getPublishedGuides(),
    getPublishedGuideAssistantSettings(),
  ]);
  const guide = guides.find((item) => item.slug === slug);

  if (!guide) {
    notFound();
  }

  const sections = parseGuideContent(guide.content);
  const guideCategories = getGuideCategories(guides);
  const relatedGuides = getRelatedGuides(guide, guides);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <SiteNav active="guides" />

      <div className="mx-auto grid max-w-[96rem] gap-8 px-4 py-6 sm:px-6 md:py-8 lg:grid-cols-[18rem_minmax(0,1fr)_20rem]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="text-sm font-semibold uppercase text-slate-400">Guides</p>

            <label className="relative mt-4 block">
              <span className="sr-only">Search guides</span>
              <input
                type="text"
                placeholder="Search guides..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3 pr-10 text-sm outline-none focus:border-cyan-500"
              />
              <Search
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
            </label>

            <div className="mt-5 space-y-3">
              {guideCategories.map((category) => {
                const isCurrentCategory = category.name === guide.category;

                return (
                  <details
                    key={category.slug}
                    open={isCurrentCategory}
                    className="group rounded-lg border border-slate-800 bg-slate-900/45 p-2"
                  >
                    <summary
                      className={`flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-3 text-sm font-medium transition [&::-webkit-details-marker]:hidden ${
                        isCurrentCategory
                          ? "text-cyan-400"
                          : "text-slate-300 hover:bg-slate-900 hover:text-cyan-400"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Network size={18} />
                        <span className="truncate">{category.name}</span>
                      </span>
                      <ChevronRight
                        className="shrink-0 transition group-open:rotate-90"
                        size={16}
                      />
                    </summary>

                    <div className="mt-2 space-y-1">
                      {category.guides.map((item) => (
                        <Link
                          key={item.slug}
                          href={`/guides/${item.slug}`}
                          className={`block rounded-lg px-4 py-3 text-sm transition ${
                            item.slug === guide.slug
                              ? "bg-blue-600/35 text-white"
                              : "text-slate-400 hover:bg-slate-900 hover:text-cyan-400"
                          }`}
                        >
                          {item.title}
                        </Link>
                      ))}
                    </div>
                  </details>
                );
              })}
            </div>

            <GuideAssistant
              guides={guides}
              currentGuideSlug={guide.slug}
              settings={assistantSettings}
              className="mt-6"
            />
          </div>
        </aside>

        <article className="min-w-0">
          
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <Link href="/" className="hover:text-cyan-400">
              Home
            </Link>
            <ChevronRight size={15} />
            <Link href="/guides" className="hover:text-cyan-400">
              Guides
            </Link>
            <ChevronRight size={15} />
            <span>{guide.category}</span>
            <ChevronRight size={15} />
            <span>{guide.title}</span>
          </div>

          <h1 className="mt-6 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
            {guide.title}
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            {guide.description}
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-400">
            <span className="rounded-full border border-slate-800 px-3 py-1">
              {guide.difficulty}
            </span>
            <span className="rounded-full border border-slate-800 px-3 py-1">
              {guide.readTime}
            </span>
          </div>

          <GuideAssistant
            guides={guides}
            currentGuideSlug={guide.slug}
            settings={assistantSettings}
            className="mt-6 lg:hidden"
          />

          {guide.image && (
            <figure className="mt-8 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/45">
              <div className="relative aspect-[16/9] min-h-[13rem] bg-slate-950">
                <Image
                  src={guide.image.src}
                  alt={guide.image.alt}
                  fill
                  sizes="(min-width: 1280px) 44rem, (min-width: 1024px) calc(100vw - 43rem), 100vw"
                  loading="eager"
                  className="object-contain"
                />
              </div>

              {guide.image.caption && (
                <figcaption className="border-t border-slate-800 px-4 py-3 text-sm text-slate-400">
                  {guide.image.caption}
                </figcaption>
              )}
            </figure>
          )}

          <div className="mt-8 space-y-4 lg:hidden">
            <div className="rounded-lg border border-slate-800 bg-slate-900/45 p-4">
              <h2 className="text-sm font-semibold uppercase text-slate-400">
                On This Page
              </h2>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="shrink-0 rounded-full border border-slate-800 px-3 py-2 text-sm text-cyan-400"
                  >
                    {section.title}
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/45 p-4">
              <h2 className="text-sm font-semibold uppercase text-slate-400">
                Related {guide.category} Guides
              </h2>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {relatedGuides.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/guides/${item.slug}`}
                    className="shrink-0 rounded-full border border-slate-800 px-3 py-2 text-sm text-blue-400"
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="my-8 h-px bg-slate-800 md:my-10" />

          <div className="space-y-10">
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className="scroll-mt-28">
                <h2 className="flex items-center gap-3 text-2xl font-semibold">
                  <span className="flex h-7 w-7 items-center justify-center rounded border border-cyan-500/60 text-cyan-400">
                    {index === 0 ? <Info size={17} /> : <BookOpen size={17} />}
                  </span>
                  {section.title}
                </h2>

                <div className="mt-4 space-y-3 text-slate-300">
                  {section.lines.map((line, lineIndex) =>
                    renderGuideLine(
                      line,
                      `${section.id}-${lineIndex}`,
                      `guide-checklist:${guide.slug}:${section.id}:${lineIndex}`
                    )
                  )}
                </div>

                {index === 0 && (
                  <div className="mt-6 rounded-lg border border-blue-500/60 bg-blue-500/10 p-5">
                    <div className="flex gap-4">
                      <HelpCircle className="mt-1 shrink-0 text-blue-400" size={20} />
                      <div>
                        <h3 className="font-medium text-blue-300">Example</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          Use this section as your baseline before working
                          through the symptoms, commands, and fixes below.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            ))}
          </div>

          <GuideFeedback guideSlug={guide.slug} className="mt-10 xl:hidden" />
        </article>

        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-5">
            <div className="rounded-lg border border-slate-800 bg-slate-900/45 p-5">
              <h2 className="text-sm font-semibold uppercase text-slate-400">
                On This Page
              </h2>
              <div className="mt-4 space-y-1">
                {sections.map((section, index) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className={`block border-l px-3 py-2 text-sm transition hover:text-cyan-400 ${
                      index === 0
                        ? "border-cyan-500 text-cyan-400"
                        : "border-slate-800 text-slate-400"
                    }`}
                  >
                    {section.title}
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/45 p-5">
              <h2 className="text-sm font-semibold uppercase text-slate-400">
                Related {guide.category} Guides
              </h2>
              <div className="mt-4 divide-y divide-slate-800">
                {relatedGuides.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/guides/${item.slug}`}
                    className="block py-3 text-sm text-blue-400 hover:text-cyan-300"
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>

            <GuideFeedback guideSlug={guide.slug} />
          </div>
        </aside>
      </div>
    </main>
  );
}
