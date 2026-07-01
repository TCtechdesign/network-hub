"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  Copy,
  Eye,
  Home,
  KeyRound,
  Loader2,
  Lock,
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
  cloneHomepageContent,
  createHomepageItemId,
  defaultHomepageContent,
  homepageCardIcons,
  type HomepageCardIcon,
  type HomepageCommandCard,
  type HomepageContent,
  type HomepageHeroContent,
  type HomepageInfoCard,
  type HomepageLinkCard,
  type HomepageRecommendedCta,
} from "@/data/homepage";
import {
  getFirebasePublicConfig,
  signInWithFirebaseEmail,
  type FirebaseAuthSession,
} from "@/lib/firebaseRest";
import {
  readHomepageContent,
  saveHomepageContent,
  type HomepageReadResult,
} from "@/lib/homepageStore";

const sessionStorageKey = "network-hub-admin-firebase-session";

type StatusTone = "info" | "success" | "warning" | "error";

type Status = {
  tone: StatusTone;
  message: string;
};

type HomepageAdminProps = {
  initialContent: HomepageContent;
  initialSource: HomepageReadResult["source"];
};

type HomepageTextField =
  | "featuredGuidesTitle"
  | "featuredToolsEyebrow"
  | "featuredToolsTitle"
  | "popularCommandsTitle"
  | "recommendedCardsTitle";

type LinkSection = "featuredGuides" | "featuredTools";

const linkSectionLabels: Record<LinkSection, string> = {
  featuredGuides: "Featured Guides",
  featuredTools: "Featured Tools",
};

