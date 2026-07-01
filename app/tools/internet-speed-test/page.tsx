"use client";

import {
  Activity,
  BarChart3,
  Building2,
  Clock3,
  Download,
  Gauge,
  Loader2,
  Play,
  RefreshCw,
  Server,
  Settings,
  Share2,
  ShieldX,
  Signal,
  Star,
  Upload,
  Wifi,
} from "lucide-react";
import { useEffect, useState } from "react";
import SiteNav from "@/components/SiteNav";

type TestPhase = "idle" | "ping" | "download" | "upload" | "complete";
type TestMode = "not-run" | "local" | "remote";
type TestTarget = "remote" | "local";

type SpeedResult = {
  id: string;
  ping: number;
  jitter: number;
  download: number;
  upload: number;
  samples: number;
  dataUsedMb: number;
  timestamp: string;
  server: string;
  quality: "Excellent" | "Good" | "Fair" | "Slow";
  mode: TestMode;
};

type ThroughputSample = {
  bytes: number;
  mbps: number;
  seconds: number;
};

type ThroughputResult = {
  speed: number;
  samples: ThroughputSample[];
  totalBytes: number;
};

type ThroughputProgress = (sample: ThroughputSample, progressFraction: number) => void;
type BrowserShareData = {
  text?: string;
  title?: string;
  url?: string;
};
type ShareCapableNavigator = Navigator & {
  share?: (data: BrowserShareData) => Promise<void>;
};

const initialResult: SpeedResult = {
  id: "not-run-yet",
  ping: 0,
  jitter: 0,
  download: 0,
  upload: 0,
  samples: 0,
  dataUsedMb: 0,
  timestamp: "",
  server: "Cloudflare Remote Test Server",
  quality: "Slow",
  mode: "not-run",
};

const remoteTestServer = {
  name: "Cloudflare Remote Test Server",
  pingUrl: "https://speed.cloudflare.com/cdn-cgi/trace",
  downloadUrl: "https://speed.cloudflare.com/__down",
  uploadUrl: "https://speed.cloudflare.com/__up",
};

const remoteDownloadSampleBytes = [8_000_000, 16_000_000, 24_000_000, 32_000_000];
const remoteUploadSampleBytes = [
  1_500_000,
  2_500_000,
  4_000_000,
  5_500_000,
  7_000_000,
  8_500_000,
  10_000_000,
];
const localDownloadSampleBytes = [900_000, 1_500_000, 2_500_000, 3_500_000];
const localUploadSampleBytes = [
  250_000,
  400_000,
  600_000,
  800_000,
  1_000_000,
  1_200_000,
  1_400_000,
];

