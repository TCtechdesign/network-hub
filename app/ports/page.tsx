"use client";

import {
  ChevronRight,
  Download,
  FileText,
  Filter,
  Folder,
  Gamepad2,
  Globe2,
  Lightbulb,
  Mail,
  Network,
  Search,
  Server,
  Shield,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SiteNav from "@/components/SiteNav";
import {
  getPortSlug,
  ports,
  type PortProtocol,
  type PortReference,
} from "@/data/ports";

type CategoryItem = {
  name: string;
  count: number;
};

type IconComponent = typeof Server;

const allPortsLabel = "All Ports";
const commonPortsLabel = "Common Ports";
const allProtocolsLabel = "All Protocols";
const allCategoriesLabel = "All Categories";

const categoryOrder = [
  "Web Services",
  "Email",
  "File Transfer",
  "Remote Access",
  "Network Services",
  "Security",
  "Gaming",
];

const categoryIcons: Record<string, IconComponent> = {
  [allPortsLabel]: Server,
  [commonPortsLabel]: Globe2,
  "Web Services": Globe2,
  Email: Mail,
  "File Transfer": Folder,
  "Remote Access": Shield,
  "Network Services": Network,
  Security: Shield,
  Gaming: Gamepad2,
};

function getCategoryIcon(categoryName: string) {
  return categoryIcons[categoryName] ?? FileText;
}

function categorySortValue(categoryName: string) {
  const index = categoryOrder.indexOf(categoryName);

  return index === -1 ? categoryOrder.length : index;
}

function getPortCategories(): CategoryItem[] {
  const categoryCounts = ports.reduce<Map<string, number>>((map, port) => {
    map.set(port.category, (map.get(port.category) ?? 0) + 1);
    return map;
  }, new Map());

  const portCategories = Array.from(categoryCounts.entries())
    .sort(([a], [b]) => {
      const orderDifference = categorySortValue(a) - categorySortValue(b);

      return orderDifference === 0 ? a.localeCompare(b) : orderDifference;
    })
    .map(([name, count]) => ({ name, count }));

  return [
    { name: allPortsLabel, count: ports.length },
    {
      name: commonPortsLabel,
      count: ports.filter((port) => port.common).length,
    },
    ...portCategories,
  ];
}

function protocolMatches(portProtocol: PortProtocol, selectedProtocol: string) {
  if (selectedProtocol === allProtocolsLabel) {
    return true;
  }

  if (selectedProtocol === "TCP / UDP") {
    return portProtocol === "TCP / UDP";
  }

  return portProtocol.includes(selectedProtocol);
}

function categoryMatches(port: PortReference, selectedCategory: string) {
  if (selectedCategory === allPortsLabel) {
    return true;
  }

  if (selectedCategory === commonPortsLabel) {
    return port.common;
  }

  return port.category === selectedCategory;
}

function getProtocolBadgeClass(protocol: PortProtocol) {
  if (protocol === "TCP") {
    return "border-emerald-400/30 bg-emerald-500/15 text-emerald-300";
  }

  if (protocol === "UDP") {
    return "border-blue-400/30 bg-blue-500/15 text-blue-300";
  }

  return "border-cyan-400/30 bg-cyan-500/15 text-cyan-300";
}

function getCategoryTextClass(categoryName: string) {
  if (categoryName === "Web Services") {
    return "text-cyan-300";
  }

  if (categoryName === "Email") {
    return "text-blue-300";
  }

  if (categoryName === "File Transfer") {
    return "text-violet-300";
  }

  if (categoryName === "Remote Access") {
    return "text-indigo-300";
  }

  return "text-slate-300";
}

function toCsvValue(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function buildCsv(portList: PortReference[]) {
  const header = ["Port", "Protocol", "Service", "Description", "Category"];
  const rows = portList.map((port) => [
    port.port,
    port.protocol,
    port.service,
    port.description,
    port.category,
  ]);

  return [header, ...rows]
    .map((row) => row.map(toCsvValue).join(","))
    .join("\n");
}

const categories = getPortCategories();
const protocolOptions = [
  allProtocolsLabel,
  ...Array.from(new Set(ports.map((port) => port.protocol))),
];
const tableCategoryOptions = categories.filter(
  (category) => category.name !== commonPortsLabel
);

export default function PortsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedProtocol, setSelectedProtocol] = useState(allProtocolsLabel);
  const [selectedCategory, setSelectedCategory] = useState(allPortsLabel);
  const searchText = search.trim().toLowerCase();
  const filteredPorts = ports.filter((port) => {
    const searchableText = [
      port.port,
      port.protocol,
      port.service,
      port.description,
      port.category,
    ]
      .join(" ")
      .toLowerCase();

    return (
      searchableText.includes(searchText) &&
      protocolMatches(port.protocol, selectedProtocol) &&
      categoryMatches(port, selectedCategory)
    );
  });

  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(
    buildCsv(filteredPorts)
  )}`;

  function openPort(port: PortReference) {
    router.push(`/ports/${getPortSlug(port)}`);
  }

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <SiteNav active="ports" />

      <div className="mx-auto grid max-w-[96rem] gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[19rem_minmax(0,1fr)] lg:px-8">
        <aside className="hidden border-slate-800 lg:block lg:border-r lg:pr-8">
          <div className="sticky top-24">
            <p className="px-2 text-sm font-semibold uppercase text-slate-400">
              Port Categories
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
                Use these ports when reviewing firewall rules, port forwarding,
                service access, and network troubleshooting.
              </p>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
                Common Network Ports
              </h1>
              <p className="mt-4 max-w-3xl text-lg text-slate-300">
                A reference guide for commonly used network ports and their
                services.
              </p>
            </div>

            <a
              href={csvHref}
              download="network-ports.csv"
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-cyan-500/70 px-5 py-3 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/10"
            >
              <Download size={18} />
              Download CSV
            </a>
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

          <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1fr)_13rem_13rem]">
            <label className="relative block">
              <span className="sr-only">Search ports</span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search ports, services, or descriptions..."
                className="h-12 w-full rounded-lg border border-slate-800 bg-slate-950/70 px-11 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
              />
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
            </label>

            <label className="relative block">
              <span className="sr-only">Filter by protocol</span>
              <select
                value={selectedProtocol}
                onChange={(event) => setSelectedProtocol(event.target.value)}
                className="h-12 w-full appearance-none rounded-lg border border-slate-800 bg-slate-950/70 px-4 pr-10 text-sm text-slate-200 outline-none transition focus:border-cyan-500"
              >
                {protocolOptions.map((protocol) => (
                  <option key={protocol}>{protocol}</option>
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
                value={
                  selectedCategory === commonPortsLabel
                    ? allCategoriesLabel
                    : selectedCategory === allPortsLabel
                      ? allCategoriesLabel
                      : selectedCategory
                }
                onChange={(event) =>
                  setSelectedCategory(
                    event.target.value === allCategoriesLabel
                      ? allPortsLabel
                      : event.target.value
                  )
                }
                className="h-12 w-full appearance-none rounded-lg border border-slate-800 bg-slate-950/70 px-4 pr-10 text-sm text-slate-200 outline-none transition focus:border-cyan-500"
              >
                <option>{allCategoriesLabel}</option>
                {tableCategoryOptions
                  .filter((category) => category.name !== allPortsLabel)
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

          <div className="mt-8 overflow-hidden rounded-lg border border-slate-800 bg-slate-950/55">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[58rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-cyan-300">
                    <th className="px-5 py-4 font-semibold">Port</th>
                    <th className="px-5 py-4 font-semibold">Protocol</th>
                    <th className="px-5 py-4 font-semibold">Service</th>
                    <th className="px-5 py-4 font-semibold">Description</th>
                    <th className="px-5 py-4 font-semibold">Category</th>
                    <th className="px-4 py-4">
                      <span className="sr-only">Details</span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {filteredPorts.map((port) => {
                    const CategoryIcon = getCategoryIcon(port.category);

                    return (
                      <tr
                        key={`${port.port}-${port.protocol}-${port.service}`}
                        role="link"
                        tabIndex={0}
                        aria-label={`View details for port ${port.port} ${port.service}`}
                        onClick={() => openPort(port)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openPort(port);
                          }
                        }}
                        className="group cursor-pointer transition hover:bg-slate-900/70 focus:bg-slate-900/70 focus:outline-none"
                      >
                        <td className="px-5 py-4 text-lg font-semibold text-cyan-300">
                          {port.port}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getProtocolBadgeClass(
                              port.protocol
                            )}`}
                          >
                            {port.protocol}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-white">
                          {port.service}
                        </td>
                        <td className="max-w-[22rem] px-5 py-4 text-sm leading-6 text-slate-300">
                          {port.description}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-2 text-sm ${getCategoryTextClass(
                              port.category
                            )}`}
                          >
                            <CategoryIcon size={17} />
                            {port.category}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-slate-500">
                          <ChevronRight
                            className="transition group-hover:translate-x-1 group-hover:text-cyan-300"
                            size={18}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredPorts.length === 0 && (
              <div className="border-t border-slate-800 px-5 py-12 text-center">
                <p className="text-lg font-semibold text-slate-200">
                  No ports found
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Try a different search, protocol, or category.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
