import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  BookOpen,
  ChevronRight,
  Clock,
  FileText,
  Gauge,
  Globe,
  Layers,
  Link as LinkIcon,
  Settings,
  ShieldPlus,
  Terminal,
  Wrench,
  Wifi,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";
import {
  getGuideCategories,
  getGuideCategoryBySlug,
  getGuidesByCategorySlug,
} from "@/data/guideCategories";
import { guides as defaultGuides } from "@/data/guides";
import { getPublishedGuides } from "@/lib/guidesStore";

type GuideCategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
};

const categoryIcons = {
  "Networking Basics": Globe,
  Connectivity: LinkIcon,
  Troubleshooting: Wrench,
  Security: ShieldPlus,
  Performance: Gauge,
  Configuration: Settings,
  Wireless: Wifi,
  Protocols: Layers,
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

export function generateStaticParams() {
  return getGuideCategories(defaultGuides).map((category) => ({
    category: category.slug,
  }));
}

export default async function GuideCategoryPage({
  params,
}: GuideCategoryPageProps) {
  const { category: categorySlug } = await params;

  await connection();

  const guides = await getPublishedGuides();
  const category = getGuideCategoryBySlug(categorySlug, guides);

  if (!category) {
    notFound();
  }

  const categoryGuides = getGuidesByCategorySlug(categorySlug, guides);
  const categories = getGuideCategories(guides);

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <SiteNav active="guides" />

      <div className="mx-auto grid max-w-[96rem] gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[20rem_1fr] lg:px-8">
        <aside className="hidden rounded-lg border border-slate-800 bg-slate-950/45 p-5 lg:block">
          <p className="px-2 text-sm font-semibold uppercase text-cyan-400">
            Guides
          </p>

          <Link
            href="/guides"
            className="mt-5 flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-900 hover:text-cyan-400"
          >
            <BookOpen size={18} />
            All Guides
          </Link>

          <p className="mt-8 px-2 text-sm font-medium uppercase text-slate-400">
            Categories
          </p>

          <div className="mt-4 space-y-2">
            {categories.map((item) => {
              const isActive = item.slug === category.slug;

              return (
                <Link
                  key={item.slug}
                  href={item.href}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-900 hover:text-cyan-400"
                  }`}
                >
                  {renderCategoryIcon(item.name, { size: 20 })}
                  {item.name}
                </Link>
              );
            })}
          </div>
        </aside>

        <section className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <Link href="/" className="hover:text-cyan-400">
              Home
            </Link>
            <ChevronRight size={15} />
            <Link href="/guides" className="hover:text-cyan-400">
              Guides
            </Link>
            <ChevronRight size={15} />
            <span>{category.name}</span>
          </div>

          <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950/65 p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blue-600/15 text-blue-400">
                {renderCategoryIcon(category.name, { size: 34 })}
              </div>

              <div className="min-w-0">
                <h1 className="text-3xl font-bold sm:text-5xl">
                  {category.name}
                </h1>
                <p className="mt-3 max-w-3xl text-slate-400">
                  {category.description}
                </p>

                <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-400">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-3 py-1">
                    <FileText size={16} />
                    {category.count} {category.count === 1 ? "guide" : "guides"}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-3 py-1 font-mono text-green-400">
                    <Terminal size={16} />
                    {category.command}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <h2 className="mt-8 text-xl font-semibold">
            {category.name} Guides
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {categoryGuides.map((guide) => (
              <article
                key={guide.slug}
                className="rounded-lg border border-slate-800 bg-slate-950/65 p-5 transition hover:-translate-y-1 hover:border-cyan-500"
              >
                <p className="text-sm font-medium text-cyan-400">
                  {guide.category}
                </p>
                <h3 className="mt-3 text-xl font-semibold">
                  <Link href={`/guides/${guide.slug}`} className="hover:text-cyan-400">
                    {guide.title}
                  </Link>
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {guide.description}
                </p>

                <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span className="rounded-full border border-slate-800 px-3 py-1">
                    {guide.difficulty}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-800 px-3 py-1">
                    <Clock size={14} />
                    {guide.readTime}
                  </span>
                </div>

                <Link
                  href={`/guides/${guide.slug}`}
                  className="mt-6 inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300"
                >
                  View Guide
                  <ChevronRight size={15} />
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