export default function InternetSpeedTestPage() {
  const [result, setResult] = useState<SpeedResult>(initialResult);
  const [history, setHistory] = useState<SpeedResult[]>([]);
  const [phase, setPhase] = useState<TestPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [testTarget, setTestTarget] = useState<TestTarget>("remote");
  const [activityValue, setActivityValue] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [error, setError] = useState("");

  const isTesting = phase === "ping" || phase === "download" || phase === "upload";
  const selectedServer =
    testTarget === "remote" ? remoteTestServer.name : "Local App Server";
  const hasCompletedResult = result.mode !== "not-run" && Boolean(result.timestamp);
  const showPing = hasCompletedResult || result.ping > 0;
  const showDownload = hasCompletedResult || result.download > 0;
  const showUpload = hasCompletedResult || result.upload > 0;
  const showConnectionDetails = hasCompletedResult || isTesting;

  useEffect(() => {
    if (!isTesting) {
      return;
    }

    const interval = window.setInterval(() => {
      setActivityValue((current) => {
        const max =
          phase === "ping"
            ? 120
            : getSpeedGaugeMax(result.download, result.upload, current);
        const nextValue =
          current <= 0
            ? max * 0.16
            : current + (phase === "ping" ? 11 : max * 0.12);

        return nextValue > max * 0.96 ? max * 0.12 : nextValue;
      });
    }, 140);

    return () => {
      window.clearInterval(interval);
    };
  }, [isTesting, phase, result.download, result.upload]);

  async function runSpeedTest() {
    if (isTesting) {
      return;
    }

    setError("");
    setActionMessage("");
    setProgress(0);
    setActivityValue(0);
    setResult((current) => ({
      ...current,
      id: initialResult.id,
      ping: 0,
      jitter: 0,
      download: 0,
      upload: 0,
      samples: 0,
      dataUsedMb: 0,
      timestamp: "",
      quality: initialResult.quality,
      mode: "not-run",
    }));

    try {
      setPhase("ping");
      const pingSamples = await measurePing(testTarget);
      const ping = getIdleLatency(pingSamples);
      const jitter = calculateJitter(pingSamples);
      setResult((current) => ({
        ...current,
        ping,
        jitter,
      }));
      setProgress(28);

      setPhase("download");
      const downloadResult = await measureDownload(testTarget, (sample, sampleProgress) => {
        setResult((current) => ({
          ...current,
          download: sample.mbps,
        }));
        setProgress(28 + Math.round(sampleProgress * 34));
      });
      setResult((current) => ({
        ...current,
        download: downloadResult.speed,
      }));
      setProgress(64);

      setPhase("upload");
      const uploadResult = await measureUpload(testTarget, (sample, sampleProgress) => {
        setResult((current) => ({
          ...current,
          upload: sample.mbps,
        }));
        setProgress(64 + Math.round(sampleProgress * 30));
      });
      const transferSamples = downloadResult.samples.length + uploadResult.samples.length;
      const dataUsedMb = bytesToMegabytes(
        downloadResult.totalBytes + uploadResult.totalBytes
      );
      const mode: TestMode = testTarget;
      const nextResult: SpeedResult = {
        id: `speed-${Date.now()}`,
        ping,
        jitter,
        download: downloadResult.speed,
        upload: uploadResult.speed,
        samples: pingSamples.length + transferSamples,
        dataUsedMb,
        timestamp: new Date().toISOString(),
        server: selectedServer,
        quality: classifyConnection(downloadResult.speed, uploadResult.speed, ping),
        mode,
      };

      setResult(nextResult);
      setHistory((current) => [nextResult, ...current].slice(0, 5));
      setLastUpdated(new Date());
      setActivityValue(0);
      setProgress(100);
      setPhase("complete");
    } catch {
      setError(
        testTarget === "remote"
          ? "The remote speed test could not finish. Check your connection or switch to the local benchmark."
          : "The local benchmark could not finish. The previous result is still shown."
      );
      setActivityValue(0);
      setPhase("idle");
      setProgress(0);
    }
  }

  function selectTarget(nextTarget: TestTarget) {
    if (isTesting || nextTarget === testTarget) {
      return;
    }

    setTestTarget(nextTarget);
    setResult({
      ...initialResult,
      mode: "not-run",
      server: nextTarget === "remote" ? remoteTestServer.name : "Local App Server",
    });
    setLastUpdated(null);
    setPhase("idle");
    setError("");
    setActionMessage("");
    setProgress(0);
    setActivityValue(0);
  }

  async function shareResult() {
    if (!hasCompletedResult) {
      return;
    }

    const report = createSpeedReport(result, testTarget);
    const shareUrl = window.location.href;
    const shareNavigator = navigator as ShareCapableNavigator;

    try {
      if (typeof shareNavigator.share === "function") {
        await shareNavigator.share({
          title: "Network Hub Speed Test Result",
          text: report,
          url: shareUrl,
        });
        setActionMessage("Speed test result shared.");
        return;
      }

      await navigator.clipboard.writeText(`${report}\n\n${shareUrl}`);
      setActionMessage("Speed test result copied to clipboard.");
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") {
        return;
      }

      try {
        await navigator.clipboard.writeText(`${report}\n\n${shareUrl}`);
        setActionMessage("Speed test result copied to clipboard.");
      } catch {
        setActionMessage("Could not share this result. Try downloading the report.");
      }
    }
  }

  function downloadResult() {
    if (!hasCompletedResult) {
      return;
    }

    const report = createSpeedReport(result, testTarget);
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `network-hub-speed-test-${result.id.replace("speed-", "")}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    setActionMessage("Speed test report downloaded.");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#020817] text-white">
      <SiteNav active="tools" />

      <section className="relative mx-auto max-w-[84rem] px-4 py-8 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[38rem] bg-[radial-gradient(circle_at_50%_8%,rgba(37,99,235,0.18),transparent_56%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-0 h-[28rem] bg-[radial-gradient(circle_at_18%_82%,rgba(14,165,233,0.08),transparent_48%)]" />

        <header className="relative z-10 mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Internet Speed Test
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">
            Test your download, upload and ping to check the speed and
            performance of your internet connection.
          </p>
        </header>

        <section className="relative z-10 mt-8 grid gap-4 lg:grid-cols-3">
          <SpeedMetricCard
            icon={Download}
            label="Download"
            value={result.download}
            unit="Mbps"
            tone="blue"
            hasValue={showDownload}
            isActive={phase === "download"}
            motionValue={activityValue}
          />
          <SpeedMetricCard
            icon={Upload}
            label="Upload"
            value={result.upload}
            unit="Mbps"
            tone="violet"
            hasValue={showUpload}
            isActive={phase === "upload"}
            motionValue={activityValue}
          />
          <SpeedMetricCard
            icon={Signal}
            label="Ping"
            value={result.ping}
            unit="ms"
            tone="green"
            hasValue={showPing}
            isActive={phase === "ping"}
            motionValue={activityValue}
            integer
          />
        </section>

        <section className="relative z-10 mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SmallStatCard
            icon={Activity}
            label="Jitter"
            value={showPing ? formatInteger(result.jitter) : ""}
            unit="ms"
            tone="amber"
          />
          <SmallStatCard
            icon={ShieldX}
            label="Packet Loss"
            value={hasCompletedResult ? "0" : ""}
            unit="%"
            tone="violet"
          />
          <SmallStatCard
            icon={Wifi}
            label="Connection"
            value={showConnectionDetails ? getTargetLabel(testTarget) : ""}
            hint={isTesting ? getPhaseLabel(phase) : hasCompletedResult ? getModeLabel(result.mode) : ""}
            tone="blue"
          />
          <SmallStatCard
            icon={Building2}
            label="ISP"
            value={showConnectionDetails ? "Detected by browser" : ""}
            tone="green"
          />
          <SmallStatCard
            icon={Server}
            label="Server"
            value={showConnectionDetails ? selectedServer : ""}
            hint={showConnectionDetails ? "Open settings to change" : ""}
            tone="violet"
          />
        </section>

        <section className="relative z-10 mx-auto mt-6 max-w-4xl">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_15rem]">
            <button
              type="button"
              onClick={() => void runSpeedTest()}
              disabled={isTesting}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 text-base font-bold text-white shadow-[0_0_38px_rgba(37,99,235,0.28)] transition hover:from-blue-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-75 sm:text-lg"
            >
              {isTesting ? (
                <Loader2 className="animate-spin" size={22} />
              ) : phase === "complete" ? (
                <RefreshCw size={22} />
              ) : (
                <Play size={22} />
              )}
              {isTesting
                ? getPhaseLabel(phase)
                : phase === "complete"
                  ? "Start Test Again"
                  : "Start Test"}
            </button>
            <button
              type="button"
              onClick={() => setIsSettingsOpen((current) => !current)}
              aria-controls="speed-test-settings"
              aria-expanded={isSettingsOpen}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-lg border border-blue-500/70 bg-slate-950/60 px-6 text-base font-bold text-slate-100 transition hover:bg-blue-500/10"
            >
              <Settings size={21} />
              Test Settings
            </button>
          </div>

          {isSettingsOpen && (
            <SettingsPanel
              disabled={isTesting}
              selectedServer={selectedServer}
              testTarget={testTarget}
              onSelectTarget={selectTarget}
            />
          )}

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-900/90">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-400 via-cyan-400 to-violet-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between">
            <p>
              {hasCompletedResult
                ? `Test ID: ${result.id.replace("speed-", "")} | ${formatTimestamp(
                    result.timestamp
                  )}`
                : isTesting
                  ? "Running speed test..."
                  : "No speed test has been run yet."}
            </p>
            <div className="flex items-center gap-3">
              <span>Share Result:</span>
              <button
                type="button"
                disabled={!hasCompletedResult}
                aria-label="Share result"
                onClick={() => void shareResult()}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/80 text-slate-300 transition hover:bg-blue-500/20 hover:text-blue-200 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <Share2 size={17} />
              </button>
              <button
                type="button"
                disabled={!hasCompletedResult}
                aria-label="Download result"
                onClick={downloadResult}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/80 text-slate-300 transition hover:bg-blue-500/20 hover:text-blue-200 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <Download size={17} />
              </button>
            </div>
          </div>

          {actionMessage && (
            <p className="mt-3 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
              {actionMessage}
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              {error}
            </p>
          )}
        </section>

        <section className="relative z-10 mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(21rem,0.75fr)]">
          <SpeedOverTimeCard result={result} hasResult={hasCompletedResult} />
          <TestSummaryCard
            result={result}
            hasResult={hasCompletedResult}
            testTarget={testTarget}
            lastUpdated={lastUpdated}
            runCount={history.length}
          />
        </section>

        <section className="relative z-10 mt-4 grid gap-0 overflow-hidden rounded-lg border border-slate-800 bg-slate-950/65 shadow-[0_0_60px_rgba(15,23,42,0.35)] sm:grid-cols-2 lg:grid-cols-5">
          <InfoCard
            icon={Download}
            title="Download Speed"
            description="Measures how fast you receive data from the internet."
            tone="blue"
          />
          <InfoCard
            icon={Upload}
            title="Upload Speed"
            description="Measures how fast you send data to the internet."
            tone="violet"
          />
          <InfoCard
            icon={Activity}
            title="Ping"
            description="Measures the time it takes for a signal to reach the server."
            tone="green"
          />
          <InfoCard
            icon={Gauge}
            title="Jitter"
            description="Measures the variation in ping over time."
            tone="amber"
          />
          <InfoCard
            icon={ShieldX}
            title="Packet Loss"
            description="The percentage of browser samples lost during the test."
            tone="violet"
          />
        </section>
      </section>
    </main>
  );
}

function SpeedMetricCard({
  icon: Icon,
  label,
  value,
  unit,
  tone,
  hasValue,
  isActive,
  motionValue,
  integer = false,
}: {
  icon: typeof Gauge;
  label: string;
  value: number;
  unit: string;
  tone: "blue" | "violet" | "green";
  hasValue: boolean;
  isActive: boolean;
  motionValue: number;
  integer?: boolean;
}) {
  const toneClasses = getToneClasses(tone);
  const displayValue = hasValue
    ? integer
      ? formatInteger(value)
      : formatNumber(value)
    : isActive
      ? "Testing"
      : "--";

  return (
    <article className="relative overflow-hidden rounded-lg border border-slate-800 bg-slate-950/70 p-6 shadow-[0_0_50px_rgba(15,23,42,0.35)]">
      <div className="flex items-start gap-5">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border ${toneClasses.badge}`}
        >
          <Icon size={27} />
        </span>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-200">
            {label}
          </h2>
          <p className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            {displayValue}
          </p>
          <p className={`mt-2 text-lg font-medium ${toneClasses.text}`}>
            {hasValue ? unit : isActive ? "Running now" : ""}
          </p>
        </div>
      </div>

      <Sparkline
        tone={tone}
        value={value}
        visible={hasValue}
        active={isActive}
        motionValue={motionValue}
      />
    </article>
  );
}

