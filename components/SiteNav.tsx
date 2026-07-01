"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { type MouseEvent, useState } from "react";

type NavSection = "home" | "commands" | "guides" | "tools" | "ports";

type SiteNavProps = {
  active?: NavSection;
};

const navItems: { label: string; href: string; section: NavSection }[] = [
  { label: "Home", href: "/", section: "home" },
  { label: "Commands", href: "/commands", section: "commands" },
  { label: "Guides", href: "/guides", section: "guides" },
  { label: "Tools", href: "/tools", section: "tools" },
  { label: "Ports", href: "/ports", section: "ports" },
];

function desktopLinkClass(isActive: boolean) {
  return `rounded-md px-2 py-1 text-sm transition ${
    isActive ? "text-cyan-400" : "text-slate-200 hover:text-cyan-400"
  }`;
}

function mobileLinkClass(isActive: boolean) {
  return `block rounded-lg px-4 py-3 text-base transition ${
    isActive
      ? "bg-blue-600/30 text-cyan-300"
      : "text-slate-200 hover:bg-slate-900 hover:text-cyan-400"
  }`;
}

export default function SiteNav({ active }: SiteNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = "site-mobile-navigation";

  function closeMobileMenu(
    event: MouseEvent<HTMLAnchorElement>,
    section: NavSection
  ) {
    if (section === active) {
      event.preventDefault();
    }

    setIsOpen(false);
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between py-4">
          <Link
            href="/"
            className="group relative inline-flex h-11 w-40 shrink-0 items-center overflow-hidden rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 sm:w-48"
            onClick={() => setIsOpen(false)}
            aria-label="Network Hub home"
          >
            <span className="sr-only">Network Hub</span>
            <Image
              src="/images/logo.png"
              alt=""
              fill
              sizes="12rem"
              unoptimized
              className="object-cover object-[50%_69%] transition duration-200 group-hover:brightness-125"
            />
          </Link>

          <div className="hidden items-center gap-6 md:flex lg:gap-8">
            {navItems.map((item) => (
              <Link
                key={item.section}
                href={item.href}
                className={desktopLinkClass(active === item.section)}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 text-slate-200 transition hover:border-cyan-500 hover:text-cyan-400 md:hidden"
            aria-controls={menuId}
            aria-expanded={isOpen}
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setIsOpen((current) => !current)}
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {isOpen && (
          <div id={menuId} className="pb-4 md:hidden">
            <div className="rounded-lg border border-slate-800 bg-slate-950/95 p-2 shadow-xl">
              {navItems.map((item) => (
                <Link
                  key={item.section}
                  href={item.href}
                  className={mobileLinkClass(active === item.section)}
                  onClick={(event) => closeMobileMenu(event, item.section)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
