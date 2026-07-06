"use client";

import Link from "next/link";
import {
  ChevronRight,
  FileText,
  Filter,
  Globe2,
  Lightbulb,
  Network,
  Search,
  Server,
  Terminal,
} from "lucide-react";
import { useMemo, useState } from "react";
import CopyCommandButton from "@/components/CopyCommandButton";
import SiteNav from "@/components/SiteNav";
import {
  commandDifficultyOptions,
  type CommandDifficulty,
  type CommandReference,
} from "@/data/commands";

type CategoryItem = {
  name: string;
  count: number;
};

type IconComponent = typeof Terminal;

const allCommandsLabel = "All Commands";
const crossPlatformLabel = "Cross-Platform";
const allPlatformsLabel = "All Platforms";
const allCategoriesLabel = "All Categories";
const allDifficultiesLabel = "All Levels";

const categoryOrder = [
  "Connectivity",
  "DNS",
  "DHCP",
  "Routing",
  "Layer 2",
  "Connections",
  "Configuration",
];

const categoryIcons: Record<string, IconComponent> = {
  [allCommandsLabel]: Terminal,
  [crossPlatformLabel]: Globe2,
  Connectivity: Network,
  DNS: Globe2,
  DHCP: Server,
  Routing: Network,
  "Layer 2": Server,
  Connections: Terminal,
  Configuration: FileText,
};