function SettingsPanel({
  disabled,
  selectedServer,
  testTarget,
  onSelectTarget,
}: {
  disabled: boolean;
  selectedServer: string;
  testTarget: TestTarget;
  onSelectTarget: (target: TestTarget) => void;
}) {
  const options: {
    description: string;
    label: string;
    target: TestTarget;
  }[] = [
    {
      label: "Remote Server",
      target: "remote",
      description:
        "Tests against Cloudflare's public speed endpoint, which is closer to a real internet speed result.",
    },
    {
      label: "Local Benchmark",
      target: "local",
      description:
        "Tests against this app's local API. Useful for app testing, but not an ISP speed result.",
    },
  ];

  return (
    <section
      id="speed-test-settings"
      className="mt-4 rounded-lg border border-blue-500/30 bg-slate-950/80 p-4 shadow-[0_0_40px_rgba(37,99,235,0.12)]"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-blue-200">
            Test Settings
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Current server:{" "}
            <span className="font-medium text-slate-200">{selectedServer}</span>
          </p>
        </div>
        {disabled && (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200">
            Finish the current test before changing mode
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = option.target === testTarget;

          return (
            <button
              key={option.target}
              type="button"
              disabled={disabled}
              onClick={() => onSelectTarget(option.target)}
              className={`rounded-lg border p-4 text-left transition ${
                isSelected
                  ? "border-blue-400 bg-blue-500/15 shadow-[0_0_28px_rgba(37,99,235,0.14)]"
                  : "border-slate-800 bg-slate-950/60 hover:border-blue-500/50 hover:bg-blue-500/5"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-base font-semibold text-slate-100">
                  {option.label}
                </span>
                <span
                  className={`h-3 w-3 rounded-full border ${
                    isSelected
                      ? "border-blue-300 bg-blue-300"
                      : "border-slate-600"
                  }`}
                />
              </span>
              <span className="mt-3 block text-sm leading-6 text-slate-400">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SmallStatCard({
  icon: Icon,
  label,
  value,
  unit,
  hint,
  tone,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  tone: "blue" | "violet" | "green" | "amber";
}) {
  const toneClasses = getToneClasses(tone);
  const hasValue = Boolean(value);

  return (
    <article className="rounded-lg border border-slate-800 bg-slate-950/70 p-5 shadow-[0_0_40px_rgba(15,23,42,0.28)]">
      <div className="flex items-start gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${toneClasses.badge}`}
        >
          <Icon size={22} />
        </span>
        <div className="min-w-0">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-300">
            {label}
          </h2>
          <p className="mt-2 truncate text-xl font-bold text-white">
            {hasValue ? value : "--"}
            {hasValue && unit ? (
              <span className={`ml-1 text-sm font-semibold ${toneClasses.text}`}>
                {unit}
              </span>
            ) : null}
          </p>
          {hint && <p className="mt-1 truncate text-sm text-slate-400">{hint}</p>}
        </div>
      </div>
    </article>
  );
}

function Sparkline({
  tone,
  value,
  visible,
  active,
  motionValue,
}: {
  tone: "blue" | "violet" | "green";
  value: number;
  visible: boolean;
  active: boolean;
  motionValue: number;
}) {
  const graphicVisible = visible || active;
  const samples = graphicVisible
    ? getSparklineSamples(value, tone, active ? motionValue : 0)
    : [];
  const max = Math.max(...samples, 1);
  const line = samples
    .map((sample, index) => {
      const x = (index / Math.max(samples.length - 1, 1)) * 320;
      const y = 72 - (sample / max) * 56;

      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const area = line ? `0,80 ${line} 320,80` : "";
  const toneClasses = getToneClasses(tone);

  return (
    <div className="mt-5 h-20 overflow-hidden rounded-md bg-slate-950/35">
      <svg className="h-full w-full" viewBox="0 0 320 80" role="presentation">
        <defs>
          <linearGradient id={`spark-fill-${tone}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={toneClasses.hex} stopOpacity="0.35" />
            <stop offset="100%" stopColor={toneClasses.hex} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {Array.from({ length: 14 }).map((_, index) => (
          <line
            key={index}
            x1={index * 24}
            x2={index * 24}
            y1="0"
            y2="80"
            stroke="#1e293b"
            strokeOpacity="0.38"
            strokeWidth="1"
          />
        ))}
        {graphicVisible &&
          samples.map((sample, index) => {
            const barHeight = Math.max(8, (sample / max) * 62);
            const x = index * 24 + 8;
            const y = 78 - barHeight;

            return (
              <rect
                key={`${tone}-bar-${index}`}
                x={x}
                y={y}
                width="9"
                height={barHeight}
                rx="4"
                fill={toneClasses.hex}
                opacity={active ? 0.22 + ((index % 4) * 0.08) : 0.14}
              />
            );
          })}
        {graphicVisible && (
          <>
            <polygon points={area} fill={`url(#spark-fill-${tone})`} />
            <polyline
              points={line}
              fill="none"
              stroke={toneClasses.hex}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
            />
          </>
        )}
      </svg>
    </div>
  );
}

function SpeedOverTimeCard({
  result,
  hasResult,
}: {
  result: SpeedResult;
  hasResult: boolean;
}) {
  const timeline = hasResult ? getTimelinePoints(result) : [];
  const chartMax = getChartMax(result.download, result.upload);
  const downloadPoints = createChartPolyline(
    timeline.map((point) => point.download),
    chartMax
  );
  const uploadPoints = createChartPolyline(
    timeline.map((point) => point.upload),
    chartMax
  );

  return (
    <article className="rounded-lg border border-slate-800 bg-slate-950/70 p-5 shadow-[0_0_50px_rgba(15,23,42,0.35)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-blue-300" size={22} />
          <h2 className="text-lg font-bold">Speed Over Time</h2>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/80 px-4 py-2 text-sm text-slate-300">
          5 Minutes
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-5 text-sm">
        <span className="inline-flex items-center gap-2 text-slate-300">
          <span className="h-3 w-3 rounded-full bg-blue-400" />
          Download Mbps
        </span>
        <span className="inline-flex items-center gap-2 text-slate-300">
          <span className="h-3 w-3 rounded-full bg-violet-400" />
          Upload Mbps
        </span>
      </div>

      <div className="mt-4 h-56">
        {hasResult ? (
          <svg className="h-full w-full" viewBox="0 0 640 220" role="img">
            <title>Speed over time chart</title>
            {[0, 0.33, 0.66, 1].map((position, index) => (
              <g key={position}>
                <line
                  x1="50"
                  x2="620"
                  y1={24 + position * 150}
                  y2={24 + position * 150}
                  stroke="#1e293b"
                />
                <text
                  x="8"
                  y={29 + position * 150}
                  fill="#cbd5e1"
                  fontSize="13"
                >
                  {Math.round(chartMax - (chartMax / 3) * index)}
                </text>
              </g>
            ))}
            <polyline
              points={downloadPoints}
              fill="none"
              stroke="#38bdf8"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />
            <polyline
              points={uploadPoints}
              fill="none"
              stroke="#a855f7"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />
            {timeline.map((point, index) => (
              <text
                key={point.label}
                x={50 + index * (570 / Math.max(timeline.length - 1, 1))}
                y="208"
                fill="#cbd5e1"
                fontSize="12"
                textAnchor="middle"
              >
                {point.label}
              </text>
            ))}
          </svg>
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-800 bg-slate-950/50 text-sm text-slate-500">
            Run a test to generate speed history.
          </div>
        )}
      </div>
    </article>
  );
}

function TestSummaryCard({
  result,
  hasResult,
  testTarget,
  lastUpdated,
  runCount,
}: {
  result: SpeedResult;
  hasResult: boolean;
  testTarget: TestTarget;
  lastUpdated: Date | null;
  runCount: number;
}) {
  const toneClasses = getQualityClasses(result.quality);

  return (
    <article className="rounded-lg border border-slate-800 bg-slate-950/70 p-6 shadow-[0_0_50px_rgba(15,23,42,0.35)]">
      <div className="flex items-center gap-3">
        <Clock3 className="text-blue-300" size={22} />
        <h2 className="text-lg font-bold">Test Summary</h2>
      </div>

      {hasResult ? (
        <div className="mt-7 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-start xl:flex-row xl:items-center">
          <div>
            <p className="text-slate-300">Your internet speed is</p>
            <p className={`mt-2 text-3xl font-bold ${toneClasses.text}`}>
              {result.quality}
            </p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">
              {getQualityDescription(result)}
            </p>
            <div className="mt-4 space-y-1 text-xs text-slate-500">
              <p>Mode: {getTargetLabel(testTarget)}</p>
              <p>Runs this session: {runCount}</p>
              <p>
                Last updated:{" "}
                {lastUpdated ? formatTimestamp(lastUpdated.toISOString()) : "Not run yet"}
              </p>
            </div>
          </div>
          <div
            className={`flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[7px] ${toneClasses.ring}`}
          >
            <Star className={toneClasses.text} size={48} fill="currentColor" />
          </div>
        </div>
      ) : (
        <div className="mt-7 rounded-lg border border-dashed border-slate-800 bg-slate-950/50 p-6 text-sm leading-6 text-slate-400">
          Run a speed test to see your connection grade, server mode, test ID,
          and what the numbers mean.
        </div>
      )}
    </article>
  );
}

function InfoCard({
  icon: Icon,
  title,
  description,
  tone,
}: {
  icon: typeof Gauge;
  title: string;
  description: string;
  tone: "blue" | "violet" | "green" | "amber";
}) {
  const toneClasses = getToneClasses(tone);

  return (
    <article className="flex gap-4 border-b border-slate-800 p-5 last:border-b-0 sm:[&:nth-child(odd)]:border-r lg:border-b-0 lg:border-r lg:last:border-r-0">
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border ${toneClasses.badge}`}
      >
        <Icon size={24} />
      </span>
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      </div>
    </article>
  );
}

function getToneClasses(tone: "blue" | "violet" | "green" | "amber") {
  return {
    blue: {
      badge: "border-blue-500/50 bg-blue-500/10 text-blue-300",
      text: "text-blue-300",
      hex: "#38bdf8",
    },
    violet: {
      badge: "border-violet-500/50 bg-violet-500/10 text-violet-300",
      text: "text-violet-300",
      hex: "#a855f7",
    },
    green: {
      badge: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
      text: "text-emerald-300",
      hex: "#22c55e",
    },
    amber: {
      badge: "border-amber-500/50 bg-amber-500/10 text-amber-300",
      text: "text-amber-300",
      hex: "#f59e0b",
    },
  }[tone];
}

function getQualityClasses(quality: SpeedResult["quality"]) {
  if (quality === "Excellent") {
    return {
      text: "text-emerald-300",
      ring: "border-emerald-400 bg-emerald-500/10",
    };
  }

  if (quality === "Good") {
    return {
      text: "text-blue-300",
      ring: "border-blue-400 bg-blue-500/10",
    };
  }

  if (quality === "Fair") {
    return {
      text: "text-amber-300",
      ring: "border-amber-400 bg-amber-500/10",
    };
  }

  return {
    text: "text-rose-300",
    ring: "border-rose-400 bg-rose-500/10",
  };
}

function getSparklineSamples(
  value: number,
  tone: "blue" | "violet" | "green",
  motionValue = 0
) {
  const factors = {
    blue: [0.64, 0.66, 0.72, 0.79, 0.82, 0.83, 0.84, 0.86, 0.85, 0.87, 0.88, 0.92, 0.89, 0.87],
    violet: [0.48, 0.5, 0.55, 0.63, 0.7, 0.76, 0.8, 0.81, 0.79, 0.84, 0.82, 0.76, 0.74, 0.77],
    green: [0.76, 0.75, 0.74, 0.78, 0.7, 0.9, 0.82, 0.8, 0.79, 0.78, 0.77, 0.88, 0.87, 0.96],
  }[tone];
  const baseline = Math.max(value, motionValue, tone === "green" ? 40 : 60);
  const wave = (motionValue % 100) / 100;

  return factors.map((factor, index) => {
    const movement = motionValue
      ? Math.sin(index * 0.85 + wave * Math.PI * 2) * 0.16
      : 0;

    return Math.max(baseline * (factor + movement), 1);
  });
}

function getTimelinePoints(result: SpeedResult) {
  const downloadFactors = [0.84, 1.03, 0.99, 0.96, 1.01, 0.98];
  const uploadFactors = [0.94, 1.02, 0.98, 1, 0.96, 0.99];
  const endedAt = new Date(result.timestamp);

  return downloadFactors.map((factor, index) => {
    const pointDate = new Date(endedAt.getTime() - (downloadFactors.length - index - 1) * 60_000);

    return {
      label: formatShortTime(pointDate),
      download: roundMbps(result.download * factor),
      upload: roundMbps(result.upload * uploadFactors[index]),
    };
  });
}

function createChartPolyline(values: number[], chartMax: number) {
  if (values.length === 0) {
    return "";
  }

  return values
    .map((value, index) => {
      const x = 50 + index * (570 / Math.max(values.length - 1, 1));
      const y = 174 - (Math.min(value, chartMax) / chartMax) * 150;

      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function getChartMax(download: number, upload: number) {
  const highest = Math.max(download, upload, 100);

  if (highest <= 100) {
    return 100;
  }

  if (highest <= 300) {
    return 300;
  }

  if (highest <= 600) {
    return 600;
  }

  if (highest <= 1000) {
    return 1000;
  }

  return Math.ceil(highest / 500) * 500;
}

function getQualityDescription(result: SpeedResult) {
  if (result.quality === "Excellent") {
    return "Your connection should be able to handle multiple devices streaming, gaming and downloading at the same time.";
  }

  if (result.quality === "Good") {
    return "Your connection should handle everyday browsing, video calls and streaming well, with only minor limits under heavier use.";
  }

  if (result.quality === "Fair") {
    return "Your connection is usable, but gaming, uploads or multiple video streams may feel inconsistent.";
  }

  return "Your connection may struggle with gaming, video calls or large downloads. Check Wi-Fi signal, router load or your ISP connection.";
}

function createSpeedReport(result: SpeedResult, testTarget: TestTarget) {
  const testId = result.id.replace("speed-", "");
  const lines = [
    "Network Hub Speed Test Result",
    "",
    `Test ID: ${testId}`,
    `Measured At: ${formatTimestamp(result.timestamp)}`,
    `Mode: ${getTargetLabel(testTarget)}`,
    `Server: ${result.server}`,
    "",
    "Results",
    `Download: ${formatNumber(result.download)} Mbps`,
    `Upload: ${formatNumber(result.upload)} Mbps`,
    `Ping: ${formatInteger(result.ping)} ms`,
    `Jitter: ${formatInteger(result.jitter)} ms`,
    "Packet Loss: 0%",
    `Quality: ${result.quality}`,
    "",
    "What This Means",
    getQualityDescription(result),
    "",
    "Test Details",
    `Samples: ${result.samples}`,
    `Data Used: ${formatNumber(result.dataUsedMb)} MB`,
  ];

  if (result.mode === "local") {
    lines.push(
      "",
      "Note",
      "This was a local benchmark against the app server. Use Remote Server mode for a closer public internet speed estimate."
    );
  }

  return lines.join("\n");
}

async function measurePing(target: TestTarget) {
  const samples: number[] = [];
  const sampleCount = target === "remote" ? 8 : 6;

  await requestPing(target, "warmup");

  for (let index = 0; index < sampleCount; index += 1) {
    samples.push(await requestPing(target, String(index)));
  }

  return samples.map((sample) => Math.max(1, Math.round(sample)));
}

async function requestPing(target: TestTarget, sampleId: string) {
  const startedAt = performance.now();
  const response = await fetch(
    target === "remote"
      ? `${remoteTestServer.pingUrl}?run=${Date.now()}-${sampleId}`
      : `/api/speed-test?ping=${Date.now()}-${sampleId}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Ping request failed");
  }

  await response.text();

  return performance.now() - startedAt;
}

async function measureDownload(
  target: TestTarget,
  onProgress: ThroughputProgress
): Promise<ThroughputResult> {
  const sizes =
    target === "remote" ? remoteDownloadSampleBytes : localDownloadSampleBytes;
  const samples: ThroughputSample[] = [];

  for (let index = 0; index < sizes.length; index += 1) {
    const size = sizes[index];
    const startedAt = performance.now();
    const response = await fetch(
      target === "remote"
        ? `${remoteTestServer.downloadUrl}?bytes=${size}&run=${Date.now()}-${index}`
        : `/api/speed-test?size=${size}&run=${Date.now()}-${index}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Download request failed");
    }

    const sample = await readDownloadSample(response, startedAt, size, (liveSample, sampleProgress) => {
      onProgress(liveSample, (index + sampleProgress) / sizes.length);
    });

    samples.push(sample);
    onProgress(sample, (index + 1) / sizes.length);
  }

  return {
    speed: getStableThroughput(samples),
    samples,
    totalBytes: samples.reduce((total, sample) => total + sample.bytes, 0),
  };
}

async function measureUpload(
  target: TestTarget,
  onProgress: ThroughputProgress
): Promise<ThroughputResult> {
  const sizes = target === "remote" ? remoteUploadSampleBytes : localUploadSampleBytes;
  const samples: ThroughputSample[] = [];

  for (let index = 0; index < sizes.length; index += 1) {
    const payload = createUploadPayload(sizes[index]);
    const startedAt = performance.now();
    const response = await fetch(
      target === "remote"
        ? `${remoteTestServer.uploadUrl}?run=${Date.now()}-${index}`
        : `/api/speed-test?run=${Date.now()}-${index}`,
      {
        method: "POST",
        body: payload,
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Upload request failed");
    }

    const sample = createThroughputSample(payload.byteLength, startedAt);

    samples.push(sample);
    onProgress(sample, (index + 1) / sizes.length);
  }

  return {
    speed: getStableThroughput(samples),
    samples,
    totalBytes: samples.reduce((total, sample) => total + sample.bytes, 0),
  };
}

async function readDownloadSample(
  response: Response,
  startedAt: number,
  expectedBytes: number,
  onProgress: ThroughputProgress
) {
  let receivedBytes = 0;
  let lastUpdateAt = 0;

  const emitProgress = (force = false) => {
    const now = performance.now();

    if (!force && now - lastUpdateAt < 180) {
      return;
    }

    lastUpdateAt = now;
    onProgress(
      createThroughputSample(receivedBytes, startedAt, now),
      Math.min(receivedBytes / expectedBytes, 1)
    );
  };

  if (!response.body) {
    const data = await response.arrayBuffer();
    receivedBytes = data.byteLength;
    emitProgress(true);

    return createThroughputSample(receivedBytes, startedAt);
  }

  const reader = response.body.getReader();

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    receivedBytes += value.byteLength;
    emitProgress();
  }

  emitProgress(true);

  return createThroughputSample(receivedBytes, startedAt);
}

function createUploadPayload(size: number) {
  const payload = new Uint8Array(size);

  for (let index = 0; index < size; index += 1) {
    payload[index] = (index * 17 + 23) % 256;
  }

  return payload;
}

function createThroughputSample(
  bytes: number,
  startedAt: number,
  endedAt = performance.now()
): ThroughputSample {
  const seconds = Math.max((endedAt - startedAt) / 1000, 0.001);

  return {
    bytes,
    mbps: roundMbps((bytes * 8) / seconds / 1_000_000),
    seconds,
  };
}

function average(values: number[]) {
  const total = values.reduce((sum, value) => sum + value, 0);

  return Math.max(1, Math.round(total / Math.max(values.length, 1)));
}

function calculateJitter(values: number[]) {
  if (values.length < 2) {
    return 0;
  }

  const deltas = values.slice(1).map((value, index) => Math.abs(value - values[index]));

  return average(deltas);
}

function getIdleLatency(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.min(...values);
}

function getSpeedGaugeMax(...values: number[]) {
  const highestValue = Math.max(100, ...values);

  if (highestValue <= 100) {
    return 100;
  }

  if (highestValue <= 250) {
    return 250;
  }

  if (highestValue <= 500) {
    return 500;
  }

  if (highestValue <= 1000) {
    return 1000;
  }

  return Math.ceil(highestValue / 500) * 500;
}

function getStableThroughput(samples: ThroughputSample[]) {
  if (samples.length === 0) {
    return 0;
  }

  const usableSamples = samples.length > 2 ? samples.slice(1) : samples;
  const sortedSamples = [...usableSamples].sort((first, second) => second.mbps - first.mbps);
  const selectedCount = Math.max(1, Math.ceil(sortedSamples.length * 0.6));
  const selectedSamples = sortedSamples.slice(0, selectedCount);
  const totalSpeed = selectedSamples.reduce((sum, sample) => sum + sample.mbps, 0);

  return roundMbps(totalSpeed / selectedSamples.length);
}

function classifyConnection(download: number, upload: number, ping: number): SpeedResult["quality"] {
  if (download >= 100 && upload >= 40 && ping <= 30) {
    return "Excellent";
  }

  if (download >= 50 && upload >= 15 && ping <= 60) {
    return "Good";
  }

  if (download >= 15 && upload >= 5 && ping <= 100) {
    return "Fair";
  }

  return "Slow";
}

function getModeLabel(mode: TestMode) {
  if (mode === "local") {
    return "Local benchmark";
  }

  if (mode === "remote") {
    return "Remote server";
  }

  return "Not run yet";
}

function getTargetLabel(target: TestTarget) {
  return target === "remote" ? "Remote server" : "Local benchmark";
}

function roundMbps(value: number) {
  return Math.round(value * 100) / 100;
}

function bytesToMegabytes(bytes: number) {
  return Math.round((bytes / 1_000_000) * 100) / 100;
}

function formatNumber(value: number) {
  return value >= 100 ? value.toFixed(2) : value.toFixed(value % 1 === 0 ? 0 : 2);
}

function formatInteger(value: number) {
  return String(Math.round(value));
}

function formatShortTime(value: Date) {
  let hour = value.getHours();
  const minute = value.getMinutes().toString().padStart(2, "0");
  const period = hour >= 12 ? "PM" : "AM";

  hour %= 12;
  hour = hour || 12;

  return `${hour}:${minute} ${period}`;
}

function formatTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  let hour = date.getHours();
  const minute = date.getMinutes().toString().padStart(2, "0");
  const period = hour >= 12 ? "PM" : "AM";

  hour %= 12;
  hour = hour || 12;

  return `${month} ${day}, ${year}, ${hour}:${minute} ${period}`;
}

function getPhaseLabel(phase: TestPhase) {
  if (phase === "ping") {
    return "Testing Ping";
  }

  if (phase === "download") {
    return "Testing Download";
  }

  if (phase === "upload") {
    return "Testing Upload";
  }

  return "Testing";
}
