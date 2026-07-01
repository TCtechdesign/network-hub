"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  Copy,
  Eye,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import SiteNav from "@/components/SiteNav";
import {
  cloneToolsContent,
  createAssistantItemId,
  createToolSlug,
  toolAccentOptions,
  toolIconOptions,
  type AssistantSymptomProfile,
  type NetworkTool,
  type ToolAccent,
  type ToolIcon,
  type ToolsContent,
} from "@/data/tools";
import {
  getFirebasePublicConfig,
  signInWithFirebaseEmail,
  type FirebaseAuthSession,
} from "@/lib/firebaseRest";
import {
  readToolsContent,
  saveToolsContent,
  type ToolsReadResult,
} from "@/lib/toolsStore";

const sessionStorageKey = "network-hub-admin-firebase-session";

type StatusTone = "info" | "success" | "warning" | "error";

type Status = {
  tone: StatusTone;
  message: string;
};

type ToolField =
  | "slug"
  | "title"
  | "description"
  | "category"
  | "placeholder"
  | "example";

type ToolsAdminProps = {
  initialContent: ToolsContent;
  initialSource: ToolsReadResult["source"];
};

export default function ToolsAdmin({
  initialContent,
  initialSource,
}: ToolsAdminProps) {
  const firebaseConfig = useMemo(() => getFirebasePublicConfig(), []);
  const [content, setContent] = useState(() => cloneToolsContent(initialContent));
  const [selectedToolIndex, setSelectedToolIndex] = useState<number | null>(null);
  const [selectedSymptomIndex, setSelectedSymptomIndex] = useState(0);
  const [toolSearch, setToolSearch] = useState("");
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
      message: "Sign in with your Firebase admin user to edit tools.",
    };
  });

  const selectedTool =
    selectedToolIndex === null ? null : content.tools[selectedToolIndex] ?? null;
  const selectedSymptom =
    content.assistant.symptoms[selectedSymptomIndex] ??
    content.assistant.symptoms[0] ??
    null;
  const canWrite = Boolean(firebaseConfig.configured && session?.idToken);
  const visibleTools = useMemo(() => {
    const search = toolSearch.trim().toLowerCase();

    return content.tools
      .map((tool, index) => ({ tool, index }))
      .filter(({ tool }) =>
        [tool.title, tool.slug, tool.description, tool.category, ...tool.tags]
          .join(" ")
          .toLowerCase()
          .includes(search)
      );
  }, [content.tools, toolSearch]);

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
              ? "Signed in. Loaded saved tools from Firestore."
              : "Signed in. Starter tools are ready to save.",
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
      message: "Signed out of the tools editor.",
    });
  }

  async function loadContent(idToken = session?.idToken) {
    setIsLoading(true);

    try {
      const result = await readToolsContent(idToken);

      setContent(cloneToolsContent(result.content));
      setSelectedToolIndex(null);
      setSelectedSymptomIndex(0);
      setStatus({
        tone: result.source === "firebase" ? "success" : "info",
        message:
          result.source === "firebase"
            ? "Loaded the latest tools and assistant settings."
            : "No Firestore tools document found. Starter tools are ready to save.",
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
        message: "Sign in before saving tool changes.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const savedContent = await saveToolsContent(content, session.idToken);

      setContent(cloneToolsContent(savedContent));
      setStatus({
        tone: "success",
        message: "Saved tools and assistant settings to Firestore.",
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
    setContent(cloneToolsContent());
    setSelectedToolIndex(null);
    setSelectedSymptomIndex(0);
    setStatus({
      tone: "warning",
      message: "Starter tools restored in the form. Save to publish them.",
    });
  }

  function addTool() {
    const nextIndex = content.tools.length;
    const nextTool: NetworkTool = {
      slug: createToolSlug(`new-tool-${nextIndex + 1}`),
      title: "",
      description: "",
      category: "",
      icon: "network",
      accent: "blue",
      tags: [],
      features: [],
      placeholder: "",
      example: "",
      featured: false,
      order: getNextToolOrder(content.tools),
      wide: false,
    };

    setContent((current) => ({
      ...current,
      tools: [...current.tools, nextTool],
    }));
    setSelectedToolIndex(nextIndex);
  }

  function duplicateTool() {
    if (!selectedTool) {
      return;
    }

    const nextIndex = content.tools.length;
    const nextTool: NetworkTool = {
      ...selectedTool,
      slug: createToolSlug(`${selectedTool.slug}-copy`),
      title: selectedTool.title ? `${selectedTool.title} copy` : "",
      order: getNextToolOrder(content.tools),
      tags: [...selectedTool.tags],
      features: [...selectedTool.features],
    };

    setContent((current) => ({
      ...current,
      tools: [...current.tools, nextTool],
    }));
    setSelectedToolIndex(nextIndex);
  }

  function removeTool() {
    if (selectedToolIndex === null || content.tools.length <= 1) {
      return;
    }

    setContent((current) => ({
      ...current,
      tools: current.tools.filter((_, index) => index !== selectedToolIndex),
    }));
    setSelectedToolIndex(null);
  }

  function updateSelectedTool(patch: Partial<NetworkTool>) {
    if (selectedToolIndex === null) {
      return;
    }

    setContent((current) => ({
      ...current,
      tools: current.tools.map((tool, index) =>
        index === selectedToolIndex ? { ...tool, ...patch } : tool
      ),
    }));
  }

  function updateToolField(field: ToolField, value: string) {
    updateSelectedTool({
      [field]: field === "slug" ? createEditableSlug(value) : value,
    });
  }

  function updateToolListField(field: "tags" | "features", value: string) {
    updateSelectedTool({
      [field]: splitLines(value),
    });
  }

  function addSymptom() {
    const nextIndex = content.assistant.symptoms.length;
    const nextSymptom: AssistantSymptomProfile = {
      id: createAssistantItemId(`symptom-${nextIndex + 1}`),
      label: "",
      prompt: "",
      terms: [],
      preferredGuideSlugs: [],
      categoryBoosts: [],
      commands: [],
      checkpoints: [],
    };

    setContent((current) => ({
      ...current,
      assistant: {
        ...current.assistant,
        symptoms: [...current.assistant.symptoms, nextSymptom],
      },
    }));
    setSelectedSymptomIndex(nextIndex);
  }

  function duplicateSymptom() {
    if (!selectedSymptom) {
      return;
    }

    const nextIndex = content.assistant.symptoms.length;
    const nextSymptom: AssistantSymptomProfile = {
      ...selectedSymptom,
      id: createAssistantItemId(`${selectedSymptom.id}-copy`),
      label: selectedSymptom.label ? `${selectedSymptom.label} copy` : "",
      terms: [...selectedSymptom.terms],
      preferredGuideSlugs: [...selectedSymptom.preferredGuideSlugs],
      categoryBoosts: [...selectedSymptom.categoryBoosts],
      commands: [...selectedSymptom.commands],
      checkpoints: [...selectedSymptom.checkpoints],
    };

    setContent((current) => ({
      ...current,
      assistant: {
        ...current.assistant,
        symptoms: [...current.assistant.symptoms, nextSymptom],
      },
    }));
    setSelectedSymptomIndex(nextIndex);
  }

  function removeSymptom() {
    if (content.assistant.symptoms.length <= 1) {
      return;
    }

    const nextSymptoms = content.assistant.symptoms.filter(
      (_, index) => index !== selectedSymptomIndex
    );

    setContent((current) => ({
      ...current,
      assistant: {
        ...current.assistant,
        symptoms: nextSymptoms,
      },
    }));
    setSelectedSymptomIndex(Math.min(selectedSymptomIndex, nextSymptoms.length - 1));
  }

  function updateSelectedSymptom(patch: Partial<AssistantSymptomProfile>) {
    setContent((current) => ({
      ...current,
      assistant: {
        ...current.assistant,
        symptoms: current.assistant.symptoms.map((symptom, index) =>
          index === selectedSymptomIndex ? { ...symptom, ...patch } : symptom
        ),
      },
    }));
  }

  function updateAssistantListField(
    field: "fallbackCommands" | "fallbackCheckpoints",
    value: string
  ) {
    setContent((current) => ({
      ...current,
      assistant: {
        ...current.assistant,
        [field]: splitLines(value),
      },
    }));
  }

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <SiteNav active="tools" />

      <section
        className={`mx-auto max-w-[96rem] px-4 py-6 sm:px-6 lg:px-8 ${
          session ? "pb-28" : ""
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
          <Link href="/" className="hover:text-cyan-400">
            Home
          </Link>
          <span>/</span>
          <Link href="/admin" className="hover:text-cyan-400">
            Admin
          </Link>
          <span>/</span>
          <span>Tools</span>
        </div>

        <header className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-cyan-300">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Tools & Assistant Editor
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
              Edit tool cards, order, featured status, and Guide Assistant
              symptom mappings.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/tools"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200"
            >
              <Eye size={17} />
              View Tools
            </Link>
            <button
              type="button"
              onClick={() => void loadContent()}
              disabled={isLoading || !firebaseConfig.configured || !session}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={17} />
              ) : (
                <RefreshCw size={17} />
              )}
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void saveContent()}
              disabled={isSaving || !canWrite}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={17} />
              ) : (
                <Save size={17} />
              )}
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
                  <TextInput
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    required
                  />
                  <TextInput
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSigningIn || !firebaseConfig.configured}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {isSigningIn ? (
                    <Loader2 className="animate-spin" size={17} />
                  ) : (
                    <LogIn size={17} />
                  )}
                  Sign In
                </button>
              </form>
            )}
          </section>
        </div>

        {session ? (
          <div className="mt-6 space-y-6">
            <section className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
              <aside className="rounded-lg border border-slate-800 bg-slate-950/65 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold">Tool Cards</h2>
                  <button
                    type="button"
                    onClick={addTool}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200"
                    aria-label="Add tool"
                    title="Add tool"
                  >
                    <Plus size={17} />
                  </button>
                </div>

                <label className="relative mt-4 block">
                  <span className="sr-only">Search tools</span>
                  <input
                    type="text"
                    value={toolSearch}
                    onChange={(event) => setToolSearch(event.target.value)}
                    placeholder="Search tools..."
                    className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 pr-10 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                  />
                  <Search
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    size={16}
                  />
                </label>

                <div className="mt-4 max-h-[32rem] space-y-2 overflow-y-auto pr-1">
                  {visibleTools.map(({ tool, index }) => (
                    <button
                      key={`${tool.slug}-${index}`}
                      type="button"
                      onClick={() => setSelectedToolIndex(index)}
                      className={`block w-full rounded-lg border px-3 py-3 text-left transition ${
                        index === selectedToolIndex
                          ? "border-cyan-500/70 bg-cyan-500/10 text-cyan-100"
                          : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-200"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="block min-w-0 truncate text-sm font-semibold">
                          {tool.title.trim() || "Untitled tool"}
                        </span>
                        {tool.featured && (
                          <Star className="shrink-0 text-amber-300" size={14} />
                        )}
                      </span>
                      <span className="mt-1 block truncate text-xs text-slate-500">
                        {tool.category || "No category"} · Order {tool.order}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-5 grid gap-2">
                  <button
                    type="button"
                    onClick={duplicateTool}
                    disabled={!selectedTool}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    <Copy size={16} />
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={removeTool}
                    disabled={!selectedTool || content.tools.length <= 1}
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

              {selectedTool ? (
                <EditorSection
                  title={selectedTool.title.trim() || "Untitled tool"}
                  description="Edit the card that appears in the Tools directory."
                  icon={<Wrench size={20} />}
                  action={
                    <Link
                      href={`/tools/${selectedTool.slug}`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200"
                    >
                      <ArrowUpRight size={16} />
                      Open
                    </Link>
                  }
                >
                  <div className="grid gap-5 lg:grid-cols-2">
                    <TextInput
                      label="Tool Title"
                      value={selectedTool.title}
                      onChange={(value) => updateToolField("title", value)}
                    />
                    <TextInput
                      label="Slug"
                      value={selectedTool.slug}
                      onChange={(value) => updateToolField("slug", value)}
                    />
                    <TextInput
                      label="Category"
                      value={selectedTool.category}
                      onChange={(value) => updateToolField("category", value)}
                    />
                    <TextInput
                      label="Order"
                      type="number"
                      value={String(selectedTool.order)}
                      onChange={(value) =>
                        updateSelectedTool({ order: Number(value) || 0 })
                      }
                    />
                    <SelectInput
                      label="Icon"
                      value={selectedTool.icon}
                      options={toolIconOptions}
                      onChange={(value) =>
                        updateSelectedTool({ icon: value as ToolIcon })
                      }
                    />
                    <SelectInput
                      label="Accent"
                      value={selectedTool.accent}
                      options={toolAccentOptions}
                      onChange={(value) =>
                        updateSelectedTool({ accent: value as ToolAccent })
                      }
                    />
                    <TextInput
                      label="Placeholder"
                      value={selectedTool.placeholder}
                      onChange={(value) => updateToolField("placeholder", value)}
                    />
                    <TextInput
                      label="Example"
                      value={selectedTool.example}
                      onChange={(value) => updateToolField("example", value)}
                    />
                    <div className="lg:col-span-2">
                      <Textarea
                        label="Description"
                        rows={3}
                        value={selectedTool.description}
                        onChange={(value) =>
                          updateToolField("description", value)
                        }
                      />
                    </div>
                    <Textarea
                      label="Tags"
                      rows={5}
                      value={selectedTool.tags.join("\n")}
                      onChange={(value) => updateToolListField("tags", value)}
                    />
                    <Textarea
                      label="Features"
                      rows={5}
                      value={selectedTool.features.join("\n")}
                      onChange={(value) =>
                        updateToolListField("features", value)
                      }
                    />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <ToggleButton
                      active={selectedTool.featured}
                      label="Featured"
                      onClick={() =>
                        updateSelectedTool({ featured: !selectedTool.featured })
                      }
                    />
                    <ToggleButton
                      active={Boolean(selectedTool.wide)}
                      label="Wide Card"
                      onClick={() =>
                        updateSelectedTool({ wide: !selectedTool.wide })
                      }
                    />
                  </div>
                </EditorSection>
              ) : (
                <EmptyState
                  icon={<Wrench size={30} />}
                  title="No tool selected"
                  description="Choose a tool card from the list or add a blank one."
                  actionLabel="Add Tool"
                  onAction={addTool}
                />
              )}
            </section>

            <EditorSection
              title="Guide Assistant Settings"
              description="Edit symptom buttons, first commands, and recommended guide mappings."
              icon={<Sparkles size={20} />}
            >
              <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
                <aside>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold">Symptom Buttons</h3>
                    <button
                      type="button"
                      onClick={addSymptom}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200"
                      aria-label="Add symptom"
                      title="Add symptom"
                    >
                      <Plus size={17} />
                    </button>
                  </div>

                  <div className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto pr-1">
                    {content.assistant.symptoms.map((symptom, index) => (
                      <button
                        key={`${symptom.id}-${index}`}
                        type="button"
                        onClick={() => setSelectedSymptomIndex(index)}
                        className={`block w-full rounded-lg border px-3 py-3 text-left transition ${
                          index === selectedSymptomIndex
                            ? "border-cyan-500/70 bg-cyan-500/10 text-cyan-100"
                            : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-200"
                        }`}
                      >
                        <span className="block truncate text-sm font-semibold">
                          {symptom.label.trim() || "Untitled symptom"}
                        </span>
                        <span className="mt-1 block truncate text-xs text-slate-500">
                          {symptom.commands.length} commands ·{" "}
                          {symptom.preferredGuideSlugs.length} guides
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-2">
                    <button
                      type="button"
                      onClick={duplicateSymptom}
                      disabled={!selectedSymptom}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      <Copy size={16} />
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={removeSymptom}
                      disabled={content.assistant.symptoms.length <= 1}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 text-sm font-semibold text-slate-200 transition hover:border-red-400/70 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>
                </aside>

                <div className="space-y-6">
                  {selectedSymptom && (
                    <section className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                      <h3 className="font-semibold">
                        {selectedSymptom.label.trim() || "Untitled symptom"}
                      </h3>
                      <div className="mt-4 grid gap-5 lg:grid-cols-2">
                        <TextInput
                          label="Button Label"
                          value={selectedSymptom.label}
                          onChange={(value) =>
                            updateSelectedSymptom({ label: value })
                          }
                        />
                        <TextInput
                          label="ID"
                          value={selectedSymptom.id}
                          onChange={(value) =>
                            updateSelectedSymptom({
                              id: createEditableSlug(value),
                            })
                          }
                        />
                        <div className="lg:col-span-2">
                          <Textarea
                            label="Prompt Filled When Clicked"
                            rows={3}
                            value={selectedSymptom.prompt}
                            onChange={(value) =>
                              updateSelectedSymptom({ prompt: value })
                            }
                          />
                        </div>
                        <Textarea
                          label="Matching Terms"
                          rows={6}
                          value={selectedSymptom.terms.join("\n")}
                          onChange={(value) =>
                            updateSelectedSymptom({ terms: splitLines(value) })
                          }
                        />
                        <Textarea
                          label="Suggested First Commands"
                          rows={6}
                          value={selectedSymptom.commands.join("\n")}
                          onChange={(value) =>
                            updateSelectedSymptom({ commands: splitLines(value) })
                          }
                        />
                        <Textarea
                          label="Recommended Guide Slugs"
                          rows={6}
                          value={selectedSymptom.preferredGuideSlugs.join("\n")}
                          onChange={(value) =>
                            updateSelectedSymptom({
                              preferredGuideSlugs: splitLines(value),
                            })
                          }
                        />
                        <Textarea
                          label="Category Boosts"
                          rows={6}
                          value={selectedSymptom.categoryBoosts.join("\n")}
                          onChange={(value) =>
                            updateSelectedSymptom({
                              categoryBoosts: splitLines(value),
                            })
                          }
                        />
                        <div className="lg:col-span-2">
                          <Textarea
                            label="Checklist Items"
                            rows={5}
                            value={selectedSymptom.checkpoints.join("\n")}
                            onChange={(value) =>
                              updateSelectedSymptom({
                                checkpoints: splitLines(value),
                              })
                            }
                          />
                        </div>
                      </div>
                    </section>
                  )}

                  <section className="grid gap-5 lg:grid-cols-2">
                    <Textarea
                      label="Fallback First Commands"
                      rows={5}
                      value={content.assistant.fallbackCommands.join("\n")}
                      onChange={(value) =>
                        updateAssistantListField("fallbackCommands", value)
                      }
                    />
                    <Textarea
                      label="Fallback Checklist Items"
                      rows={5}
                      value={content.assistant.fallbackCheckpoints.join("\n")}
                      onChange={(value) =>
                        updateAssistantListField("fallbackCheckpoints", value)
                      }
                    />
                  </section>
                </div>
              </div>
            </EditorSection>
          </div>
        ) : (
          <LockedAdminState />
        )}
      </section>

      {session && (
        <FloatingSaveBar
          canWrite={canWrite}
          isLoading={isLoading}
          isSaving={isSaving}
          onRefresh={() => void loadContent()}
          onSave={() => void saveContent()}
        />
      )}
    </main>
  );
}

function EditorSection({
  action,
  children,
  description,
  icon,
  title,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  description?: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
            {icon}
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-semibold">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-slate-400">{description}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function EmptyState({
  actionLabel,
  description,
  icon,
  onAction,
  title,
}: {
  actionLabel: string;
  description: string;
  icon: React.ReactNode;
  onAction: () => void;
  title: string;
}) {
  return (
    <section className="flex min-h-[28rem] items-center justify-center rounded-lg border border-slate-800 bg-slate-950/65 p-6 text-center">
      <div className="mx-auto max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
          {icon}
        </div>
        <h2 className="mt-5 text-xl font-semibold">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          <Plus size={17} />
          {actionLabel}
        </button>
      </div>
    </section>
  );
}

function LockedAdminState() {
  return (
    <section className="mt-6 rounded-lg border border-slate-800 bg-slate-950/65 px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
        <Lock size={30} />
      </div>
      <h2 className="mt-5 text-xl font-semibold">Sign in to edit tools</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
        The tools editor stays locked until a Firebase admin user signs in.
        Visitors can still use the public tools and guides.
      </p>
    </section>
  );
}

function TextInput({
  label,
  onChange,
  required = false,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-300">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="mt-2 h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-slate-100 outline-none transition focus:border-cyan-500"
      />
    </label>
  );
}

function SelectInput<T extends readonly string[]>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: T;
  value: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-300">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
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

function Textarea({
  label,
  onChange,
  rows = 4,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  rows?: number;
  value: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-300">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="mt-2 w-full resize-y rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
      />
    </label>
  );
}

function ToggleButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition ${
        active
          ? "border-cyan-500/70 bg-cyan-500/10 text-cyan-200"
          : "border-slate-800 text-slate-300 hover:border-cyan-500/60 hover:text-cyan-200"
      }`}
    >
      {active && <Check size={15} />}
      {label}
    </button>
  );
}

function FloatingSaveBar({
  canWrite,
  isLoading,
  isSaving,
  onRefresh,
  onSave,
}: {
  canWrite: boolean;
  isLoading: boolean;
  isSaving: boolean;
  onRefresh: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-950/95 px-4 py-3 shadow-2xl backdrop-blur">
      <div className="mx-auto flex max-w-[96rem] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-400">
          Save publishes the current tool cards and assistant settings.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading || !canWrite}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <RefreshCw size={16} />
            )}
            Refresh
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || !canWrite}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Save size={16} />
            )}
            Save
          </button>
        </div>
      </div>
    </div>
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

function createEditableSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-");
}

function splitLines(value: string) {
  return value.split("\n");
}

function getNextToolOrder(tools: NetworkTool[]) {
  const highestOrder = tools.reduce(
    (highest, tool) => Math.max(highest, tool.order),
    0
  );

  return highestOrder + 10;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
