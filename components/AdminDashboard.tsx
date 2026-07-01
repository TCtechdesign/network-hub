"use client";

import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  Cable,
  ChevronRight,
  Home,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  ShieldCheck,
  Settings2,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import SiteNav from "@/components/SiteNav";
import {
  getFirebasePublicConfig,
  signInWithFirebaseEmail,
  type FirebaseAuthSession,
} from "@/lib/firebaseRest";

const sessionStorageKey = "network-hub-admin-firebase-session";

type StatusTone = "info" | "success" | "warning" | "error";

type Status = {
  tone: StatusTone;
  message: string;
};

type AdminItem = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

const adminItems: AdminItem[] = [
  {
    title: "Homepage",
    description:
      "Edit hero copy, featured guides, featured tools, and homepage cards.",
    href: "/admin/homepage",
    icon: Home,
  },
  {
    title: "Commands",
    description:
      "Add commands and edit explanations, examples, platforms, and related links.",
    href: "/admin/commands",
    icon: Terminal,
  },
  {
    title: "Tools & Assistant",
    description:
      "Edit tool cards, featured order, symptom buttons, commands, and guide mappings.",
    href: "/admin/tools",
    icon: Settings2,
  },
  {
    title: "Port Wizard",
    description: "Edit port forwarding device profiles and recommended rules.",
    href: "/admin/port-forward-wizard",
    icon: Cable,
  },
  {
    title: "Guides",
    description: "Edit guide titles, categories, images, summaries, and content.",
    href: "/admin/guides",
    icon: BookOpen,
  },
];

export default function AdminDashboard() {
  const firebaseConfig = useMemo(() => getFirebasePublicConfig(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<FirebaseAuthSession | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
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
      message: "Sign in with your admin to open the dashboard.",
    };
  });

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const restoredSession = readStoredSession();

      if (restoredSession) {
        setSession(restoredSession);
        setEmail(restoredSession.email);
        setStatus({
          tone: "success",
          message: `Signed in as ${restoredSession.email}.`,
        });
      }

      setIsRestoring(false);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, []);

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
      message: "Signed out of the admin dashboard.",
    });
  }

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <SiteNav active="tools" />

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
          <Link href="/" className="hover:text-cyan-400">
            Home
          </Link>
          <ChevronRight size={15} />
          <span>Admin</span>
        </div>

        {session ? (
          <AdminHome session={session} onSignOut={signOut} />
        ) : (
          <LoginScreen
            email={email}
            firebaseConfigured={firebaseConfig.configured}
            isRestoring={isRestoring}
            isSigningIn={isSigningIn}
            password={password}
            status={status}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={signIn}
          />
        )}
      </section>
    </main>
  );
}

function LoginScreen({
  email,
  firebaseConfigured,
  isRestoring,
  isSigningIn,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  password,
  status,
}: {
  email: string;
  firebaseConfigured: boolean;
  isRestoring: boolean;
  isSigningIn: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  password: string;
  status: Status;
}) {
  return (
    <div className="mx-auto mt-10 max-w-xl">
      <section className="rounded-lg border border-slate-800 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/20">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
            <Lock size={24} />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase text-cyan-300">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Sign in to continue
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              The admin dashboard stays hidden until your Firebase account is
              signed in.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <StatusBanner status={status} />
        </div>

        {isRestoring ? (
          <div className="mt-6 flex items-center justify-center gap-3 rounded-lg border border-slate-800 bg-slate-950 px-4 py-8 text-sm text-slate-300">
            <Loader2 className="animate-spin text-cyan-300" size={18} />
            Checking saved sign-in
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                <KeyRound size={21} />
              </span>
              <div>
                <h2 className="font-semibold">Firebase Sign In</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Use your email/password user from Firebase Auth.
                </p>
              </div>
            </div>

            <TextInput
              label="Email"
              type="email"
              value={email}
              onChange={onEmailChange}
              required
            />
            <TextInput
              label="Password"
              type="password"
              value={password}
              onChange={onPasswordChange}
              required
            />

            <button
              type="submit"
              disabled={isSigningIn || !firebaseConfigured}
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
  );
}

function AdminHome({
  onSignOut,
  session,
}: {
  onSignOut: () => void;
  session: FirebaseAuthSession;
}) {
  return (
    <>
      <header className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-cyan-300">Admin</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Network Hub Admin
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
            Choose an area to update.
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/65 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                <ShieldCheck size={21} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  Signed in
                </p>
                <p className="mt-1 text-sm text-slate-400">{session.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 text-sm font-semibold text-slate-200 transition hover:border-red-400/70 hover:text-red-200"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {adminItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-lg border border-slate-800 bg-slate-950/65 p-5 transition hover:-translate-y-1 hover:border-cyan-500/70"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                <Icon size={24} />
              </span>
              <h2 className="mt-5 text-xl font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {item.description}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition group-hover:text-cyan-200">
                Open Editor
                <ChevronRight size={16} />
              </span>
            </Link>
          );
        })}
      </div>
    </>
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

function StatusBanner({ status }: { status: Status }) {
  const classes: Record<StatusTone, string> = {
    info: "border-cyan-500/30 bg-cyan-500/10 text-cyan-100",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-100",
    error: "border-red-500/30 bg-red-500/10 text-red-100",
  };

  return (
    <section className={`rounded-lg border p-4 ${classes[status.tone]}`}>
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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Try again.";
}
