"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
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
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import SiteNav from "@/components/SiteNav";
import { guideCategoryNames } from "@/data/guideCategories";
import type { Guide } from "@/data/guides";
import {
  cloneGuidesContent,
  createGuideSlug,
  readGuidesContent,
  saveGuidesContent,
  type GuidesContent,
  type GuidesReadResult,
} from "@/lib/guidesStore";
import {
  getFirebasePublicConfig,
  signInWithFirebaseEmail,
  type FirebaseAuthSession,
} from "@/lib/firebaseRest";

const sessionStorageKey = "network-hub-admin-firebase-session";
const allCategoriesValue = "__all_categories__";

type StatusTone = "info" | "success" | "warning" | "error";

type Status = {
  tone: StatusTone;
  message: string;
};

type GuideField =
  | "slug"
  | "title"
  | "category"
  | "difficulty"
  | "readTime"
  | "description"
  | "content";

type GuidesAdminProps = {
  initialContent: GuidesContent;
  initialSource: GuidesReadResult["source"];
};

export default function GuidesAdmin({
  initialContent,
  initialSource,
}: GuidesAdminProps) {
  const firebaseConfig = useMemo(() => getFirebasePublicConfig(), []);
  const [content, setContent] = useState(() => cloneGuidesContent(initialContent));
  const [selectedGuideIndex, setSelectedGuideIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [guideSearch, setGuideSearch] = useState("");
  const [selectedBrowseCategory, setSelectedBrowseCategory] = useState("");
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
      message: "Sign in with your Firebase admin user to edit guides.",
    };
  });

  const selectedGuide = content.guides[selectedGuideIndex] ?? null;
  const canWrite = Boolean(firebaseConfig.configured && session?.idToken);
  const categoryOptions = useMemo(
    () =>
      unique(
        [
          ...guideCategoryNames,
          ...content.guides.map((guide) => guide.category),
          selectedGuide?.category,
          selectedBrowseCategory === allCategoriesValue
            ? undefined
            : selectedBrowseCategory,
        ].filter(isPresentString)
      ),
    [content.guides, selectedBrowseCategory, selectedGuide?.category]
  );
  const guideCountByCategory = useMemo(() => {
    return content.guides.reduce((counts, guide) => {
      counts.set(guide.category, (counts.get(guide.category) ?? 0) + 1);
      return counts;
    }, new Map<string, number>());
  }, [content.guides]);
  const visibleGuideItems = useMemo(() => {
    const search = guideSearch.trim().toLowerCase();

    return content.guides
      .map((guide, index) => ({ guide, index }))
      .filter(({ guide }) => {
        if (search) {
          return [guide.title, guide.category, guide.slug]
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

        return guide.category === selectedBrowseCategory;
      });
  }, [content.guides, guideSearch, selectedBrowseCategory]);
  const isGuideListHidden =
    !selectedBrowseCategory && guideSearch.trim().length === 0;

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
              ? "Signed in. Loaded saved guides from Firestore."
              : "Signed in. Starter guides are ready to save.",
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
      message: "Signed out of the guides editor.",
    });
  }

  async function loadContent(idToken = session?.idToken) {
    setIsLoading(true);

    try {
      const result = await readGuidesContent(idToken);

      setContent(cloneGuidesContent(result.content));
      setSelectedGuideIndex(0);
      setSelectedBrowseCategory("");
      setStatus({
        tone: result.source === "firebase" ? "success" : "info",
        message:
          result.source === "firebase"
            ? "Loaded the latest guides."
            : "No Firestore guides document found. Starter guides are ready to save.",
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
        message: "Sign in before saving guide changes.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const savedContent = await saveGuidesContent(content, session.idToken);

      setContent(cloneGuidesContent(savedContent));
      setStatus({
        tone: "success",
        message: "Saved guides to Firestore.",
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
    setContent(cloneGuidesContent());
    setSelectedGuideIndex(0);
    setSelectedBrowseCategory("");
    setStatus({
      tone: "warning",
      message: "Starter guides restored in the form. Save to publish them.",
    });
  }

  function addGuide() {
    const timestamp = new Date().toISOString();
    const nextGuide: Guide = {
      slug: createGuideSlug(`new-guide-${content.guides.length + 1}`),
      title: "New Guide",
      category: "Troubleshooting",
      difficulty: "Beginner",
      readTime: "5 min",
      description: "Short guide summary.",
      content: "New Guide\n\nAdd guide content here.",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setContent((current) => ({
      ...current,
      guides: [...current.guides, nextGuide],
    }));
    setSelectedGuideIndex(content.guides.length);
    setSelectedBrowseCategory(nextGuide.category);
  }

  function duplicateGuide() {
    if (!selectedGuide) {
      return;
    }

    const timestamp = new Date().toISOString();
    const nextGuide: Guide = {
      ...selectedGuide,
      slug: createGuideSlug(`${selectedGuide.slug}-copy`),
      title: `${selectedGuide.title} Copy`,
      image: selectedGuide.image ? { ...selectedGuide.image } : undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setContent((current) => ({
      ...current,
      guides: [...current.guides, nextGuide],
    }));
    setSelectedGuideIndex(content.guides.length);
    setSelectedBrowseCategory(nextGuide.category);
  }

  function removeGuide() {
    if (!selectedGuide || content.guides.length <= 1) {
      return;
    }

    const remainingGuides = content.guides.filter(
      (_, index) => index !== selectedGuideIndex
    );
    const nextGuideIndex = Math.min(
      selectedGuideIndex,
      remainingGuides.length - 1
    );

    setContent((current) => ({
      ...current,
      guides: current.guides.filter((_, index) => index !== selectedGuideIndex),
    }));
    setSelectedGuideIndex(nextGuideIndex);
    setSelectedBrowseCategory(remainingGuides[nextGuideIndex]?.category ?? "");
  }

  function updateSelectedGuide(patch: Partial<Guide>) {
    setContent((current) => ({
      ...current,
      guides: current.guides.map((guide, index) =>
        index === selectedGuideIndex
          ? { ...guide, ...patch, updatedAt: new Date().toISOString() }
          : guide
      ),
    }));
  }

  function updateGuideField(field: GuideField, value: string) {
    updateSelectedGuide({
      [field]: field === "slug" ? createGuideSlug(value) : value,
    });

    if (field === "category") {
      setSelectedBrowseCategory(value);
    }
  }

  function selectBrowseCategory(category: string) {
    setSelectedBrowseCategory(category);
    setGuideSearch("");

    if (!category) {
      return;
    }

    const nextGuideIndex = content.guides.findIndex(
      (guide) =>
        category === allCategoriesValue || guide.category === category
    );

    if (nextGuideIndex >= 0) {
      setSelectedGuideIndex(nextGuideIndex);
    }
  }

  function updateImageField(field: "src" | "alt" | "caption", value: string) {
    if (!selectedGuide) {
      return;
    }

    const currentImage = selectedGuide.image ?? {
      src: "",
      alt: "",
      caption: "",
    };

    updateSelectedGuide({
      image: {
        ...currentImage,
        [field]: value,
      },
    });
  }

  function clearImage() {
    updateSelectedGuide({
      image: undefined,
    });
  }

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <SiteNav active="guides" />

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
          <span>Guides</span>
        </div>

        <header className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-cyan-300">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Guides Editor
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
              Update guide titles, categories, hero images, summaries, and full
              guide body content.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/guides"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200"
            >
              <Eye size={17} />
              View Guides
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
                <h2 className="font-semibold">Guides</h2>
                <button
                  type="button"
                  onClick={addGuide}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200"
                  aria-label="Add guide"
                  title="Add guide"
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
                      All categories ({content.guides.length})
                    </option>
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option} ({guideCountByCategory.get(option) ?? 0})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="relative block">
                  <span className="sr-only">Search guides</span>
                  <input
                    type="text"
                    value={guideSearch}
                    onChange={(event) => setGuideSearch(event.target.value)}
                    placeholder="Search all guides..."
                    className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 pr-10 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                  />
                  <Search
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    size={16}
                  />
                </label>
              </div>

              <div className="mt-4 max-h-[34rem] space-y-2 overflow-y-auto pr-1">
                {isGuideListHidden && (
                  <p className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-4 text-sm text-slate-400">
                    Choose a category to show its guides, or search by title.
                  </p>
                )}

                {visibleGuideItems.map(({ guide, index }) => (
                  <button
                    key={`${guide.slug}-${index}`}
                    type="button"
                    onClick={() => setSelectedGuideIndex(index)}
                    className={`block w-full rounded-lg border px-3 py-3 text-left transition ${
                      index === selectedGuideIndex
                        ? "border-cyan-500/70 bg-cyan-500/10 text-cyan-100"
                        : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-200"
                    }`}
                  >
                    <span className="block truncate text-sm font-semibold">
                      {guide.title}
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-500">
                      {guide.category} · {guide.readTime}
                    </span>
                    {guide.createdAt && (
                      <span className="mt-1 block truncate text-xs text-slate-600">
                        Added {formatShortDate(guide.createdAt)}
                      </span>
                    )}
                  </button>
                ))}

                {!isGuideListHidden && visibleGuideItems.length === 0 && (
                  <p className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-4 text-sm text-slate-400">
                    {guideSearch.trim()
                      ? "No guides match that search."
                      : "No guides are in that category yet."}
                  </p>
                )}
              </div>

              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  onClick={duplicateGuide}
                  disabled={!selectedGuide}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  <Copy size={16} />
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={removeGuide}
                  disabled={!selectedGuide || content.guides.length <= 1}
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

            {selectedGuide && (
              <section className="space-y-6">
                <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
                  <div className="flex flex-col gap-2 border-b border-slate-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">
                        {selectedGuide.title}
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Added: {formatDate(selectedGuide.createdAt)} · Edited:{" "}
                        {formatDate(selectedGuide.updatedAt)} · Last saved:{" "}
                        {formatDate(content.updatedAt)}
                      </p>
                    </div>
                    <Link
                      href={`/guides/${selectedGuide.slug}`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200"
                    >
                      <ArrowUpRight size={16} />
                      Open
                    </Link>
                  </div>

                  <div className="mt-5 grid gap-5 lg:grid-cols-2">
                    <TextInput
                      label="Title"
                      value={selectedGuide.title}
                      onChange={(value) => updateGuideField("title", value)}
                    />
                    <TextInput
                      label="Slug"
                      value={selectedGuide.slug}
                      onChange={(value) => updateGuideField("slug", value)}
                    />
                    <SelectInput
                      label="Category"
                      value={selectedGuide.category}
                      options={categoryOptions}
                      onChange={(value) => updateGuideField("category", value)}
                    />
                    <TextInput
                      label="Difficulty"
                      value={selectedGuide.difficulty}
                      onChange={(value) =>
                        updateGuideField("difficulty", value)
                      }
                    />
                    <TextInput
                      label="Read Time"
                      value={selectedGuide.readTime}
                      onChange={(value) => updateGuideField("readTime", value)}
                    />
                    <div className="lg:col-span-2">
                      <Textarea
                        label="Description"
                        rows={3}
                        value={selectedGuide.description}
                        onChange={(value) =>
                          updateGuideField("description", value)
                        }
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold">Hero Image</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Use paths from `public`, like `/images/dns.png`.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearImage}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 text-sm font-semibold text-slate-200 transition hover:border-red-400/70 hover:text-red-200"
                    >
                      <Trash2 size={16} />
                      Clear
                    </button>
                  </div>

                  <div className="mt-5 grid gap-5 lg:grid-cols-3">
                    <TextInput
                      label="Image Path"
                      value={selectedGuide.image?.src ?? ""}
                      onChange={(value) => updateImageField("src", value)}
                    />
                    <TextInput
                      label="Image Alt"
                      value={selectedGuide.image?.alt ?? ""}
                      onChange={(value) => updateImageField("alt", value)}
                    />
                    <TextInput
                      label="Caption"
                      value={selectedGuide.image?.caption ?? ""}
                      onChange={(value) => updateImageField("caption", value)}
                    />
                  </div>
                </section>

                <section className="rounded-lg border border-slate-800 bg-slate-950/65 p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                      <BookOpen size={20} />
                    </span>
                    <div>
                      <h3 className="font-semibold">Guide Body</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Plain text headings, bullets, commands, checkboxes, and
                        `[image:/path|alt|caption]` markers are supported.
                      </p>
                    </div>
                  </div>

                  <Textarea
                    label="Content"
                    rows={28}
                    value={selectedGuide.content}
                    onChange={(value) => updateGuideField("content", value)}
                    className="font-mono text-sm"
                  />
                </section>
              </section>
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

function LockedAdminState() {
  return (
    <section className="mt-6 rounded-lg border border-slate-800 bg-slate-950/65 px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
        <Lock size={30} />
      </div>
      <h2 className="mt-5 text-xl font-semibold">Sign in to edit guides</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
        The Guides editor stays locked until a Firebase admin user signs in.
        Visitors can still read the public guides.
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
  className = "",
  label,
  rows = 4,
  value,
  onChange,
}: {
  className?: string;
  label: string;
  rows?: number;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mt-5 block text-sm font-medium text-slate-300">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className={`mt-2 w-full resize-y rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-slate-100 outline-none transition focus:border-cyan-500 ${className}`}
      />
    </label>
  );
}

function SelectInput({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
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
      <p className="text-sm text-slate-300">Ready to publish guide changes?</p>
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

function formatShortDate(value?: string) {
  if (!value) {
    return "not saved";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "not saved";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function isPresentString(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
