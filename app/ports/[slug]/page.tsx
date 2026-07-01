import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Network,
  Server,
  Shield,
  Terminal,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";
import {
  getPortBySlug,
  getPortSlug,
  ports,
  type PortProtocol,
  type PortReference,
} from "@/data/ports";

function getProtocolBadgeClass(protocol: PortProtocol) {
  if (protocol === "TCP") {
    return "border-emerald-400/30 bg-emerald-500/15 text-emerald-300";
  }

  if (protocol === "UDP") {
    return "border-blue-400/30 bg-blue-500/15 text-blue-300";
  }

  return "border-cyan-400/30 bg-cyan-500/15 text-cyan-300";
}

function getRelatedPorts(currentPort: PortReference) {
  return ports
    .filter(
      (port) =>
        port.category === currentPort.category &&
        getPortSlug(port) !== getPortSlug(currentPort)
    )
    .slice(0, 6);
}

export function generateStaticParams() {
  return ports.map((port) => ({
    slug: getPortSlug(port),
  }));
}

export default async function PortDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const port = getPortBySlug(slug);

  if (!port) {
    notFound();
  }

  const relatedPorts = getRelatedPorts(port);

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <SiteNav active="ports" />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
          <Link href="/" className="hover:text-cyan-400">
            Home
          </Link>
          <ChevronRight size={15} />
          <Link href="/ports" className="hover:text-cyan-400">
            Ports
          </Link>
          <ChevronRight size={15} />
          <span>{port.service}</span>
        </div>

        <Link
          href="/ports"
          className="mt-8 inline-flex items-center gap-2 text-sm text-cyan-300 transition hover:text-cyan-200"
        >
          <ArrowLeft size={17} />
          Back to ports
        </Link>

        <section className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <article className="min-w-0">
            <div className="rounded-lg border border-slate-800 bg-slate-950/65 p-6 sm:p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase text-cyan-300">
                    Port {port.port}
                  </p>
                  <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
                    {port.service}
                  </h1>
                  <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
                    {port.description}
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-semibold ${getProtocolBadgeClass(
                    port.protocol
                  )}`}
                >
                  {port.protocol}
                </span>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-800 bg-slate-900/45 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Port
                  </p>
                  <p className="mt-2 text-2xl font-bold text-cyan-300">
                    {port.port}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/45 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Protocol
                  </p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {port.protocol}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/45 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Category
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-100">
                    {port.category}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-6">
                <div className="flex items-center gap-3">
                  <Server className="text-cyan-300" size={22} />
                  <h2 className="text-xl font-semibold">Purpose</h2>
                </div>
                <p className="mt-4 leading-7 text-slate-300">{port.purpose}</p>
              </section>

              <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-6">
                <div className="flex items-center gap-3">
                  <Network className="text-cyan-300" size={22} />
                  <h2 className="text-xl font-semibold">Common Uses</h2>
                </div>
                <div className="mt-4 space-y-3 text-slate-300">
                  {port.commonUses.map((item) => (
                    <p key={item} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400"></span>
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-6">
                <div className="flex items-center gap-3">
                  <Shield className="text-cyan-300" size={22} />
                  <h2 className="text-xl font-semibold">Common Symptoms</h2>
                </div>
                <div className="mt-4 space-y-3 text-slate-300">
                  {port.symptoms.map((item) => (
                    <p key={item} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400"></span>
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-cyan-300" size={22} />
                  <h2 className="text-xl font-semibold">Troubleshooting</h2>
                </div>
                <div className="mt-4 space-y-3 text-slate-300">
                  {port.troubleshooting.map((item) => (
                    <p key={item} className="flex gap-3">
                      <CheckCircle2
                        className="mt-0.5 shrink-0 text-green-400"
                        size={18}
                      />
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
              </section>
            </div>
          </article>

          <aside className="space-y-5">
            <div className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
              <div className="flex items-center gap-3">
                <Terminal className="text-cyan-300" size={22} />
                <h2 className="text-sm font-semibold uppercase text-slate-400">
                  Related Commands
                </h2>
              </div>
              <div className="mt-4 space-y-2">
                {port.relatedCommands.map((command) => (
                  <div
                    key={command}
                    className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 font-mono text-sm text-green-400"
                  >
                    {command}
                  </div>
                ))}
              </div>
            </div>

            {relatedPorts.length > 0 && (
              <div className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
                <h2 className="text-sm font-semibold uppercase text-slate-400">
                  Related Ports
                </h2>
                <div className="mt-4 divide-y divide-slate-800">
                  {relatedPorts.map((item) => (
                    <Link
                      key={getPortSlug(item)}
                      href={`/ports/${getPortSlug(item)}`}
                      className="flex items-center justify-between gap-4 py-3 text-sm text-blue-300 transition hover:text-cyan-300"
                    >
                      <span>
                        <span className="font-semibold text-cyan-300">
                          {item.port}
                        </span>{" "}
                        {item.service}
                      </span>
                      <ChevronRight className="shrink-0" size={16} />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}
