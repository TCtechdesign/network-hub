"use client";

import Link from "next/link";
import {
  Activity,
  Cable,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Crown,
  Download,
  Gamepad2,
  Gauge,
  Globe2,
  Info,
  Network,
  Printer,
  RefreshCw,
  Server,
  ShieldCheck,
  Wifi,
} from "lucide-react";
import { useMemo, useState } from "react";
import SiteNav from "@/components/SiteNav";
import {
  type PortForwardAccent,
  type PortForwardDeviceIcon,
  type PortForwardingDevice,
  type PortForwardingRule,
  type PortForwardWizardContent,
} from "@/data/portForwardWizard";
import { tools, type ToolIcon } from "@/data/tools";

type IconComponent = typeof Globe2;

type RenderedRule = PortForwardingRule & {
  localIp: string;
};

const iconMap: Record<ToolIcon, IconComponent> = {
  "map-pin": Globe2,
  globe: Globe2,
  dns: Globe2,
  network: Network,
  activity: Activity,
  ethernet: Cable,
  gauge: Gauge,
  pulse: Activity,
  shield: ShieldCheck,
};

const deviceIconMap: Record<PortForwardDeviceIcon, IconComponent> = {
  gamepad: Gamepad2,
  camera: Camera,
  server: Server,
  network: Network,
  printer: Printer,
  wifi: Wifi,
  globe: Globe2,
};

const accentText: Record<string, string> = {
  blue: "text-blue-400",
  green: "text-emerald-400",
  violet: "text-violet-400",
  amber: "text-amber-400",
  cyan: "text-cyan-400",
  red: "text-red-400",
};

const deviceAccentClass: Record<PortForwardAccent, string> = {
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  blue: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  red: "border-red-500/30 bg-red-500/10 text-red-300",
};

type PortForwardWizardProps = {
  content: PortForwardWizardContent;
};

