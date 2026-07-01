import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  ClipboardList,
  Play,
  Terminal,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";
import { getToolBySlug, tools } from "@/data/tools";
import { getPublishedTools } from "@/lib/toolsStore";

export function generateStaticParams() {
  return tools
    .filter(
      (tool) =>
        ![
          "ip-address-lookup",
          "public-ip-lookup",
          "dns-lookup",
          "mac-address-lookup",
          "port-checker",
          "internet-speed-test",
          "traffic-analyzer",
          "ping-test-analyzer",
          "port-forward-wizard",
          "website-bug-checker",
        ].includes(tool.slug)
    )
    .map((tool) => ({
      slug: tool.slug,
    }));
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  await connection();

  const publishedTools = await getPublishedTools();
  const tool = getToolBySlug(slug, publishedTools);

  if (!tool) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <SiteNav active="tools" />

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
          <Link href="/" className="hover:text-cyan-400">
            Home
          </Link>
          <ChevronRight size={15} />
          <Link href="/tools" className="hover:text-cyan-400">
            Tools
          </Link>
          <ChevronRight size={15} />
          <span>{tool.title}</span>
        </div>

        <Link
          href="/tools"
          className="mt-8 inline-flex items-center gap-2 text-sm text-cyan-300 transition hover:text-cyan-200"
        >
          <ArrowLeft size={17} />
          Back to tools
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <article className="rounded-lg border border-slate-800 bg-slate-950/65 p-6 sm:p-8">
            <span className="text-sm font-semibold uppercase text-cyan-400">
              {tool.category}
            </span>
            <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
              {tool.title}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
              {tool.description}
            </p>

            <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900/55 p-5">
              <label className="block text-sm font-medium text-slate-300">
                Input
              </label>
              <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
                <input
                  type="text"
                  placeholder={tool.placeholder}
                  defaultValue={tool.example}
                  className="h-12 rounded-lg border border-slate-800 bg-slate-950 px-4 text-sm text-slate-200 outline-none focus:border-cyan-500"
                />
                <button className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                  <Play size={17} />
                  Run Check
                </button>
              </div>
            </div>

            <div className="mt-8 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-5">
              <div className="flex items-center gap-3">
                <Terminal className="text-cyan-300" size={22} />
                <h2 className="text-lg font-semibold">Result Preview</h2>
              </div>
              <pre className="mt-4 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-sm leading-6 text-green-400">{`> ${tool.title}
status: ready for interface
input: ${tool.example}
next: connect live data source`}</pre>
            </div>
          </article>

          <aside className="space-y-5">
            <div className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
              <div className="flex items-center gap-3">
                <ClipboardList className="text-cyan-300" size={22} />
                <h2 className="text-sm font-semibold uppercase text-slate-400">
                  Checks Included
                </h2>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-300">
                {tool.features.map((feature) => (
                  <p key={feature} className="flex gap-3">
                    <Check
                      className="mt-0.5 shrink-0 text-green-400"
                      size={17}
                    />
                    <span>{feature}</span>
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
              <h2 className="text-sm font-semibold uppercase text-slate-400">
                Tags
              </h2>
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
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
