"use client";

import { useMemo, useState } from "react";

export function MovieTitleInput() {
  const [title, setTitle] = useState("");

  const tmdbSearchUrl = useMemo(() => {
    const query = encodeURIComponent(title.trim());
    return `https://www.themoviedb.org/search?query=${query}`;
  }, [title]);

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        name="title"
        placeholder="Title"
        required
        value={title}
        onChange={(event) => setTitle(event.currentTarget.value)}
        className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-xs"
      />
      <a
        href={tmdbSearchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="whitespace-nowrap rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100"
      >
        Find on TMDB
      </a>
    </div>
  );
}
