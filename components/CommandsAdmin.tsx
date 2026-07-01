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
  Terminal,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import SiteNav from "@/components/SiteNav";
import {
  cloneCommandsContent,
  commandPlatformOptions,
  commands as defaultCommands,
  createCommandSlug,
  type CommandExample,
  type CommandPlatform,
  type CommandReference,
  type CommandRelatedLink,
  type CommandsContent,
} from "@/data/commands";
import {
  getFirebasePublicConfig,
  signInWithFirebaseEmail,
  type FirebaseAuthSession,
} from "@/lib/firebaseRest";
import {
  readCommandsContent,
  saveCommandsContent,
  type CommandsReadResult,
} from "@/lib/commandsStore";

const sessionStorageKey = "network-hub-admin-firebase-session";
const allCategoriesValue = "__all_categories__";
const untitledCommandLabel = "Untitled command";
const uncategorizedLabel = "No category";

type StatusTone = "info" | "success" | "warning" | "error";

type Status = {
  tone: StatusTone;
  message: string;
};

type CommandsAdminProps = {
  initialContent: CommandsContent;
  initialSource: CommandsReadResult["source"];
};

type CommandField =
  | "slug"
  | "name"
  | "description"
  | "category"
  | "syntax"
  | "explanation";

type RelatedSection = "relatedGuides" | "relatedTools";

