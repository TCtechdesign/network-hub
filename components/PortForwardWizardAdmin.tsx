"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  Copy,
  Eye,
  KeyRound,
  Lock,
  Loader2,
  LogIn,
  LogOut,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import SiteNav from "@/components/SiteNav";
import {
  clonePortForwardWizardContent,
  createPortForwardDeviceId,
  defaultPortForwardWizardContent,
  portForwardAccentOptions,
  portForwardDeviceIcons,
  type PortForwardAccent,
  type PortForwardDeviceIcon,
  type PortForwardingDevice,
  type PortForwardingRule,
  type PortForwardWizardContent,
  type PortProtocol,
} from "@/data/portForwardWizard";
import {
  getFirebasePublicConfig,
  signInWithFirebaseEmail,
  type FirebaseAuthSession,
} from "@/lib/firebaseRest";
import {
  readPortForwardWizardContent,
  savePortForwardWizardContent,
  type PortForwardWizardReadResult,
} from "@/lib/portForwardWizardStore";

const sessionStorageKey = "network-hub-admin-firebase-session";
const protocolOptions: PortProtocol[] = ["TCP", "UDP"];

type StatusTone = "info" | "success" | "warning" | "error";

type Status = {
  tone: StatusTone;
  message: string;
};

type ContentTextField =
  | "title"
  | "intro"
  | "quickSelectTitle"
  | "quickSelectHelp"
  | "emptyStateTitle"
  | "emptyStateBody"
  | "howToTitle"
  | "howToBody"
  | "safetyNotice";

type PortForwardWizardAdminProps = {
  initialContent: PortForwardWizardContent;
  initialSource: PortForwardWizardReadResult["source"];
};