export default function CommandsIndex({
  commands,
}: {
  commands: CommandReference[];
}) {
  const [search, setSearch] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState(allPlatformsLabel);
  const [selectedCategory, setSelectedCategory] = useState(allCommandsLabel);
  const [selectedDifficulty, setSelectedDifficulty] = useState(
    allDifficultiesLabel
  );
  const categories = useMemo(() => getCommandCategories(commands), [commands]);
  const platformOptions = useMemo(
    () => [
      allPlatformsLabel,
      ...Array.from(
        new Set(commands.flatMap((command) => command.platforms))
      ).sort((a, b) => a.localeCompare(b)),
    ],
    [commands]
  );
  const categoryFilterOptions = categories.filter(
    (category) => category.name !== crossPlatformLabel
  );
  const searchText = search.trim().toLowerCase();
  const filteredCommands = commands.filter((command) => {
    const searchableText = [
      command.name,
      command.description,
      command.category,
      command.difficulty,
      command.explanation,
      ...command.platforms,
    ]
      .join(" ")
      .toLowerCase();

    return (
      searchableText.includes(searchText) &&
      commandMatchesPlatform(command, selectedPlatform) &&
      commandMatchesCategory(command, selectedCategory) &&
      commandMatchesDifficulty(command, selectedDifficulty)
    );
  });

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <SiteNav active="commands" />

      <div className="mx-auto grid max-w-[96rem] gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[19rem_minmax(0,1fr)] lg:px-8">
        <aside className="hidden border-slate-800 lg:block lg:border-r lg:pr-8">
          <div className="sticky top-24">
            <p className="px-2 text-sm font-semibold uppercase text-slate-400">
              Command Categories
            </p>

            <div className="mt-5 space-y-1">
              {categories.map((category) => {
                const Icon = getCategoryIcon(category.name);
                const isActive = selectedCategory === category.name;

                return (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => setSelectedCategory(category.name)}
                    className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm transition ${
                      isActive
                        ? "border border-cyan-500/20 bg-cyan-500/15 text-cyan-300"
                        : "text-slate-300 hover:bg-slate-900/80 hover:text-cyan-300"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon className="shrink-0" size={18} />
                      <span className="truncate">{category.name}</span>
                    </span>
                    <span className="ml-3 shrink-0 text-xs text-slate-400">
                      {category.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-10 rounded-lg border border-cyan-500/70 bg-slate-950/75 p-5 shadow-[0_0_40px_rgba(6,182,212,0.08)]">
              <div className="flex items-center gap-3 text-sm font-semibold uppercase text-yellow-300">
                <Lightbulb size={18} />
                Quick Tip
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Use these commands to check connectivity, DNS, DHCP, routing,
                and active network sessions during troubleshooting.
              </p>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <div>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              Commands Library
            </h1>
            <p className="mt-4 max-w-3xl text-lg text-slate-300">
              Browse, search, copy, and open common network troubleshooting
              commands.
            </p>
          </div>

          <div className="mt-8 lg:hidden">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => {
                const isActive = selectedCategory === category.name;

                return (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => setSelectedCategory(category.name)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
                      isActive
                        ? "border-cyan-500 bg-cyan-500/15 text-cyan-300"
                        : "border-slate-800 text-slate-300"
                    }`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1fr)_12rem_13rem_13rem]">
            <label className="relative block">
              <span className="sr-only">Search commands</span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search commands, categories, or platforms..."
                className="h-12 w-full rounded-lg border border-slate-800 bg-slate-950/70 px-11 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
              />
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
            </label>

            <label className="relative block">
              <span className="sr-only">Filter by difficulty</span>
              <select
                aria-label="Filter by difficulty"
                value={selectedDifficulty}
                onChange={(event) => setSelectedDifficulty(event.target.value)}
                className="h-12 w-full appearance-none rounded-lg border border-slate-800 bg-slate-950/70 px-4 pr-10 text-sm text-slate-200 outline-none transition focus:border-cyan-500"
              >
                <option>{allDifficultiesLabel}</option>
                {commandDifficultyOptions.map((difficulty) => (
                  <option key={difficulty}>{difficulty}</option>
                ))}
              </select>
              <Filter
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                size={17}
              />
            </label>

            <label className="relative block">
              <span className="sr-only">Filter by platform</span>
              <select
                aria-label="Filter by platform"
                value={selectedPlatform}
                onChange={(event) => setSelectedPlatform(event.target.value)}
                className="h-12 w-full appearance-none rounded-lg border border-slate-800 bg-slate-950/70 px-4 pr-10 text-sm text-slate-200 outline-none transition focus:border-cyan-500"
              >
                {platformOptions.map((platform) => (
                  <option key={platform}>{platform}</option>
                ))}
              </select>
              <Filter
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                size={17}
              />
            </label>

            <label className="relative block">
              <span className="sr-only">Filter by category</span>
              <select
                aria-label="Filter by category"
                value={
                  selectedCategory === crossPlatformLabel
                    ? allCategoriesLabel
                    : selectedCategory === allCommandsLabel
                      ? allCategoriesLabel
                      : selectedCategory
                }
                onChange={(event) =>
                  setSelectedCategory(
                    event.target.value === allCategoriesLabel
                      ? allCommandsLabel
                      : event.target.value
                  )
                }
                className="h-12 w-full appearance-none rounded-lg border border-slate-800 bg-slate-950/70 px-4 pr-10 text-sm text-slate-200 outline-none transition focus:border-cyan-500"
              >
                <option>{allCategoriesLabel}</option>
                {categoryFilterOptions
                  .filter((category) => category.name !== allCommandsLabel)
                  .map((category) => (
                    <option key={category.name}>{category.name}</option>
                  ))}
              </select>
              <Filter
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                size={17}
              />
            </label>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredCommands.map((command) => {
              const CategoryIcon = getCategoryIcon(command.category);

              return (
                <article
                  key={command.slug}
                  className="rounded-lg border border-slate-800 bg-slate-950/65 p-5 transition hover:-translate-y-1 hover:border-cyan-500/70 hover:shadow-[0_0_38px_rgba(6,182,212,0.12)]"
                >
                  <div className="flex flex-col items-start gap-3">
                    <code className="max-w-full break-words rounded-md bg-cyan-500/10 px-3 py-1.5 font-mono text-base font-semibold leading-7 text-cyan-300 sm:text-lg">
                      {command.name}
                    </code>

                    <div className="flex flex-wrap items-center gap-3">
                      <DifficultyBadge difficulty={command.difficulty} />
                      <span
                        className={`inline-flex items-center gap-2 text-xs ${getCategoryTextClass(
                          command.category
                        )}`}
                      >
                        <CategoryIcon size={16} />
                        {command.category}
                      </span>
                    </div>
                  </div>

                  <p className="mt-4 min-h-[3rem] text-sm leading-6 text-slate-300">
                    {command.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {command.platforms.map((platform) => (
                      <span
                        key={platform}
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getPlatformBadgeClass(
                          platform
                        )}`}
                      >
                        {platform}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link
                      href={`/commands/${command.slug}`}
                      className="inline-flex min-w-[7.75rem] items-center justify-center gap-2 rounded-lg border border-cyan-500/70 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/10"
                    >
                      View Details
                      <ChevronRight size={16} />
                    </Link>
                    <CopyCommandButton text={command.name} />
                  </div>
                </article>
              );
            })}
          </div>

          {filteredCommands.length === 0 && (
            <div className="mt-8 rounded-lg border border-slate-800 bg-slate-950/65 px-5 py-12 text-center">
              <p className="text-lg font-semibold text-slate-200">
                No commands found
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Try a different search, platform, or category.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function getCategoryIcon(categoryName: string) {
  return categoryIcons[categoryName] ?? FileText;
}

function categorySortValue(categoryName: string) {
  const index = categoryOrder.indexOf(categoryName);

  return index === -1 ? categoryOrder.length : index;
}

function getCommandCategories(commands: CommandReference[]): CategoryItem[] {
  const categoryCounts = commands.reduce<Map<string, number>>((map, command) => {
    map.set(command.category, (map.get(command.category) ?? 0) + 1);
    return map;
  }, new Map());

  const commandCategories = Array.from(categoryCounts.entries())
    .sort(([a], [b]) => {
      const orderDifference = categorySortValue(a) - categorySortValue(b);

      return orderDifference === 0 ? a.localeCompare(b) : orderDifference;
    })
    .map(([name, count]) => ({ name, count }));

  return [
    { name: allCommandsLabel, count: commands.length },
    {
      name: crossPlatformLabel,
      count: commands.filter((command) => command.platforms.length > 1).length,
    },
    ...commandCategories,
  ];
}

function commandMatchesCategory(
  command: CommandReference,
  selectedCategory: string
) {
  if (selectedCategory === allCommandsLabel) {
    return true;
  }

  if (selectedCategory === crossPlatformLabel) {
    return command.platforms.length > 1;
  }

  return command.category === selectedCategory;
}

function commandMatchesPlatform(
  command: CommandReference,
  selectedPlatform: string
) {
  if (selectedPlatform === allPlatformsLabel) {
    return true;
  }

  return command.platforms.some(
    (platform) => platform.toLowerCase() === selectedPlatform.toLowerCase()
  );
}

function commandMatchesDifficulty(
  command: CommandReference,
  selectedDifficulty: string
) {
  if (selectedDifficulty === allDifficultiesLabel) {
    return true;
  }

  return command.difficulty === selectedDifficulty;
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

function getCategoryTextClass(categoryName: string) {
  if (categoryName === "DNS") {
    return "text-blue-300";
  }

  if (categoryName === "DHCP") {
    return "text-emerald-300";
  }

  if (categoryName === "Routing") {
    return "text-violet-300";
  }

  if (categoryName === "Layer 2") {
    return "text-amber-300";
  }

  return "text-cyan-300";
}

function getPlatformBadgeClass(platform: string) {
  const normalizedPlatform = platform.toLowerCase();

  if (normalizedPlatform.includes("windows")) {
    return "border-blue-400/30 bg-blue-500/15 text-blue-300";
  }

  if (normalizedPlatform.includes("mac")) {
    return "border-violet-400/30 bg-violet-500/15 text-violet-300";
  }

  if (normalizedPlatform.includes("linux")) {
    return "border-emerald-400/30 bg-emerald-500/15 text-emerald-300";
  }

  return "border-slate-600 bg-slate-800 text-slate-300";
}