export default function PortForwardWizard({ content }: PortForwardWizardProps) {
  const devices = content.devices;
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const selectedDevice =
    devices.find((device) => device.id === selectedDeviceId) ?? null;
  const [localIp, setLocalIp] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const renderedRules = useMemo(() => {
    if (!selectedDevice) {
      return [];
    }

    return selectedDevice.rules.map((rule) => ({
      ...rule,
      localIp: localIp || selectedDevice.defaultLocalIp,
    }));
  }, [localIp, selectedDevice]);

  function selectDevice(deviceId: string) {
    const device = devices.find((item) => item.id === deviceId) ?? null;

    setSelectedDeviceId(deviceId);
    setLocalIp(device?.defaultLocalIp ?? "");
    setStatusMessage("");
  }

  async function copyRules() {
    if (!selectedDevice) {
      return;
    }

    const text = buildRuleText(selectedDevice.name, renderedRules);

    try {
      await navigator.clipboard.writeText(text);
      setStatusMessage("Rules copied to clipboard.");
    } catch {
      setStatusMessage(
        "Could not copy automatically. Select and copy the rules manually."
      );
    }
  }

  function exportCsv() {
    if (!selectedDevice) {
      return;
    }

    const csv = [
      "Device,Protocol,Port,Local IP,Description",
      ...renderedRules.map((rule) =>
        [
          selectedDevice.name,
          rule.protocol,
          rule.port,
          rule.localIp,
          rule.description,
        ]
          .map((cell) => `"${cell.replaceAll('"', '""')}"`)
          .join(",")
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${selectedDevice.id}-port-forwarding.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatusMessage("CSV exported.");
  }

  function printRules() {
    if (!selectedDevice) {
      return;
    }

    window.print();
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020817] text-white">
      <SiteNav active="tools" />

      <div className="mx-auto grid max-w-[96rem] gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:px-8">
        <ToolsSidebar activeSlug="port-forward-wizard" />

        <section className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <Link href="/" className="hover:text-cyan-400">
              Home
            </Link>
            <ChevronRight size={15} />
            <Link href="/tools" className="hover:text-cyan-400">
              Tools
            </Link>
            <ChevronRight size={15} />
            <span>{content.title}</span>
          </div>

          <header className="mt-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {content.title}
            </h1>
            <p className="mt-3 max-w-4xl text-base leading-7 text-slate-300">
              {content.intro}
            </p>
          </header>

          <section className="mt-6 rounded-lg border border-slate-800 bg-slate-950/65 p-4 shadow-[0_0_70px_rgba(14,165,233,0.06)] sm:p-5">
            <div className="grid gap-6 xl:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.7fr)]">
              <div>
                <label
                  htmlFor="device-select"
                  className="text-sm font-semibold text-slate-100"
                >
                  1. Select a Device
                </label>
                <div className="relative mt-4">
                  <select
                    id="device-select"
                    value={selectedDeviceId}
                    onChange={(event) => selectDevice(event.target.value)}
                    className="h-14 w-full appearance-none rounded-lg border border-slate-800 bg-slate-950 px-4 pr-11 text-slate-100 outline-none transition focus:border-cyan-500"
                  >
                    <option value="">Choose a device</option>
                    {devices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                </div>

                <label
                  htmlFor="local-ip"
                  className="mt-5 block text-sm font-medium text-slate-300"
                >
                  Local IP Address
                </label>
                <input
                  id="local-ip"
                  value={localIp}
                  onChange={(event) => setLocalIp(event.target.value)}
                  disabled={!selectedDevice}
                  placeholder={
                    selectedDevice
                      ? selectedDevice.defaultLocalIp
                      : "Select a device first"
                  }
                  className="mt-2 h-12 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <p className="mt-2 text-sm text-slate-400">
                  Use the device IP shown in your router or console network
                  settings.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-100">
                  {content.quickSelectTitle}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {devices.map((device) => {
                    const Icon = deviceIconMap[device.icon];
                    const isActive = device.id === selectedDeviceId;

                    return (
                      <button
                        key={device.id}
                        type="button"
                        onClick={() => selectDevice(device.id)}
                        className={`flex min-h-14 min-w-0 items-center gap-3 rounded-lg border px-4 py-3 text-left transition ${
                          isActive
                            ? "border-cyan-500/70 bg-cyan-500/10 text-cyan-100"
                            : "border-slate-800 bg-slate-950/65 text-slate-200 hover:border-cyan-500/50 hover:bg-cyan-500/5"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${deviceAccentClass[device.accent]}`}
                        >
                          <Icon size={20} />
                        </span>
                        <span className="min-w-0 truncate font-medium">
                          {device.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 text-sm leading-6 text-slate-300">
                  <div className="flex gap-3">
                    <Info className="mt-0.5 shrink-0 text-blue-300" size={18} />
                    <p>{content.quickSelectHelp}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {selectedDevice ? (
            <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
              <div className="space-y-5">
                <RulesTable device={selectedDevice} rules={renderedRules} />

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => selectDevice(selectedDevice.id)}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 font-semibold text-white transition hover:bg-blue-500"
                  >
                    <RefreshCw size={18} />
                    Generate Ports
                  </button>
                  <button
                    type="button"
                    onClick={() => void copyRules()}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-950/65 px-4 font-semibold text-slate-200 transition hover:border-cyan-500/60 hover:text-cyan-200"
                  >
                    <Copy size={18} />
                    Copy Rules
                  </button>
                  <button
                    type="button"
                    onClick={exportCsv}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-950/65 px-4 font-semibold text-slate-200 transition hover:border-cyan-500/60 hover:text-cyan-200"
                  >
                    <Download size={18} />
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={printRules}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-950/65 px-4 font-semibold text-slate-200 transition hover:border-cyan-500/60 hover:text-cyan-200"
                  >
                    <Printer size={18} />
                    Print
                  </button>
                </div>

                {statusMessage && (
                  <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    {statusMessage}
                  </p>
                )}

                <SafetyNotice message={content.safetyNotice} />
              </div>

              <aside className="space-y-4">
                <SelectedDeviceCard
                  device={selectedDevice}
                  localIp={localIp || selectedDevice.defaultLocalIp}
                />
                <HowToCard title={content.howToTitle} body={content.howToBody} />
              </aside>
            </section>
          ) : (
            <BlankWizardState
              title={content.emptyStateTitle}
              body={content.emptyStateBody}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function ToolsSidebar({ activeSlug }: { activeSlug: string }) {
  return (
    <aside className="hidden border-slate-800 lg:block lg:border-r lg:pr-4">
      <div className="sticky top-24">
        <p className="px-2 text-sm font-semibold uppercase text-slate-400">
          Tools
        </p>

        <nav className="mt-4 space-y-2">
          {tools.map((tool) => {
            const Icon = iconMap[tool.icon];
            const isActive = tool.slug === activeSlug;

            return (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
                  isActive
                    ? "border border-blue-500/20 bg-blue-600/25 text-blue-300"
                    : "text-slate-300 hover:bg-slate-900/80 hover:text-cyan-300"
                }`}
              >
                <Icon
                  className={`shrink-0 ${accentText[tool.accent]}`}
                  size={19}
                />
                <span className="min-w-0 truncate">{tool.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-12 rounded-lg border border-slate-800 bg-slate-950/70 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-300">
              <Crown size={20} />
            </span>
            <h2 className="font-semibold">Go Pro</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Unlock saved router profiles, rule history, and exportable setup
            notes.
          </p>
          <Link
            href="/tools"
            className="mt-4 inline-flex items-center gap-2 text-sm text-blue-300 transition hover:text-blue-200"
          >
            Learn More
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </aside>
  );
}

function RulesTable({
  device,
  rules,
}: {
  device: PortForwardingDevice;
  rules: RenderedRule[];
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-4 sm:p-5">
      <h2 className="font-semibold">2. Recommended Port Forwarding Rules</h2>

      <div className="mt-4 space-y-3 md:hidden">
        {rules.map((rule) => (
          <article
            key={`${rule.protocol}-${rule.port}-${rule.description}-mobile`}
            className="rounded-lg border border-slate-800 bg-slate-950/75 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ProtocolBadge protocol={rule.protocol} />
              <span className="inline-flex items-center gap-2 rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-300">
                Recommended
                <CheckCircle2 size={14} />
              </span>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">
                  Port / Range
                </dt>
                <dd className="mt-1 break-words font-semibold text-slate-100">
                  {rule.port}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">
                  Local IP
                </dt>
                <dd className="mt-1 break-all text-slate-200">
                  {rule.localIp}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">
                  Description
                </dt>
                <dd className="mt-1 leading-6 text-slate-300">
                  {rule.description}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <div className="mt-4 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-300">
              {[
                "Protocol",
                "Port / Range",
                "Local IP",
                "Description",
                "Status",
              ].map((column) => (
                <th key={column} className="py-3 pr-4 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rules.map((rule) => (
              <tr key={`${rule.protocol}-${rule.port}-${rule.description}`}>
                <td className="py-2.5 pr-4">
                  <ProtocolBadge protocol={rule.protocol} />
                </td>
                <td className="py-2.5 pr-4 font-medium text-slate-100">
                  {rule.port}
                </td>
                <td className="py-2.5 pr-4 text-slate-200">{rule.localIp}</td>
                <td className="py-2.5 pr-4 text-slate-300">
                  {rule.description}
                </td>
                <td className="py-2.5 pr-4">
                  <span className="inline-flex items-center gap-2 rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-300">
                    Recommended
                    <CheckCircle2 size={14} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {device.notes && (
        <p className="mt-4 flex gap-2 text-sm leading-6 text-slate-400">
          <Info className="mt-0.5 shrink-0 text-blue-300" size={17} />
          <span>{device.notes}</span>
        </p>
      )}
    </section>
  );
}

function ProtocolBadge({ protocol }: { protocol: PortForwardingRule["protocol"] }) {
  const className =
    protocol === "TCP"
      ? "bg-blue-500/15 text-blue-300"
      : "bg-cyan-500/15 text-cyan-300";

  return (
    <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${className}`}>
      {protocol}
    </span>
  );
}

function SelectedDeviceCard({
  device,
  localIp,
}: {
  device: PortForwardingDevice;
  localIp: string;
}) {
  const Icon = deviceIconMap[device.icon];

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
      <h2 className="font-semibold">Selected Device</h2>
      <div className="mt-5 flex items-center gap-4">
        <span
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border ${deviceAccentClass[device.accent]}`}
        >
          <Icon size={34} />
        </span>
        <div className="min-w-0">
          <p className="break-words text-xl font-bold">{device.name}</p>
          <p className="mt-1 break-words text-slate-400">{device.type}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-2 border-t border-slate-800 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2 text-slate-400">
          <Network size={17} />
          Local IP Address
        </span>
        <span className="break-all font-semibold text-slate-100">{localIp}</span>
      </div>
    </section>
  );
}

function HowToCard({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
      <div className="flex items-center gap-3">
        <Info className="text-blue-300" size={22} />
        <h2 className="font-semibold">{title}</h2>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-400">{body}</p>
      <Link
        href="/guides"
        className="mt-4 inline-flex items-center gap-2 text-sm text-blue-300 transition hover:text-blue-200"
      >
        Learn more
        <ChevronRight size={16} />
      </Link>
    </section>
  );
}

function SafetyNotice({ message }: { message: string }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
      <div className="flex gap-3 text-sm leading-6 text-slate-400">
        <Info className="mt-0.5 shrink-0 text-blue-300" size={18} />
        <p>{message}</p>
      </div>
    </section>
  );
}

function BlankWizardState({ title, body }: { title: string; body: string }) {
  return (
    <section className="mt-5 rounded-lg border border-slate-800 bg-slate-950/45 px-4 py-16 text-center shadow-[0_0_60px_rgba(14,165,233,0.04)] sm:px-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-slate-400">
        <Wifi size={32} />
      </div>
      <h2 className="mt-5 text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
        {body}
      </p>
    </section>
  );
}

function buildRuleText(deviceName: string, rules: RenderedRule[]) {
  return [
    `${deviceName} port forwarding rules`,
    "",
    ...rules.map(
      (rule) =>
        `${rule.protocol} ${rule.port} -> ${rule.localIp} (${rule.description})`
    ),
  ].join("\n");
}