export default function PortForwardWizardAdmin({
  initialContent,
  initialSource,
}: PortForwardWizardAdminProps) {
  const firebaseConfig = useMemo(() => getFirebasePublicConfig(), []);
  const [content, setContent] = useState(() =>
    clonePortForwardWizardContent(initialContent)
  );
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<FirebaseAuthSession | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<Status>(() => {
    if (!firebaseConfig.configured) {
      return {
        tone: "warning",
        message:
          "Firebase env values are missing. Add them, restart the dev server, then sign in.",
      };
    }

    return {
      tone: "info",
      message: "Sign in with your Firebase admin user to edit Port Wizard.",
    };
  });

  const selectedDevice = content.devices[selectedDeviceIndex] ?? null;
  const canWrite = Boolean(firebaseConfig.configured && session?.idToken);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const restoredSession = readStoredSession();

      if (restoredSession) {
        setSession(restoredSession);
        setEmail(restoredSession.email);
        setStatus({
          tone: initialSource === "firebase" ? "success" : "info",
          message:
            initialSource === "firebase"
              ? "Signed in. Loaded the saved Port Wizard content from Firestore."
              : "Signed in. Starter content is ready to save.",
        });
      }
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, [initialSource]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSigningIn(true);

    try {
      const nextSession = await signInWithFirebaseEmail(email, password);

      setSession(nextSession);
      storeSession(nextSession);
      setPassword("");
      setStatus({
        tone: "success",
        message: `Signed in as ${nextSession.email}.`,
      });
      await loadContent(nextSession.idToken);
    } catch (error) {
      setStatus({
        tone: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsSigningIn(false);
    }
  }

  function signOut() {
    localStorage.removeItem(sessionStorageKey);
    setSession(null);
    setPassword("");
    setStatus({
      tone: "info",
      message: "Signed out of the admin editor.",
    });
  }

  async function loadContent(idToken = session?.idToken) {
    setIsLoading(true);

    try {
      const result = await readPortForwardWizardContent(idToken);

      setContent(clonePortForwardWizardContent(result.content));
      setSelectedDeviceIndex(0);
      setStatus({
        tone: result.source === "firebase" ? "success" : "info",
        message:
          result.source === "firebase"
            ? "Loaded the latest Port Wizard content."
            : "No Firestore document found. Starter content is ready to save.",
      });
    } catch (error) {
      setStatus({
        tone: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function saveContent() {
    if (!session?.idToken) {
      setStatus({
        tone: "warning",
        message: "Sign in before saving changes.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const savedContent = await savePortForwardWizardContent(
        content,
        session.idToken
      );

      setContent(clonePortForwardWizardContent(savedContent));
      setStatus({
        tone: "success",
        message: "Saved Port Wizard content to Firestore.",
      });
    } catch (error) {
      setStatus({
        tone: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsSaving(false);
    }
  }

  function resetFormToStarter() {
    setContent(clonePortForwardWizardContent(defaultPortForwardWizardContent));
    setSelectedDeviceIndex(0);
    setStatus({
      tone: "warning",
      message: "Starter content restored in the form. Save to publish it.",
    });
  }

  function updateContentField(field: ContentTextField, value: string) {
    setContent((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function addDevice() {
    const nextDevice: PortForwardingDevice = {
      id: createPortForwardDeviceId(`device-${content.devices.length + 1}`),
      name: "New Device",
      type: "Device",
      icon: "network",
      accent: "cyan",
      defaultLocalIp: "192.168.1.50",
      notes: "",
      rules: [
        {
          protocol: "TCP",
          port: "",
          description: "",
        },
      ],
    };

    setContent((current) => ({
      ...current,
      devices: [...current.devices, nextDevice],
    }));
    setSelectedDeviceIndex(content.devices.length);
  }

  function duplicateDevice() {
    if (!selectedDevice) {
      return;
    }

    const nextDevice: PortForwardingDevice = {
      ...selectedDevice,
      id: createPortForwardDeviceId(`${selectedDevice.id}-copy`),
      name: `${selectedDevice.name} Copy`,
      rules: selectedDevice.rules.map((rule) => ({ ...rule })),
    };

    setContent((current) => ({
      ...current,
      devices: [...current.devices, nextDevice],
    }));
    setSelectedDeviceIndex(content.devices.length);
  }

  function removeDevice() {
    if (!selectedDevice || content.devices.length <= 1) {
      return;
    }

    setContent((current) => ({
      ...current,
      devices: current.devices.filter((_, index) => index !== selectedDeviceIndex),
    }));
    setSelectedDeviceIndex((current) => Math.max(0, current - 1));
  }

  function updateSelectedDevice(patch: Partial<PortForwardingDevice>) {
    setContent((current) => ({
      ...current,
      devices: current.devices.map((device, index) =>
        index === selectedDeviceIndex ? { ...device, ...patch } : device
      ),
    }));
  }

  function updateRule(ruleIndex: number, patch: Partial<PortForwardingRule>) {
    if (!selectedDevice) {
      return;
    }

    updateSelectedDevice({
      rules: selectedDevice.rules.map((rule, index) =>
        index === ruleIndex ? { ...rule, ...patch } : rule
      ),
    });
  }

  function addRule() {
    if (!selectedDevice) {
      return;
    }

    updateSelectedDevice({
      rules: [
        ...selectedDevice.rules,
        {
          protocol: "TCP",
          port: "",
          description: "",
        },
      ],
    });
  }

  function removeRule(ruleIndex: number) {
    if (!selectedDevice || selectedDevice.rules.length <= 1) {
      return;
    }

    updateSelectedDevice({
      rules: selectedDevice.rules.filter((_, index) => index !== ruleIndex),
    });
  }

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <SiteNav active="tools" />

      <section className="mx-auto max-w-[96rem] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
          <Link href="/" className="hover:text-cyan-400">
            Home
          </Link>
          <span>/</span>
          <Link href="/admin" className="hover:text-cyan-400">
            Admin
          </Link>
          <span>/</span>
          <span>Port Wizard</span>
        </div>

        <header className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-cyan-300">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Port Wizard Editor
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
              Update the published device profiles, help text, and recommended
              port rules.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/tools/port-forward-wizard"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200"
            >
              <Eye size={17} />
              View Wizard
            </Link>
            <button
              type="button"
              onClick={() => void loadContent()}
              disabled={isLoading || !firebaseConfig.configured || !session}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isLoading ? <Loader2 className="animate-spin" size={17} /> : <RefreshCw size={17} />}
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void saveContent()}
              disabled={isSaving || !canWrite}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isSaving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
              Save
            </button>
          </div>
        </header>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_28rem]">
          <StatusBanner status={status} />

          <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
            {session ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                    <ShieldCheck size={21} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      Signed in
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {session.email}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 text-sm font-semibold text-slate-200 transition hover:border-red-400/70 hover:text-red-200"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            ) : (
              <form onSubmit={(event) => void signIn(event)} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                    <KeyRound size={21} />
                  </span>
                  <div>
                    <h2 className="font-semibold">Firebase Sign In</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Use an email/password user from Firebase Auth.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Email
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="mt-2 h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-slate-100 outline-none transition focus:border-cyan-500"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-300">
                    Password
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="mt-2 h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-slate-100 outline-none transition focus:border-cyan-500"
                      required
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSigningIn || !firebaseConfig.configured}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {isSigningIn ? <Loader2 className="animate-spin" size={17} /> : <LogIn size={17} />}
                  Sign In
                </button>
              </form>
            )}
          </section>
        </div>

        {session ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
            <aside className="rounded-lg border border-slate-800 bg-slate-950/65 p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">Device Profiles</h2>
              <button
                type="button"
                onClick={addDevice}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200"
                aria-label="Add device profile"
                title="Add device profile"
              >
                <Plus size={17} />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {content.devices.map((device, index) => (
                <button
                  key={`${device.id}-${index}`}
                  type="button"
                  onClick={() => setSelectedDeviceIndex(index)}
                  className={`block w-full rounded-lg border px-3 py-3 text-left transition ${
                    index === selectedDeviceIndex
                      ? "border-cyan-500/70 bg-cyan-500/10 text-cyan-100"
                      : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-200"
                  }`}
                >
                  <span className="block truncate text-sm font-semibold">
                    {device.name}
                  </span>
                  <span className="mt-1 block truncate text-xs text-slate-500">
                    {device.rules.length} rules
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={duplicateDevice}
                disabled={!selectedDevice}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-55"
              >
                <Copy size={16} />
                Duplicate
              </button>
              <button
                type="button"
                onClick={removeDevice}
                disabled={!selectedDevice || content.devices.length <= 1}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 text-sm font-semibold text-slate-200 transition hover:border-red-400/70 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-55"
              >
                <Trash2 size={16} />
                Remove
              </button>
              <button
                type="button"
                onClick={resetFormToStarter}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 text-sm font-semibold text-slate-200 transition hover:border-amber-400/70 hover:text-amber-200"
              >
                <RotateCcw size={16} />
                Starter
              </button>
            </div>
            </aside>

            <section className="space-y-6">
            <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
              <div className="grid gap-5 lg:grid-cols-2">
                <TextInput
                  label="Title"
                  value={content.title}
                  onChange={(value) => updateContentField("title", value)}
                />
                <TextInput
                  label="Quick Select Heading"
                  value={content.quickSelectTitle}
                  onChange={(value) =>
                    updateContentField("quickSelectTitle", value)
                  }
                />
                <Textarea
                  label="Intro"
                  value={content.intro}
                  onChange={(value) => updateContentField("intro", value)}
                />
                <Textarea
                  label="Quick Select Help"
                  value={content.quickSelectHelp}
                  onChange={(value) =>
                    updateContentField("quickSelectHelp", value)
                  }
                />
                <TextInput
                  label="Empty State Title"
                  value={content.emptyStateTitle}
                  onChange={(value) =>
                    updateContentField("emptyStateTitle", value)
                  }
                />
                <Textarea
                  label="Empty State Body"
                  value={content.emptyStateBody}
                  onChange={(value) =>
                    updateContentField("emptyStateBody", value)
                  }
                />
                <TextInput
                  label="How To Title"
                  value={content.howToTitle}
                  onChange={(value) => updateContentField("howToTitle", value)}
                />
                <Textarea
                  label="How To Body"
                  value={content.howToBody}
                  onChange={(value) => updateContentField("howToBody", value)}
                />
                <div className="lg:col-span-2">
                  <Textarea
                    label="Safety Notice"
                    value={content.safetyNotice}
                    onChange={(value) =>
                      updateContentField("safetyNotice", value)
                    }
                  />
                </div>
              </div>
            </section>

            {selectedDevice && (
              <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
                <div className="flex flex-col gap-2 border-b border-slate-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {selectedDevice.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Last saved: {formatDate(content.updatedAt)}
                    </p>
                  </div>
                  <Link
                    href={`/tools/port-forward-wizard`}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200"
                  >
                    <ArrowUpRight size={16} />
                    Open
                  </Link>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-3">
                  <TextInput
                    label="Device Name"
                    value={selectedDevice.name}
                    onChange={(value) => updateSelectedDevice({ name: value })}
                  />
                  <TextInput
                    label="Device Slug"
                    value={selectedDevice.id}
                    onChange={(value) =>
                      updateSelectedDevice({
                        id: createPortForwardDeviceId(value),
                      })
                    }
                  />
                  <TextInput
                    label="Device Type"
                    value={selectedDevice.type}
                    onChange={(value) => updateSelectedDevice({ type: value })}
                  />
                  <SelectInput
                    label="Icon"
                    value={selectedDevice.icon}
                    options={portForwardDeviceIcons}
                    onChange={(value) =>
                      updateSelectedDevice({
                        icon: value as PortForwardDeviceIcon,
                      })
                    }
                  />
                  <SelectInput
                    label="Accent"
                    value={selectedDevice.accent}
                    options={portForwardAccentOptions}
                    onChange={(value) =>
                      updateSelectedDevice({
                        accent: value as PortForwardAccent,
                      })
                    }
                  />
                  <TextInput
                    label="Default Local IP"
                    value={selectedDevice.defaultLocalIp}
                    onChange={(value) =>
                      updateSelectedDevice({ defaultLocalIp: value })
                    }
                  />
                  <div className="lg:col-span-3">
                    <Textarea
                      label="Device Notes"
                      value={selectedDevice.notes}
                      onChange={(value) =>
                        updateSelectedDevice({ notes: value })
                      }
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-3">
                  <h3 className="font-semibold">Port Rules</h3>
                  <button
                    type="button"
                    onClick={addRule}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200"
                  >
                    <Plus size={16} />
                    Rule
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {selectedDevice.rules.map((rule, ruleIndex) => (
                    <div
                      key={`${rule.protocol}-${rule.port}-${ruleIndex}`}
                      className="grid gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 lg:grid-cols-[8rem_12rem_minmax(0,1fr)_2.75rem]"
                    >
                      <SelectInput
                        label="Protocol"
                        value={rule.protocol}
                        options={protocolOptions}
                        onChange={(value) =>
                          updateRule(ruleIndex, {
                            protocol: value as PortProtocol,
                          })
                        }
                      />
                      <TextInput
                        label="Port"
                        value={rule.port}
                        onChange={(value) =>
                          updateRule(ruleIndex, { port: value })
                        }
                      />
                      <TextInput
                        label="Description"
                        value={rule.description}
                        onChange={(value) =>
                          updateRule(ruleIndex, { description: value })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => removeRule(ruleIndex)}
                        disabled={selectedDevice.rules.length <= 1}
                        className="mt-7 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-700 text-slate-200 transition hover:border-red-400/70 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-55"
                        aria-label="Remove rule"
                        title="Remove rule"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
            </section>
          </div>
        ) : (
          <LockedAdminState />
        )}
      </section>
    </main>
  );
}

function LockedAdminState() {
  return (
    <section className="mt-6 rounded-lg border border-slate-800 bg-slate-950/65 px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
        <Lock size={30} />
      </div>
      <h2 className="mt-5 text-xl font-semibold">Sign in to edit</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
        The Port Wizard editor stays locked until a Firebase admin user signs
        in. The public tool remains available for visitors.
      </p>
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-slate-300">
      {label}
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-slate-100 outline-none transition focus:border-cyan-500"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-slate-300">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="mt-2 min-h-28 w-full resize-y rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
      />
    </label>
  );
}

function SelectInput<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="block text-sm font-medium text-slate-300">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="mt-2 h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-slate-100 outline-none transition focus:border-cyan-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusBanner({ status }: { status: Status }) {
  const classes: Record<StatusTone, string> = {
    info: "border-blue-500/25 bg-blue-500/10 text-blue-100",
    success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-100",
    warning: "border-amber-500/25 bg-amber-500/10 text-amber-100",
    error: "border-red-500/25 bg-red-500/10 text-red-100",
  };

  return (
    <section className={`rounded-lg border p-5 ${classes[status.tone]}`}>
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 shrink-0" size={18} />
        <p className="text-sm leading-6">{status.message}</p>
      </div>
    </section>
  );
}

function readStoredSession() {
  try {
    const rawSession = localStorage.getItem(sessionStorageKey);

    if (!rawSession) {
      return null;
    }

    const session = JSON.parse(rawSession) as FirebaseAuthSession;

    if (!session.idToken || session.expiresAt < Date.now() + 60_000) {
      localStorage.removeItem(sessionStorageKey);
      return null;
    }

    return session;
  } catch {
    localStorage.removeItem(sessionStorageKey);
    return null;
  }
}

function storeSession(session: FirebaseAuthSession) {
  localStorage.setItem(sessionStorageKey, JSON.stringify(session));
}

function formatDate(value?: string) {
  if (!value) {
    return "not saved yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "not saved yet";
  }

  return date.toLocaleString();
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