export default function HomepageAdmin({
  initialContent,
  initialSource,
}: HomepageAdminProps) {
  const firebaseConfig = useMemo(() => getFirebasePublicConfig(), []);
  const [content, setContent] = useState(() =>
    cloneHomepageContent(initialContent)
  );
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
      message: "Sign in with your Firebase admin user to edit the homepage.",
    };
  });

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
              ? "Signed in. Loaded saved homepage content from Firestore."
              : "Signed in. Starter homepage content is ready to save.",
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
      message: "Signed out of the homepage editor.",
    });
  }

  async function loadContent(idToken = session?.idToken) {
    setIsLoading(true);

    try {
      const result = await readHomepageContent(idToken);

      setContent(cloneHomepageContent(result.content));
      setStatus({
        tone: result.source === "firebase" ? "success" : "info",
        message:
          result.source === "firebase"
            ? "Loaded the latest homepage content."
            : "No Firestore homepage document found. Starter content is ready to save.",
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
        message: "Sign in before saving homepage changes.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const savedContent = await saveHomepageContent(content, session.idToken);

      setContent(cloneHomepageContent(savedContent));
      setStatus({
        tone: "success",
        message: "Saved homepage content to Firestore.",
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
    setContent(cloneHomepageContent(defaultHomepageContent));
    setStatus({
      tone: "warning",
      message: "Starter homepage content restored in the form. Save to publish it.",
    });
  }

  function updateHeroField(field: keyof HomepageHeroContent, value: string) {
    setContent((current) => ({
      ...current,
      hero: {
        ...current.hero,
        [field]: value,
      },
    }));
  }

  function updateTextField(field: HomepageTextField, value: string) {
    setContent((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateRecommendedCtaField(
    field: keyof HomepageRecommendedCta,
    value: string
  ) {
    setContent((current) => ({
      ...current,
      recommendedCta: {
        ...current.recommendedCta,
        [field]: value,
      },
    }));
  }

  function updateLinkCard(
    section: LinkSection,
    index: number,
    patch: Partial<HomepageLinkCard>
  ) {
    setContent((current) => ({
      ...current,
      [section]: current[section].map((card, cardIndex) =>
        cardIndex === index ? { ...card, ...patch } : card
      ),
    }));
  }

  function addLinkCard(section: LinkSection) {
    const label = linkSectionLabels[section];
    const nextCard: HomepageLinkCard = {
      id: createHomepageItemId(`${section}-${content[section].length + 1}`),
      title: `New ${label} Card`,
      description: "Short homepage card description.",
      href: section === "featuredTools" ? "/tools" : "/guides",
      icon: section === "featuredTools" ? "search" : "book-open",
      actionLabel: section === "featuredTools" ? "Explore" : "Open Guide",
    };

    setContent((current) => ({
      ...current,
      [section]: [...current[section], nextCard],
    }));
  }

  function duplicateLinkCard(section: LinkSection, index: number) {
    const source = content[section][index];

    if (!source) {
      return;
    }

    const nextCard: HomepageLinkCard = {
      ...source,
      id: createHomepageItemId(`${source.id}-copy`),
      title: `${source.title} Copy`,
    };

    setContent((current) => ({
      ...current,
      [section]: [...current[section], nextCard],
    }));
  }

  function removeLinkCard(section: LinkSection, index: number) {
    if (content[section].length <= 1) {
      return;
    }

    setContent((current) => ({
      ...current,
      [section]: current[section].filter((_, cardIndex) => cardIndex !== index),
    }));
  }

  function updateCommandCard(
    index: number,
    patch: Partial<HomepageCommandCard>
  ) {
    setContent((current) => ({
      ...current,
      popularCommands: current.popularCommands.map((card, cardIndex) =>
        cardIndex === index ? { ...card, ...patch } : card
      ),
    }));
  }

  function addCommandCard() {
    const nextCommand: HomepageCommandCard = {
      id: createHomepageItemId(`command-${content.popularCommands.length + 1}`),
      name: "command",
      description: "Popular network command.",
      href: "/commands",
      copyText: "command",
    };

    setContent((current) => ({
      ...current,
      popularCommands: [...current.popularCommands, nextCommand],
    }));
  }

  function duplicateCommandCard(index: number) {
    const source = content.popularCommands[index];

    if (!source) {
      return;
    }

    const nextCommand: HomepageCommandCard = {
      ...source,
      id: createHomepageItemId(`${source.id}-copy`),
      name: `${source.name} copy`,
    };

    setContent((current) => ({
      ...current,
      popularCommands: [...current.popularCommands, nextCommand],
    }));
  }

  function removeCommandCard(index: number) {
    if (content.popularCommands.length <= 1) {
      return;
    }

    setContent((current) => ({
      ...current,
      popularCommands: current.popularCommands.filter(
        (_, cardIndex) => cardIndex !== index
      ),
    }));
  }

  function updateInfoCard(index: number, patch: Partial<HomepageInfoCard>) {
    setContent((current) => ({
      ...current,
      recommendedCards: current.recommendedCards.map((card, cardIndex) =>
        cardIndex === index ? { ...card, ...patch } : card
      ),
    }));
  }

  function addInfoCard() {
    const nextCard: HomepageInfoCard = {
      id: createHomepageItemId(
        `recommended-${content.recommendedCards.length + 1}`
      ),
      title: "New Recommended Card",
      description: "Short recommendation description.",
      icon: "shapes",
    };

    setContent((current) => ({
      ...current,
      recommendedCards: [...current.recommendedCards, nextCard],
    }));
  }

  function duplicateInfoCard(index: number) {
    const source = content.recommendedCards[index];

    if (!source) {
      return;
    }

    const nextCard: HomepageInfoCard = {
      ...source,
      id: createHomepageItemId(`${source.id}-copy`),
      title: `${source.title} Copy`,
    };

    setContent((current) => ({
      ...current,
      recommendedCards: [...current.recommendedCards, nextCard],
    }));
  }

  function removeInfoCard(index: number) {
    if (content.recommendedCards.length <= 1) {
      return;
    }

    setContent((current) => ({
      ...current,
      recommendedCards: current.recommendedCards.filter(
        (_, cardIndex) => cardIndex !== index
      ),
    }));
  }

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <SiteNav active="home" />

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
          <span>Homepage</span>
        </div>

        <header className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-cyan-300">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Homepage Editor
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
              Update hero copy, featured guide cards, featured tools, popular
              commands, and recommendation cards.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200"
            >
              <Eye size={17} />
              View Homepage
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
            <EditorSection
              title="Hero"
              icon={<Home size={20} />}
              description={`Last saved: ${formatDate(content.updatedAt)}`}
            >
              <div className="grid gap-5 lg:grid-cols-2">
                <TextInput
                  label="Eyebrow"
                  value={content.hero.eyebrow}
                  onChange={(value) => updateHeroField("eyebrow", value)}
                />
                <TextInput
                  label="Headline"
                  value={content.hero.title}
                  onChange={(value) => updateHeroField("title", value)}
                />
                <TextInput
                  label="Highlighted Headline"
                  value={content.hero.highlightedTitle}
                  onChange={(value) =>
                    updateHeroField("highlightedTitle", value)
                  }
                />
                <TextInput
                  label="Primary Button Label"
                  value={content.hero.primaryCtaLabel}
                  onChange={(value) =>
                    updateHeroField("primaryCtaLabel", value)
                  }
                />
                <TextInput
                  label="Primary Button Link"
                  value={content.hero.primaryCtaHref}
                  onChange={(value) => updateHeroField("primaryCtaHref", value)}
                />
                <TextInput
                  label="Secondary Button Label"
                  value={content.hero.secondaryCtaLabel}
                  onChange={(value) =>
                    updateHeroField("secondaryCtaLabel", value)
                  }
                />
                <TextInput
                  label="Secondary Button Link"
                  value={content.hero.secondaryCtaHref}
                  onChange={(value) =>
                    updateHeroField("secondaryCtaHref", value)
                  }
                />
                <div className="lg:col-span-2">
                  <Textarea
                    label="Subtext"
                    rows={3}
                    value={content.hero.intro}
                    onChange={(value) => updateHeroField("intro", value)}
                  />
                </div>
              </div>
            </EditorSection>

            <LinkCardSection
              title="Featured Guides"
              sectionTitle={content.featuredGuidesTitle}
              sectionTitleLabel="Section Title"
              items={content.featuredGuides}
              onSectionTitleChange={(value) =>
                updateTextField("featuredGuidesTitle", value)
              }
              onAdd={() => addLinkCard("featuredGuides")}
              onDuplicate={(index) => duplicateLinkCard("featuredGuides", index)}
              onRemove={(index) => removeLinkCard("featuredGuides", index)}
              onUpdate={(index, patch) =>
                updateLinkCard("featuredGuides", index, patch)
              }
            />

            <LinkCardSection
              title="Featured Tools"
              eyebrow={content.featuredToolsEyebrow}
              sectionTitle={content.featuredToolsTitle}
              sectionTitleLabel="Section Title"
              items={content.featuredTools}
              onEyebrowChange={(value) =>
                updateTextField("featuredToolsEyebrow", value)
              }
              onSectionTitleChange={(value) =>
                updateTextField("featuredToolsTitle", value)
              }
              onAdd={() => addLinkCard("featuredTools")}
              onDuplicate={(index) => duplicateLinkCard("featuredTools", index)}
              onRemove={(index) => removeLinkCard("featuredTools", index)}
              onUpdate={(index, patch) =>
                updateLinkCard("featuredTools", index, patch)
              }
            />

            <CommandCardSection
              title={content.popularCommandsTitle}
              items={content.popularCommands}
              onTitleChange={(value) =>
                updateTextField("popularCommandsTitle", value)
              }
              onAdd={addCommandCard}
              onDuplicate={duplicateCommandCard}
              onRemove={removeCommandCard}
              onUpdate={updateCommandCard}
            />

            <InfoCardSection
              title={content.recommendedCardsTitle}
              items={content.recommendedCards}
              onTitleChange={(value) =>
                updateTextField("recommendedCardsTitle", value)
              }
              onAdd={addInfoCard}
              onDuplicate={duplicateInfoCard}
              onRemove={removeInfoCard}
              onUpdate={updateInfoCard}
            />

            <EditorSection
              title="Recommended CTA"
              icon={<ArrowUpRight size={20} />}
              description="Bottom callout text, link, and image."
            >
              <div className="grid gap-5 lg:grid-cols-2">
                <TextInput
                  label="Title"
                  value={content.recommendedCta.title}
                  onChange={(value) => updateRecommendedCtaField("title", value)}
                />
                <TextInput
                  label="Button Label"
                  value={content.recommendedCta.ctaLabel}
                  onChange={(value) =>
                    updateRecommendedCtaField("ctaLabel", value)
                  }
                />
                <TextInput
                  label="Button Link"
                  value={content.recommendedCta.ctaHref}
                  onChange={(value) =>
                    updateRecommendedCtaField("ctaHref", value)
                  }
                />
                <TextInput
                  label="Image Path"
                  value={content.recommendedCta.imageSrc}
                  onChange={(value) =>
                    updateRecommendedCtaField("imageSrc", value)
                  }
                />
                <TextInput
                  label="Image Alt"
                  value={content.recommendedCta.imageAlt}
                  onChange={(value) =>
                    updateRecommendedCtaField("imageAlt", value)
                  }
                />
                <div className="lg:col-span-2">
                  <Textarea
                    label="Description"
                    rows={3}
                    value={content.recommendedCta.description}
                    onChange={(value) =>
                      updateRecommendedCtaField("description", value)
                    }
                  />
                </div>
              </div>
            </EditorSection>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={resetFormToStarter}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/70 hover:text-amber-200"
              >
                <RotateCcw size={16} />
                Starter
              </button>
            </div>
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

function LinkCardSection({
  eyebrow,
  items,
  onAdd,
  onDuplicate,
  onEyebrowChange,
  onRemove,
  onSectionTitleChange,
  onUpdate,
  sectionTitle,
  sectionTitleLabel,
  title,
}: {
  eyebrow?: string;
  items: HomepageLinkCard[];
  onAdd: () => void;
  onDuplicate: (index: number) => void;
  onEyebrowChange?: (value: string) => void;
  onRemove: (index: number) => void;
  onSectionTitleChange: (value: string) => void;
  onUpdate: (index: number, patch: Partial<HomepageLinkCard>) => void;
  sectionTitle: string;
  sectionTitleLabel: string;
  title: string;
}) {
  return (
    <EditorSection
      title={title}
      icon={<ArrowUpRight size={20} />}
      description={`${items.length} ${items.length === 1 ? "card" : "cards"}`}
      action={
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200"
        >
          <Plus size={16} />
          Add
        </button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {onEyebrowChange && (
          <TextInput
            label="Eyebrow"
            value={eyebrow ?? ""}
            onChange={onEyebrowChange}
          />
        )}
        <TextInput
          label={sectionTitleLabel}
          value={sectionTitle}
          onChange={onSectionTitleChange}
        />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {items.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="rounded-lg border border-slate-800 bg-slate-950/65 p-4"
          >
            <CardActions
              title={item.title}
              canRemove={items.length > 1}
              onDuplicate={() => onDuplicate(index)}
              onRemove={() => onRemove(index)}
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextInput
                label="ID"
                value={item.id}
                onChange={(value) =>
                  onUpdate(index, { id: createHomepageItemId(value) })
                }
              />
              <TextInput
                label="Title"
                value={item.title}
                onChange={(value) => onUpdate(index, { title: value })}
              />
              <TextInput
                label="Link"
                value={item.href}
                onChange={(value) => onUpdate(index, { href: value })}
              />
              <TextInput
                label="Action Label"
                value={item.actionLabel}
                onChange={(value) => onUpdate(index, { actionLabel: value })}
              />
              <SelectInput
                label="Icon"
                value={item.icon}
                options={[...homepageCardIcons]}
                onChange={(value) =>
                  onUpdate(index, { icon: value as HomepageCardIcon })
                }
              />
              <div className="sm:col-span-2">
                <Textarea
                  label="Description"
                  rows={3}
                  value={item.description}
                  onChange={(value) => onUpdate(index, { description: value })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </EditorSection>
  );
}

function CommandCardSection({
  items,
  onAdd,
  onDuplicate,
  onRemove,
  onTitleChange,
  onUpdate,
  title,
}: {
  items: HomepageCommandCard[];
  onAdd: () => void;
  onDuplicate: (index: number) => void;
  onRemove: (index: number) => void;
  onTitleChange: (value: string) => void;
  onUpdate: (index: number, patch: Partial<HomepageCommandCard>) => void;
  title: string;
}) {
  return (
    <EditorSection
      title="Popular Commands"
      icon={<Copy size={20} />}
      description={`${items.length} ${items.length === 1 ? "command" : "commands"}`}
      action={
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200"
        >
          <Plus size={16} />
          Add
        </button>
      }
    >
      <TextInput label="Section Title" value={title} onChange={onTitleChange} />

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {items.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="rounded-lg border border-slate-800 bg-slate-950/65 p-4"
          >
            <CardActions
              title={item.name}
              canRemove={items.length > 1}
              onDuplicate={() => onDuplicate(index)}
              onRemove={() => onRemove(index)}
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextInput
                label="ID"
                value={item.id}
                onChange={(value) =>
                  onUpdate(index, { id: createHomepageItemId(value) })
                }
              />
              <TextInput
                label="Command Name"
                value={item.name}
                onChange={(value) => onUpdate(index, { name: value })}
              />
              <TextInput
                label="Link"
                value={item.href}
                onChange={(value) => onUpdate(index, { href: value })}
              />
              <TextInput
                label="Copy Text"
                value={item.copyText}
                onChange={(value) => onUpdate(index, { copyText: value })}
              />
              <div className="sm:col-span-2">
                <Textarea
                  label="Description"
                  rows={3}
                  value={item.description}
                  onChange={(value) => onUpdate(index, { description: value })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </EditorSection>
  );
}

function InfoCardSection({
  items,
  onAdd,
  onDuplicate,
  onRemove,
  onTitleChange,
  onUpdate,
  title,
}: {
  items: HomepageInfoCard[];
  onAdd: () => void;
  onDuplicate: (index: number) => void;
  onRemove: (index: number) => void;
  onTitleChange: (value: string) => void;
  onUpdate: (index: number, patch: Partial<HomepageInfoCard>) => void;
  title: string;
}) {
  return (
    <EditorSection
      title="Recommended Cards"
      icon={<ArrowUpRight size={20} />}
      description={`${items.length} ${items.length === 1 ? "card" : "cards"}`}
      action={
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200"
        >
          <Plus size={16} />
          Add
        </button>
      }
    >
      <TextInput label="Section Title" value={title} onChange={onTitleChange} />

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {items.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="rounded-lg border border-slate-800 bg-slate-950/65 p-4"
          >
            <CardActions
              title={item.title}
              canRemove={items.length > 1}
              onDuplicate={() => onDuplicate(index)}
              onRemove={() => onRemove(index)}
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextInput
                label="ID"
                value={item.id}
                onChange={(value) =>
                  onUpdate(index, { id: createHomepageItemId(value) })
                }
              />
              <TextInput
                label="Title"
                value={item.title}
                onChange={(value) => onUpdate(index, { title: value })}
              />
              <SelectInput
                label="Icon"
                value={item.icon}
                options={[...homepageCardIcons]}
                onChange={(value) =>
                  onUpdate(index, { icon: value as HomepageCardIcon })
                }
              />
              <div className="sm:col-span-2">
                <Textarea
                  label="Description"
                  rows={3}
                  value={item.description}
                  onChange={(value) => onUpdate(index, { description: value })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </EditorSection>
  );
}

function CardActions({
  canRemove,
  onDuplicate,
  onRemove,
  title,
}: {
  canRemove: boolean;
  onDuplicate: () => void;
  onRemove: () => void;
  title: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="min-w-0 truncate font-semibold text-slate-100">{title}</h3>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDuplicate}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200"
          aria-label={`Duplicate ${title}`}
          title="Duplicate"
        >
          <Copy size={15} />
        </button>
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
          <div>
            <h2 className="font-semibold">{title}</h2>
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
      <h2 className="mt-5 text-xl font-semibold">Sign in to edit homepage</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
        The Homepage editor stays locked until a Firebase admin user signs in.
        Visitors can still use the public homepage.
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

function SelectInput({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
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
      <p className="text-sm text-slate-300">Ready to publish homepage changes?</p>
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
