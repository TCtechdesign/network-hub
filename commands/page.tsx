 "use client";

import { useState } from "react";
import Link from "next/link";
import { commands } from "@/data/commands";

export default function CommandsPage() {
  const [search, setSearch] = useState("");

  const filteredCommands = commands.filter((command) =>
    command.name
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-20">

        <h1 className="text-5xl font-bold">
          Commands Library
        </h1>

        <p className="mt-4 text-slate-400">
          Browse and search network commands.
        </p>

        <input
          type="text"
          placeholder="Search commands..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="
            mt-8
            w-full
            rounded-lg
            border
            border-slate-800
            bg-slate-900
            p-4
          "
        />

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {filteredCommands.map((command) => (
            <div
              key={command.slug}
              className="
                rounded-xl
                border
                border-slate-800
                bg-slate-900
                p-6
              "
            >
              <h2 className="text-2xl font-bold text-cyan-400">
                {command.name}
              </h2>

              <p className="mt-3 text-slate-400">
                {command.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {command.platforms.map((platform) => (
                  <span
                    key={platform}
                    className="
                      rounded-full
                      bg-slate-800
                      px-3
                      py-1
                      text-xs
                    "
                  >
                    {platform}
                  </span>
                ))}
              </div>

              <Link
                href={`/commands/${command.slug}`}
                className="
                  mt-6
                  inline-block
                  text-cyan-400
                "
              >
                View Details →
              </Link>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}