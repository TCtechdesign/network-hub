import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import {
  Apple,
  ArrowLeft,
  ArrowRight,
  CircleDot,
  Globe2,
  Monitor,
  Terminal,
} from "lucide-react";
import CopyCommandButton from "@/components/CopyCommandButton";
import SiteNav from "@/components/SiteNav";
import {
  commands as defaultCommands,
  type CommandDifficulty,
  type CommandReference,
  type CommandRelatedLink,
} from "@/data/commands";
import { getPublishedCommands } from "@/lib/commandsStore";

type CommandDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return defaultCommands.map((command) => ({
    slug: command.slug,
  }));
}

export default async function CommandDetailPage({
  params,
}: CommandDetailPageProps) {
  const { slug } = await params;

  await connection();

  if (slug === "arpa") {
    redirect("/commands/arp");
  }

  const commands = await getPublishedCommands();
  const command = commands.find((item) => item.slug === slug);

  if (!command) {
    notFound();
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#020817] bg-[radial-gradient(circle_at_18%_18%,rgba(14,165,233,0.18),transparent_30%),radial-gradient(circle_at_76%_38%,rgba(37,99,235,0.14),transparent_34%)] text-white">
      <SiteNav active="commands" />

      <section className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="relative z-10">
          <Link
            href="/commands"
            className="inline-flex items-center gap-2 text-base font-semibold text-cyan-400 transition hover:text-cyan-300"
          >
            <ArrowLeft size={20} />
            Back to commands
          </Link>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem] xl:gap-8">
            <article className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-base font-semibold text-slate-500">
                  {command.category}
                </p>
                <DifficultyBadge difficulty={command.difficulty} />
              </div>
              <h1 className="mt-3 break-words text-4xl font-bold leading-none tracking-tight text-cyan-400 sm:text-5xl">
                {command.name}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-7 text-slate-300">
                {command.description}
              </p>

              <section className="mt-8 rounded-xl border border-slate-800 bg-slate-950/55 p-5 shadow-[0_0_55px_rgba(14,165,233,0.08)]">
                <h2 className="text-xl font-bold text-white">Explanation</h2>
                <p className="mt-4 text-base leading-8 text-slate-300">
                  {command.explanation}
                </p>
              </section>

              <div className="mt-5 space-y-5">
                <CommandCodeCard label="Syntax" text={command.syntax} />

                {command.examples.map((example) => (
                  <CommandCodeCard
                    key={example.id}
                    label={example.label}
                    text={example.command}
                    notes={example.notes}
                  />
                ))}
              </div>

              {(command.relatedGuides.length > 0 ||
                command.relatedTools.length > 0) && (
                <section className="mt-6 grid gap-4 md:grid-cols-2">
                  <RelatedLinksCard
                    title="Related Guides"
                    links={command.relatedGuides}
                  />
                  <RelatedLinksCard
                    title="Related Tools"
                    links={command.relatedTools}
                  />
                </section>
              )}
            </article>

            <aside className="rounded-xl border border-cyan-500/30 bg-slate-950/55 p-5 shadow-[0_0_70px_rgba(14,165,233,0.1)] sm:p-6 xl:mt-8">
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-cyan-400 text-cyan-300">
                  <CircleDot size={24} />
                </span>
                <h2 className="text-xl font-bold text-white">Use Cases</h2>
              </div>

              <ul className="mt-6 space-y-5">
                {command.useCases.map((useCase, index) => (
                  <li key={useCase} className="grid grid-cols-[1.25rem_1fr] gap-4">
                    <span className="relative flex justify-center pt-1">
                      {index < command.useCases.length - 1 ? (
                        <span className="absolute top-0 h-[calc(100%+1.5rem)] border-l border-dashed border-cyan-400" />
                      ) : null}
                      <span className="relative z-10 mt-1 h-4 w-4 rounded-full border-2 border-cyan-400 bg-[#020817]" />
                    </span>
                    <span className="text-base leading-7 text-slate-300">
                      {useCase}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="my-8 h-px bg-slate-700/70" />

              <div className="flex items-center gap-4">
                <Globe2 className="h-10 w-10 text-cyan-300" />
                <h2 className="text-xl font-bold text-white">Platforms</h2>
              </div>

              <PlatformsList command={command} />
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: CommandDifficulty }) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-semibold ${getDifficultyTextClass(
        difficulty
      )}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${getDifficultyDotClass(difficulty)}`}
        aria-hidden="true"
      />
      {difficulty}
    </span>
  );
}

function getDifficultyTextClass(difficulty: CommandDifficulty) {
  if (difficulty === "Beginner") {
    return "text-emerald-300";
  }

  if (difficulty === "Intermediate") {
    return "text-amber-300";
  }

  return "text-red-300";
}

function getDifficultyDotClass(difficulty: CommandDifficulty) {
  if (difficulty === "Beginner") {
    return "bg-emerald-400";
  }

  if (difficulty === "Intermediate") {
    return "bg-amber-300";
  }

  return "bg-red-400";
}

function CommandCodeCard({
  label,
  notes,
  text,
}: {
  label: string;
  notes?: string;
  text: string;
}) {
  const copyButtonPosition = text.includes("\n")
    ? "top-4"
    : "top-1/2 -translate-y-1/2";

  return (
    <section className="rounded-xl border border-cyan-500/25 bg-slate-950/55 p-4 shadow-[0_0_55px_rgba(14,165,233,0.08)] sm:p-5">
      <h2 className="text-xl font-bold text-white">{label}</h2>

      <div className="relative mt-4 rounded-lg border border-slate-700/80 bg-[#020817]/95 p-4 pr-16">
        <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm leading-6 text-green-400 sm:text-base">
          {text}
        </pre>
        <CopyCommandButton
          text={text}
          showLabel={false}
          className={`absolute right-4 ${copyButtonPosition} border-cyan-500/50 bg-slate-950/80 text-cyan-300 hover:bg-cyan-500/10`}
        />
      </div>

      {notes && <p className="mt-3 text-sm leading-6 text-slate-400">{notes}</p>}
    </section>
  );
}

function PlatformsList({ command }: { command: CommandReference }) {
  return (
    <div className="mt-5 space-y-3">
      {command.platforms.map((platform) => (
        <span
          key={platform}
          className="flex w-full max-w-48 items-center gap-3 rounded-full border border-cyan-500/45 bg-cyan-500/10 px-5 py-2.5 text-base font-semibold text-cyan-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_28px_rgba(14,165,233,0.08)]"
        >
          {renderPlatformIcon(platform)}
          {platform}
        </span>
      ))}
    </div>
  );
}

function RelatedLinksCard({
  links,
  title,
}: {
  links: CommandRelatedLink[];
  title: string;
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/55 p-5">
      <h2 className="text-lg font-bold text-white">{title}</h2>

      {links.length > 0 ? (
        <div className="mt-4 space-y-2">
          {links.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className="flex items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm font-semibold text-blue-300 transition hover:border-cyan-500/70 hover:text-cyan-200"
            >
              <span>{link.title}</span>
              <ArrowRight className="shrink-0" size={16} />
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-slate-400">
          No related links yet.
        </p>
      )}
    </section>
  );
}

function renderPlatformIcon(platform: string) {
  const normalizedPlatform = platform.toLowerCase();
  const iconClassName = "h-6 w-6 shrink-0";

  if (normalizedPlatform === "windows") {
    return <Monitor className={iconClassName} />;
  }

  if (normalizedPlatform === "macos") {
    return <Apple className={iconClassName} />;
  }

  return <Terminal className={iconClassName} />;
}