export default function CommandsAdmin({
  initialContent,
  initialSource,
}: CommandsAdminProps) {
  const firebaseConfig = useMemo(() => getFirebasePublicConfig(), []);
  const [content, setContent] = useState(() =>
    cloneCommandsContent(initialContent)
  );
  const [selectedCommandIndex, setSelectedCommandIndex] = useState<
    number | null
  >(null);
  const [selectedBrowseCategory, setSelectedBrowseCategory] = useState("");
  const [commandSearch, setCommandSearch] = useState("");
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
      message: "Sign in with your Firebase admin user to edit commands.",
    };
  });

  const selectedCommand =
    selectedCommandIndex === null
      ? null
      : content.commands[selectedCommandIndex] ?? null;
  const canWrite = Boolean(firebaseConfig.configured && session?.idToken);
  const categoryOptions = useMemo(
    () =>
      unique(
        [
          ...defaultCommands.map((command) => command.category),
          ...content.commands.map((command) => command.category),
          selectedCommand?.category,
          selectedBrowseCategory === allCategoriesValue
            ? undefined
            : selectedBrowseCategory,
        ].filter(isPresentString)
      ),
    [content.commands, selectedBrowseCategory, selectedCommand?.category]
  );
  const commandCountByCategory = useMemo(() => {
    return content.commands.reduce((counts, command) => {
      counts.set(command.category, (counts.get(command.category) ?? 0) + 1);
      return counts;
    }, new Map<string, number>());
  }, [content.commands]);
  const visibleCommandItems = useMemo(() => {
    const search = commandSearch.trim().toLowerCase();

    return content.commands
      .map((command, index) => ({ command, index }))
      .filter(({ command }) => {
        if (search) {
          return [
            command.name,
            command.slug,
            command.description,
            command.category,
            command.explanation,
            ...command.platforms,
          ]
            .join(" ")
            .toLowerCase()
            .includes(search);
        }

        if (!selectedBrowseCategory) {
          return false;
        }

        if (selectedBrowseCategory === allCategoriesValue) {
          return true;
        }

        return command.category === selectedBrowseCategory;
      });
  }, [commandSearch, content.commands, selectedBrowseCategory]);
  const isCommandListHidden =
    !selectedBrowseCategory && commandSearch.trim().length === 0;

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
              ? "Signed in. Loaded saved commands from Firestore."
              : "Signed in. Starter commands are ready to save.",
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
      message: "Signed out of the commands editor.",
    });
  }

  async function loadContent(idToken = session?.idToken) {
    setIsLoading(true);

    try {
      const result = await readCommandsContent(idToken);

      setContent(cloneCommandsContent(result.content));
      setSelectedCommandIndex(null);
      setSelectedBrowseCategory("");
      setStatus({
        tone: result.source === "firebase" ? "success" : "info",
        message:
          result.source === "firebase"
            ? "Loaded the latest commands."
            : "No Firestore commands document found. Starter commands are ready to save.",
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
        message: "Sign in before saving command changes.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const savedContent = await saveCommandsContent(content, session.idToken);

      setContent(cloneCommandsContent(savedContent));
      setStatus({
        tone: "success",
        message: "Saved commands to Firestore.",
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
    setContent(cloneCommandsContent());
    setSelectedCommandIndex(null);
    setSelectedBrowseCategory("");
    setStatus({
      tone: "warning",
      message: "Starter commands restored in the form. Save to publish them.",
    });
  }

  function addCommand() {
    const timestamp = new Date().toISOString();
    const nextCommand: CommandReference = {
      slug: createCommandSlug(`new-command-${content.commands.length + 1}`),
      name: "",
      description: "",
      category: "",
      platforms: [],
      syntax: "",
      explanation: "",
      examples: [],
      useCases: [],
      relatedGuides: [],
      relatedTools: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setContent((current) => ({
      ...current,
      commands: [...current.commands, nextCommand],
    }));
    setSelectedCommandIndex(content.commands.length);
    setSelectedBrowseCategory(allCategoriesValue);
  }

  function duplicateCommand() {
    if (!selectedCommand) {
      return;
    }

    const timestamp = new Date().toISOString();
    const nextCommand: CommandReference = {
      ...selectedCommand,
      slug: createCommandSlug(`${selectedCommand.slug}-copy`),
      name: `${selectedCommand.name} copy`,
      examples: selectedCommand.examples.map((example) => ({ ...example })),
      relatedGuides: selectedCommand.relatedGuides.map((link) => ({ ...link })),
      relatedTools: selectedCommand.relatedTools.map((link) => ({ ...link })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setContent((current) => ({
      ...current,
      commands: [...current.commands, nextCommand],
    }));
    setSelectedCommandIndex(content.commands.length);
    setSelectedBrowseCategory(nextCommand.category);
  }

  function removeCommand() {
    if (
      selectedCommandIndex === null ||
      !selectedCommand ||
      content.commands.length <= 1
    ) {
      return;
    }

    setContent((current) => ({
      ...current,
      commands: current.commands.filter(
        (_, index) => index !== selectedCommandIndex
      ),
    }));
    setSelectedCommandIndex(null);
  }

  function updateSelectedCommand(patch: Partial<CommandReference>) {
    if (selectedCommandIndex === null) {
      return;
    }

    setContent((current) => ({
      ...current,
      commands: current.commands.map((command, index) =>
        index === selectedCommandIndex
          ? { ...command, ...patch, updatedAt: new Date().toISOString() }
          : command
      ),
    }));
  }

  function updateCommandField(field: CommandField, value: string) {
    updateSelectedCommand({
      [field]: field === "slug" ? createEditableCommandSlug(value) : value,
    });

    if (field === "category") {
      setSelectedBrowseCategory(value);
    }
  }

  function togglePlatform(platform: CommandPlatform) {
    if (!selectedCommand) {
      return;
    }

    const hasPlatform = selectedCommand.platforms.includes(platform);
    const nextPlatforms = hasPlatform
      ? selectedCommand.platforms.filter((item) => item !== platform)
      : [...selectedCommand.platforms, platform];

    updateSelectedCommand({
      platforms: nextPlatforms.length > 0 ? nextPlatforms : [platform],
    });
  }

  function updateUseCases(value: string) {
    updateSelectedCommand({
      useCases: value.split("\n"),
    });
  }

  function updateExample(index: number, patch: Partial<CommandExample>) {
    if (!selectedCommand) {
      return;
    }

    updateSelectedCommand({
      examples: selectedCommand.examples.map((example, exampleIndex) =>
        exampleIndex === index ? { ...example, ...patch } : example
      ),
    });
  }

  function addExample() {
    if (!selectedCommand) {
      return;
    }

    const nextExample: CommandExample = {
      id: createCommandSlug(`example-${selectedCommand.examples.length + 1}`),
      label: "Example",
      command: selectedCommand.name,
      notes: "",
    };

    updateSelectedCommand({
      examples: [...selectedCommand.examples, nextExample],
    });
  }

  function removeExample(index: number) {
    if (!selectedCommand || selectedCommand.examples.length <= 1) {
      return;
    }

    updateSelectedCommand({
      examples: selectedCommand.examples.filter(
        (_, exampleIndex) => exampleIndex !== index
      ),
    });
  }

  function updateRelatedLink(
    section: RelatedSection,
    index: number,
    patch: Partial<CommandRelatedLink>
  ) {
    if (!selectedCommand) {
      return;
    }

    updateSelectedCommand({
      [section]: selectedCommand[section].map((link, linkIndex) =>
        linkIndex === index ? { ...link, ...patch } : link
      ),
    });
  }

  function addRelatedLink(section: RelatedSection) {
    if (!selectedCommand) {
      return;
    }

    const nextLink: CommandRelatedLink = {
      id: createCommandSlug(`${section}-${selectedCommand[section].length + 1}`),
      title: section === "relatedGuides" ? "Related Guide" : "Related Tool",
      href: section === "relatedGuides" ? "/guides" : "/tools",
    };

    updateSelectedCommand({
      [section]: [...selectedCommand[section], nextLink],
    });
  }

  function removeRelatedLink(section: RelatedSection, index: number) {
    if (!selectedCommand) {
      return;
    }

    updateSelectedCommand({
      [section]: selectedCommand[section].filter(
        (_, linkIndex) => linkIndex !== index
      ),
    });
  }

  function selectBrowseCategory(category: string) {
    setSelectedBrowseCategory(category);
    setCommandSearch("");
    setSelectedCommandIndex(null);
  }

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <SiteNav active="commands" />

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
          <span>Commands</span>
        </div>

        <header className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-cyan-300">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Commands Editor
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
              Add and update commands, explanations, examples, platform tags,
              use cases, and related guide or tool links.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/commands"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200"
            >
              <Eye size={17} />
              View Commands
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
          <div className="mt-6 grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
            <aside className="rounded-lg border border-slate-800 bg-slate-950/65 p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">Commands</h2>
                <button
                  type="button"
                  onClick={addCommand}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200"
                  aria-label="Add command"
                  title="Add command"
                >
                  <Plus size={17} />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <label className="block text-sm font-medium text-slate-300">
                  Browse Category
                  <select
                    value={selectedBrowseCategory}
                    onChange={(event) =>
                      selectBrowseCategory(event.target.value)
                    }
                    className="mt-2 h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500"
                  >
                    <option value="">Choose category</option>
                    <option value={allCategoriesValue}>
                      All categories ({content.commands.length})
                    </option>
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option} ({commandCountByCategory.get(option) ?? 0})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="relative block">
                  <span className="sr-only">Search commands</span>
                  <input
                    type="text"
                    value={commandSearch}
                    onChange={(event) => setCommandSearch(event.target.value)}
                    placeholder="Search all commands..."
                    className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 pr-10 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                  />
                  <Search
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    size={16}
                  />
                </label>
              </div>

              <div className="mt-4 max-h-[34rem] space-y-2 overflow-y-auto pr-1">
                {isCommandListHidden && (
                  <p className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-4 text-sm text-slate-400">
                    Choose a category to show commands, or search by name.
                  </p>
                )}

                {visibleCommandItems.map(({ command, index }) => (
                  <button
                    key={`${command.slug}-${index}`}
                    type="button"
                    onClick={() => setSelectedCommandIndex(index)}
                    className={`block w-full rounded-lg border px-3 py-3 text-left transition ${
                      index === selectedCommandIndex
                        ? "border-cyan-500/70 bg-cyan-500/10 text-cyan-100"
                        : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-200"
                    }`}
                  >
                    <span className="block truncate text-sm font-semibold">
                      {getCommandDisplayName(command)}
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-500">
                      {getCommandMeta(command)}
                    </span>
                  </button>
                ))}

                {!isCommandListHidden && visibleCommandItems.length === 0 && (
                  <p className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-4 text-sm text-slate-400">
                    {commandSearch.trim()
                      ? "No commands match that search."
                      : "No commands are in that category yet."}
                  </p>
                )}
              </div>

              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  onClick={duplicateCommand}
                  disabled={!selectedCommand}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  <Copy size={16} />
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={removeCommand}
                  disabled={!selectedCommand || content.commands.length <= 1}
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

            {selectedCommand ? (
              <section className="space-y-6">
                <EditorSection
                  title={getCommandDisplayName(selectedCommand)}
                  description={`Last saved: ${formatDate(content.updatedAt)}`}
                  icon={<Terminal size={20} />}
                  action={
                    <Link
                      href={`/commands/${selectedCommand.slug}`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200"
                    >
                      <ArrowUpRight size={16} />
                      Open
                    </Link>
                  }
                >
                  <div className="grid gap-5 lg:grid-cols-2">
                    <TextInput
                      label="Command Name"
                      value={selectedCommand.name}
                      onChange={(value) => updateCommandField("name", value)}
                    />
                    <TextInput
                      label="Slug"
                      value={selectedCommand.slug}
                      onChange={(value) => updateCommandField("slug", value)}
                    />
                    <TextInput
                      label="Category"
                      value={selectedCommand.category}
                      onChange={(value) => updateCommandField("category", value)}
                    />
                    <TextInput
                      label="Syntax"
                      value={selectedCommand.syntax}
                      onChange={(value) => updateCommandField("syntax", value)}
                    />
                    <div className="lg:col-span-2">
                      <Textarea
                        label="Short Description"
                        rows={3}
                        value={selectedCommand.description}
                        onChange={(value) =>
                          updateCommandField("description", value)
                        }
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <Textarea
                        label="Explanation"
                        rows={5}
                        value={selectedCommand.explanation}
                        onChange={(value) =>
                          updateCommandField("explanation", value)
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-medium text-slate-300">
                      Platform Tags
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {commandPlatformOptions.map((platform) => {
                        const isSelected =
                          selectedCommand.platforms.includes(platform);

                        return (
                          <button
                            key={platform}
                            type="button"
                            onClick={() => togglePlatform(platform)}
                            className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition ${
                              isSelected
                                ? "border-cyan-500/70 bg-cyan-500/10 text-cyan-200"
                                : "border-slate-800 text-slate-300 hover:border-cyan-500/60 hover:text-cyan-200"
                            }`}
                          >
                            {isSelected && <Check size={15} />}
                            {platform}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </EditorSection>

                <EditorSection
                  title="Examples"
                  description="Add command examples and notes."
                  icon={<Copy size={20} />}
                  action={
                    <button
                      type="button"
                      onClick={addExample}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200"
                    >
                      <Plus size={16} />
                      Add Example
                    </button>
                  }
                >
                  <div className="space-y-4">
                    {selectedCommand.examples.map((example, index) => (
                      <div
                        key={`${example.id}-${index}`}
                        className="rounded-lg border border-slate-800 bg-slate-950/65 p-4"
                      >
                        <CardHeader
                          title={example.label.trim() || "Example"}
                          canRemove={selectedCommand.examples.length > 1}
                          onRemove={() => removeExample(index)}
                        />
                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <TextInput
                            label="ID"
                            value={example.id}
                            onChange={(value) =>
                              updateExample(index, {
                                id: createCommandSlug(value),
                              })
                            }
                          />
                          <TextInput
                            label="Label"
                            value={example.label}
                            onChange={(value) =>
                              updateExample(index, { label: value })
                            }
                          />
                          <div className="lg:col-span-2">
                            <Textarea
                              label="Command / Output"
                              rows={5}
                              value={example.command}
                              onChange={(value) =>
                                updateExample(index, { command: value })
                              }
                            />
                          </div>
                          <div className="lg:col-span-2">
                            <Textarea
                              label="Notes"
                              rows={3}
                              value={example.notes}
                              onChange={(value) =>
                                updateExample(index, { notes: value })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </EditorSection>

                <EditorSection
                  title="Use Cases"
                  description="One use case per line."
                  icon={<Check size={20} />}
                >
                  <Textarea
                    label="Use Cases"
                    rows={6}
                    value={selectedCommand.useCases.join("\n")}
                    onChange={updateUseCases}
                  />
                </EditorSection>

                <RelatedLinksEditor
                  title="Related Guides"
                  links={selectedCommand.relatedGuides}
                  onAdd={() => addRelatedLink("relatedGuides")}
                  onRemove={(index) =>
                    removeRelatedLink("relatedGuides", index)
                  }
                  onUpdate={(index, patch) =>
                    updateRelatedLink("relatedGuides", index, patch)
                  }
                />

                <RelatedLinksEditor
                  title="Related Tools"
                  links={selectedCommand.relatedTools}
                  onAdd={() => addRelatedLink("relatedTools")}
                  onRemove={(index) =>
                    removeRelatedLink("relatedTools", index)
                  }
                  onUpdate={(index, patch) =>
                    updateRelatedLink("relatedTools", index, patch)
                  }
                />
              </section>
            ) : (
              <EmptyCommandState onAdd={addCommand} />
            )}
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

function EmptyCommandState({ onAdd }: { onAdd: () => void }) {
  return (
    <section className="flex min-h-[28rem] items-center justify-center rounded-lg border border-slate-800 bg-slate-950/65 p-6 text-center">
      <div className="mx-auto max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
          <Terminal size={30} />
        </div>
        <h2 className="mt-5 text-xl font-semibold">No command selected</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Choose a command from the list or add a blank command.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          <Plus size={17} />
          Add Command
        </button>
      </div>
    </section>
  );
}

function RelatedLinksEditor({
  links,
  onAdd,
  onRemove,
  onUpdate,
  title,
}: {
  links: CommandRelatedLink[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, patch: Partial<CommandRelatedLink>) => void;
  title: string;
}) {
  return (
    <EditorSection
      title={title}
      description="Add links by title and href."
      icon={<ArrowUpRight size={20} />}
      action={
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200"
        >
          <Plus size={16} />
          Add Link
        </button>
      }
    >
      {links.length === 0 ? (
        <p className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-4 text-sm text-slate-400">
          No links yet.
        </p>
      ) : (
        <div className="space-y-4">
          {links.map((link, index) => (
            <div
              key={`${link.id}-${index}`}
              className="rounded-lg border border-slate-800 bg-slate-950/65 p-4"
            >
              <CardHeader
                title={link.title}
                canRemove
                onRemove={() => onRemove(index)}
              />
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <TextInput
                  label="ID"
                  value={link.id}
                  onChange={(value) =>
                    onUpdate(index, { id: createCommandSlug(value) })
                  }
                />
                <TextInput
                  label="Title"
                  value={link.title}
                  onChange={(value) => onUpdate(index, { title: value })}
                />
                <TextInput
                  label="Link"
                  value={link.href}
                  onChange={(value) => onUpdate(index, { href: value })}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </EditorSection>
  );
}

function CardHeader({
  canRemove,
  onRemove,
  title,
}: {
  canRemove: boolean;
  onRemove: () => void;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="min-w-0 truncate font-semibold text-slate-100">{title}</h3>
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-200 transition hover:border-red-400/70 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-55"
        aria-label={`Remove ${title}`}
        title="Remove"
      >
        <Trash2 size={15} />
      </button>
    </div>
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

function LockedAdminState() {
  return (
    <section className="mt-6 rounded-lg border border-slate-800 bg-slate-950/65 px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
        <Lock size={30} />
      </div>
      <h2 className="mt-5 text-xl font-semibold">Sign in to edit commands</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
        The Commands editor stays locked until a Firebase admin user signs in.
        Visitors can still read the public command library.
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
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-3xl flex-col gap-3 rounded-lg border border-slate-700 bg-slate-950/95 p-3 shadow-2xl shadow-slate-950/60 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-300">Ready to publish command changes?</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
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

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function isPresentString(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getCommandDisplayName(command: CommandReference) {
  return command.name.trim() || untitledCommandLabel;
}

function getCommandMeta(command: CommandReference) {
  const category = command.category.trim() || uncategorizedLabel;
  const platforms =
    command.platforms.length > 0 ? command.platforms.join(", ") : "No platforms";

  return `${category} · ${platforms}`;
}

function createEditableCommandSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-");
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
