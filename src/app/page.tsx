import Link from "next/link";
import Image from "next/image";

import { SiteHeader } from "@/components/SiteHeader";
import { formatReleaseDate } from "@/lib/formatReleaseDate";
import { supabasePublic } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type HistoricalRow = { rank: number; movie: string; total: number };

const SUMMER_2023_TOP_15: HistoricalRow[] = [
  { rank: 1, movie: "Barbie", total: 526.4 },
  { rank: 2, movie: "SpiderMan: Across the Spiderverse", total: 317 },
  { rank: 3, movie: "Guardians of the Galaxy Vol. 3", total: 304.7 },
  { rank: 4, movie: "Oppenheimer", total: 264.2 },
  { rank: 5, movie: "Little Mermaid", total: 253 },
  { rank: 6, movie: "Indiana Jones & the Dial of Destiny", total: 158.8 },
  { rank: 7, movie: "Mission Impossible 7", total: 151 },
  { rank: 8, movie: "Fast X", total: 138 },
  { rank: 9, movie: "Transformers: Rise of the Beasts", total: 136.1 },
  { rank: 10, movie: "Elemental", total: 109.1 },
  { rank: 11, movie: "The Flash", total: 105.1 },
  { rank: 12, movie: "Teenage Mutant Ninja Turtles", total: 88.2 },
  { rank: 13, movie: "Insidious: The Red Door", total: 78.1 },
  { rank: 14, movie: "Meg 2: The Trench", total: 66.5 },
  { rank: 15, movie: "The Haunted Mansion", total: 58.8 },
];

const SUMMER_2024_TOP_15: HistoricalRow[] = [
  { rank: 1, movie: "Deadpool & Wolverine", total: 545.8 },
  { rank: 2, movie: "Inside Out 2", total: 534.3 },
  { rank: 3, movie: "Despicable Me 4", total: 291.3 },
  { rank: 4, movie: "Twisters", total: 222.3 },
  { rank: 5, movie: "Bad Boys 4", total: 165.2 },
  { rank: 6, movie: "Kingdom of the Planet of the Apes", total: 140.1 },
  { rank: 7, movie: "It Ends With Us", total: 133.7 },
  { rank: 8, movie: "A Quiet Place: Day One", total: 127.6 },
  { rank: 9, movie: "Alien Romulus", total: 97.2 },
  { rank: 10, movie: "IF", total: 93.3 },
  { rank: 11, movie: "The Garfield Movie", total: 78.5 },
  { rank: 12, movie: "The Fall Guy", total: 73.9 },
  { rank: 13, movie: "Furiosa", total: 63.1 },
  { rank: 14, movie: "Trap", total: 38.5 },
  { rank: 15, movie: "Horizon Chapter 1", total: 28.5 },
];

const SUMMER_2025_TOP_15: HistoricalRow[] = [
  { rank: 1, movie: "Lilo & Stitch", total: 366 },
  { rank: 2, movie: "Superman", total: 316 },
  { rank: 3, movie: "Jurassic Rebirth", total: 301.7 },
  { rank: 4, movie: "Fantastic Four", total: 230.7 },
  { rank: 5, movie: "How to Train Your Dragon", total: 224 },
  { rank: 6, movie: "Thunderbolts", total: 192 },
  { rank: 7, movie: "Mission Impossible", total: 166 },
  { rank: 8, movie: "F1", total: 153.9 },
  { rank: 9, movie: "Weapons", total: 135.2 },
  { rank: 10, movie: "Final Destination", total: 123 },
  { rank: 11, movie: "Freakier Friday", total: 82.6 },
  { rank: 12, movie: "28 Years Later", total: 65.7 },
  { rank: 13, movie: "Elio", total: 63.8 },
  { rank: 14, movie: "Bad Guys 2", total: 57.2 },
  { rank: 15, movie: "Ballerina", total: 55 },
];

const SUMMER_2022_TOP_15: HistoricalRow[] = [
  { rank: 1, movie: "Top Gun Maverick", total: 466.1 },
  { rank: 2, movie: "Jurassic World Dominion", total: 332.2 },
  { rank: 3, movie: "Thor: Love & Thunder", total: 301.6 },
  { rank: 4, movie: "Minions: The Rise of Gru", total: 297.8 },
  { rank: 5, movie: "Lightyear", total: 112.3 },
  { rank: 6, movie: "NOPE", total: 107.5 },
  { rank: 7, movie: "Elvis", total: 106.6 },
  { rank: 8, movie: "Bullet Train", total: 78.2 },
  { rank: 9, movie: "The Black Phone", total: 72.1 },
  { rank: 10, movie: "DC: League of Super Pets", total: 67.3 },
  { rank: 11, movie: "Where The Crawdads Sing", total: 64.6 },
  { rank: 12, movie: "Bob's Burgers", total: 30 },
  { rank: 13, movie: "Beast", total: 20 },
  { rank: 14, movie: "Paws of Fury", total: 17.5 },
  { rank: 15, movie: "Bodies Bodies Bodies", total: 9.7 },
];

const PAST_WINNERS = [
  { year: "2025", name: "Kunal Sengupta", image: "/IkeAdler.png" },
  { year: "2024", name: "Jesse Brooks", image: "/JakePerlmutter.png" },
];

function HistoricalTableCard({ title, rows }: { title: string; rows: HistoricalRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-dodger-blue-dark/25 bg-white shadow-md">
      <h3 className="px-3 py-3 text-center font-sans text-2xl font-bold text-dodger-blue sm:text-3xl">
        {title}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col style={{ width: "32px" }} />
            <col />
            <col style={{ width: "64px" }} />
          </colgroup>
          <thead className="bg-dodger-blue text-[#0f172a]">
            <tr>
              <th className="px-2 py-2 text-center font-semibold">Rank</th>
              <th className="px-2 py-2 text-center font-semibold">Movie</th>
              <th className="px-2 py-2 text-center font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={`${title}-${row.rank}`}
                className={i % 2 === 0 ? "bg-[#f8fafc]" : "bg-white"}
              >
                <td className="border-t border-dodger-blue-light/60 px-2 py-1.5 text-center tabular-nums text-dodger-blue-dark">
                  {row.rank}
                </td>
                <td className="border-t border-dodger-blue-light/60 px-2 py-1.5 text-left text-sm font-normal leading-tight text-slate-700 line-clamp-2 break-words">
                  {row.movie}
                </td>
                <td className="border-t border-dodger-blue-light/60 px-2 py-1.5 text-right text-sm tabular-nums text-slate-700">
                  {row.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type StandingRow = {
  player_id: string;
  player_name: string;
  total_score: number;
};

type MovieRow = {
  id: string;
  title: string;
  release_date: string;
  opening_weekend_gross: number | null;
  total_gross_millions: number | null;
  status: string | null;
  poster_url: string | null;
};

type PickWithMovieRow = {
  player_id: string;
  movie_id: string;
  rank: number | null;
  is_alternate: boolean | null;
  movies: { title: string; status: string | null } | null;
};

function formatScore(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function formatMillions(value: number | null) {
  if (value === null) return "—";
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}M`;
}

export default async function Home() {
  const lockDateRaw = process.env.LOCK_DATE;
  const lockDate = lockDateRaw ? new Date(lockDateRaw) : null;
  const isPostLaunch = lockDate ? new Date() >= lockDate : false;

  if (!isPostLaunch) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-700">
        <SiteHeader currentPath="/" />
        <header className="bg-dodger-blue px-4 py-4 shadow-[inset_0_-4px_0_0_rgba(0,51,102,0.35)] sm:px-6 sm:py-6">
          <div className="relative w-full overflow-hidden rounded-lg">
            <Image
              src="/banner.png"
              alt="Phony Box Office Game — Summer 2026"
              width={1920}
              height={500}
              className="h-auto w-full"
              priority
            />
          </div>
        </header>

        <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16">
          <div className="flex justify-center">
            <Image
              src="/Minion.png"
              alt="Minion"
              width={1920}
              height={419}
              className="h-auto w-full max-w-[600px]"
            />
          </div>
          <section className="rounded-xl border border-dodger-blue-dark/15 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-center text-base font-bold uppercase tracking-wide text-dodger-blue-dark">
              What is this game?
            </h2>
            <p className="text-base leading-relaxed text-slate-700">
              This is a competition where you try to predict the top fifteen movies of the Summer of
              2026. The films in your list must be released between May 22nd and August 31st.
            </p>
          </section>

          <section className="rounded-xl border border-dodger-blue-dark/15 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-center text-base font-bold uppercase tracking-wide text-dodger-blue-dark">
              What are the rules?
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-slate-700">
              <li>
                <strong>Domestic Box Office Only!</strong>
              </li>
              <li>
                <strong>Must be Theatrical Release</strong> (obviously)
              </li>
              <li>
                Box Office figures keep accumulating until <strong>October 1st</strong>.{" "}
                <span className="italic">(Last year we only counted the first four weeks.)</span>
              </li>
              <li>Pick one alternate movie in case one of your films gets bumped.</li>
              <li>
                See last year&apos;s example below for an idea how this all works (attached below).
              </li>
            </ul>
          </section>

          <section className="rounded-xl border border-dodger-blue-dark/15 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-center text-base font-bold uppercase tracking-wide text-dodger-blue-dark">
              How is it scored?
            </h2>
            <div className="space-y-3 text-base leading-relaxed text-slate-700">
              <p>
                Your list is weighted with a multiplier. The higher you rank a movie, the higher the
                multiplier. You can reference last year&apos;s score sheet,{" "}
                <a
                  href="/2025-scoresheet.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-inline-body"
                >
                  linked below
                </a>
                .
              </p>
              <p className="font-medium text-dodger-blue-dark">In other words:</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  Your movie at the #1 spot receives a <strong>15×</strong> multiplier.
                </li>
                <li>
                  Your movie at the #2 spot receives a <strong>14×</strong> multiplier.
                </li>
                <li>
                  … down to your #15 spot at <strong>1×</strong> multiplier.
                </li>
              </ul>
              <p>
                So if you rank <em>The Odyssey</em> in the 1st spot and it makes $200M this summer,
                its total point value on your list is <strong>3,000</strong> ($200M × 15).
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-dodger-blue-dark/15 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-center text-base font-bold uppercase tracking-wide text-dodger-blue-dark">
              What do I win?
            </h2>
            <p className="text-base leading-relaxed text-slate-700">
              This is a friendly competition for Phony employees. There is no entry fee. The more people that play, the more competitive it gets! 🙂
            </p>
          </section>

          <section className="rounded-xl border border-dodger-blue-dark/15 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-center text-base font-bold uppercase tracking-wide text-dodger-blue-dark">
              What now?
            </h2>
            <p className="mb-4 text-base leading-relaxed text-slate-700">
              Do your research. Here is the{" "}
              <a
                href="https://www.firstshowing.net/schedule2026/#may"
                target="_blank"
                rel="noopener noreferrer"
                className="link-inline-body"
              >
                release calendar
              </a>
              . I&apos;ve put all the possible selections in a{" "}
              <Link
                href="/movies"
                className="link-inline-body"
              >
                list for you
              </Link>
              . Look at limited releases, total screens, historical numbers.
              <br />
              You must submit your list by May 21st EOD!
            </p>
            <Link
              href="/submit"
              className="flex w-full items-center justify-center rounded-lg bg-dodger-red px-5 py-3.5 text-center text-base font-bold text-white shadow-sm transition hover:brightness-110 sm:py-4 sm:text-lg"
            >
              Make Your List
            </Link>
          </section>

          <section className="rounded-xl border border-dodger-blue-dark/15 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-center text-base font-bold uppercase tracking-wide text-dodger-blue-dark">
              Last year&apos;s scoresheet
            </h2>
            <a
              href="/2025-scoresheet.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-lg border-2 border-dodger-blue-dark bg-dodger-blue-light/40 px-4 py-3 text-center text-base font-bold text-dodger-blue-dark transition hover:bg-dodger-blue-light/70"
            >
              View 2025 Scoresheet (PDF)
            </a>
          </section>

          <section className="space-y-4">
            <h2 className="text-center text-base font-bold uppercase tracking-wide text-dodger-blue-dark">
              Historical top movies
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <HistoricalTableCard title="SUMMER 25" rows={SUMMER_2025_TOP_15} />
              <HistoricalTableCard title="SUMMER 24" rows={SUMMER_2024_TOP_15} />
              <HistoricalTableCard title="SUMMER 23" rows={SUMMER_2023_TOP_15} />
              <HistoricalTableCard title="SUMMER 22" rows={SUMMER_2022_TOP_15} />
            </div>
          </section>

          <section className="rounded-xl border border-dodger-blue-dark/15 bg-white p-5 shadow-sm">
            <h2 className="mb-6 text-center text-xl font-bold uppercase tracking-wide text-dodger-blue-dark">
              Past Winners!
            </h2>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {PAST_WINNERS.map((winner) => (
                <div key={winner.year} className="flex flex-col items-center text-center">
                  <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-dodger-blue shadow-md">
                    <Image
                      src={winner.image}
                      alt={winner.name}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  </div>
                  <div className="mt-3 text-2xl font-bold text-dodger-red">{winner.year}</div>
                  <div className="mt-1 text-base font-semibold text-dodger-blue-dark">{winner.name}</div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  const supabase = supabasePublic();

  const [
    { data: moviesData, error: moviesError },
    { data: playersData, error: playersError },
  ] =
    await Promise.all([
      supabase
        .from("movies")
        .select("id, title, release_date, opening_weekend_gross, total_gross_millions, status, poster_url")
        .neq("status", "cancelled")
        .order("release_date", { ascending: true })
        .order("title", { ascending: true }),
      supabase.from("players").select("id, name"),
    ]);

  if (moviesError) {
    throw new Error(`Failed to load movies: ${moviesError.message}`);
  }
  if (playersError) {
    throw new Error(`Failed to load players: ${playersError.message}`);
  }

  const movies = (moviesData ?? []) as MovieRow[];
  const players = (playersData ?? []) as { id: string; name: string | null }[];
  const alphabetizedPlayers = [...players].sort((a, b) =>
    (a.name ?? "").localeCompare(b.name ?? "", "en-US")
  );

  const movieTotals = new Map<string, number | null>();
  for (const movie of movies) {
    movieTotals.set(movie.id, movie.total_gross_millions ?? null);
  }

  const picksWithMoviesResult = await supabase
    .from("picks")
    .select("player_id, movie_id, rank, is_alternate, movies(title, status)");
  if (picksWithMoviesResult.error) {
    throw new Error(`Failed to load picks details: ${picksWithMoviesResult.error.message}`);
  }
  const picksWithMovies = (picksWithMoviesResult.data ?? []) as unknown as PickWithMovieRow[];
  const picksByPlayer = new Map<string, PickWithMovieRow[]>();
  for (const pick of picksWithMovies) {
    const existing = picksByPlayer.get(pick.player_id) ?? [];
    existing.push(pick);
    picksByPlayer.set(pick.player_id, existing);
  }

  const standings: StandingRow[] = players.map((player) => {
    const playerPicks = picksByPlayer.get(player.id) ?? [];
    const ranked = playerPicks.filter((pick) => !pick.is_alternate && pick.rank !== null);
    let totalScore = 0;
    for (const pick of ranked) {
      const gross = movieTotals.get(pick.movie_id) ?? null;
      if (gross !== null) {
        const multiplier = 16 - (pick.rank as number);
        totalScore += gross * multiplier;
      }
    }
    return {
      player_id: String(player.id),
      player_name: (player.name ?? "Unknown player").trim(),
      total_score: Math.round(totalScore * 100) / 100,
    };
  }).sort((a, b) => b.total_score - a.total_score);

  const standingsByPlayerId = new Map(
    standings.map((row) => [row.player_id, row] as const)
  );

  const hasAnyMovieTotals = movies.some((movie) => movieTotals.get(movie.id) !== null);
  const sortedMovies = [...movies].sort((a, b) => {
    if (!hasAnyMovieTotals) {
      return a.release_date.localeCompare(b.release_date);
    }
    const aTotal = movieTotals.get(a.id) ?? -1;
    const bTotal = movieTotals.get(b.id) ?? -1;
    if (bTotal !== aTotal) {
      return bTotal - aTotal;
    }
    return a.release_date.localeCompare(b.release_date);
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-700">
      <SiteHeader currentPath="/" />
      <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-5">
        <div className="w-full overflow-hidden rounded-lg">
          <Image
            src="/banner.png"
            alt="Phony Box Office Game — Summer 2026"
            width={1920}
            height={500}
            className="h-auto w-full"
            priority
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <section className="rounded-2xl border border-dodger-blue-dark/15 bg-white p-3 shadow-sm md:col-span-2">
            <h2 className="mb-2 text-center text-lg font-bold text-dodger-blue">
              Film Releases
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed text-sm">
                <colgroup>
                  <col />
                  <col className="w-[8.5rem]" />
                  <col className="w-[9rem]" />
                  <col className="w-[8.5rem]" />
                </colgroup>
                <thead className="bg-dodger-blue text-[#0f172a]">
                  <tr>
                    <th className="px-3 py-1.5 text-left font-semibold">Title</th>
                    <th className="whitespace-nowrap px-3 py-1.5 text-left font-semibold">Release Date</th>
                    <th className="whitespace-nowrap px-3 py-1.5 text-right font-semibold">Opening Weekend</th>
                    <th className="whitespace-nowrap px-3 py-1.5 text-right font-semibold">Total Gross</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMovies.map((movie, index) => (
                    <tr key={movie.id} className={index % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"}>
                      <td className="border-t border-dodger-blue-light px-3 py-1.5 font-medium text-dodger-blue-dark">
                        {movie.title}
                      </td>
                      <td className="whitespace-nowrap border-t border-dodger-blue-light px-3 py-1.5">
                        {formatReleaseDate(movie.release_date)}
                      </td>
                      <td className="border-t border-dodger-blue-light px-3 py-1.5 text-right tabular-nums">
                        {formatMillions(movie.opening_weekend_gross)}
                      </td>
                      <td className="border-t border-dodger-blue-light px-3 py-1.5 text-right tabular-nums">
                        {formatMillions(movieTotals.get(movie.id) ?? movie.opening_weekend_gross ?? null)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="flex flex-col rounded-2xl border border-dodger-red/30 bg-white p-3 shadow-sm md:col-span-1">
            <h2 className="mb-2 text-center text-lg font-bold text-dodger-red">Standings</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-dodger-red text-white">
                  <tr>
                    <th className="px-3 py-1.5 text-left font-semibold">Rank</th>
                    <th className="px-3 py-1.5 text-left font-semibold">Player</th>
                    <th className="px-3 py-1.5 text-right font-semibold">Total Score</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, index) => (
                    <tr
                      key={row.player_id || `${row.player_name}-${index}`}
                      className={index % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"}
                    >
                      <td className="border-t border-dodger-red/20 px-3 py-1.5 font-semibold tabular-nums text-dodger-red">
                        {index + 1}
                      </td>
                      <td className="border-t border-dodger-red/20 px-3 py-1.5">
                        <Link
                          href={`/players/${encodeURIComponent(row.player_name)}`}
                          className="font-medium text-dodger-red underline-offset-2 hover:underline"
                        >
                          {row.player_name}
                        </Link>
                      </td>
                      <td className="border-t border-dodger-red/20 px-3 py-1.5 text-right font-semibold tabular-nums">
                        {formatScore(row.total_score)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-auto w-full pt-4">
              <Image
                src="/prize.png"
                alt="Prize breakdown"
                width={1200}
                height={1200}
                className="h-auto w-full"
              />
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-dodger-blue-dark/15 bg-white p-3 shadow-sm">
          <h2 className="mb-2 text-center text-lg font-semibold text-dodger-blue-dark">
            Player Lists
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {alphabetizedPlayers.map((player) => {
              const playerName = (player.name ?? "Unknown player").trim();
              const standing = standingsByPlayerId.get(player.id);
              const totalScore = standing?.total_score ?? 0;
              const playerPicks = picksByPlayer.get(player.id) ?? [];
              const ranked = playerPicks
                .filter((pick) => !pick.is_alternate && pick.rank !== null)
                .sort((a, b) => (a.rank as number) - (b.rank as number));
              const alternate = playerPicks.find((pick) => Boolean(pick.is_alternate));

              const rows = [
                ...ranked.map((pick) => ({ ...pick, displayRank: pick.rank as number })),
                ...(alternate ? [{ ...alternate, displayRank: "ALT" as const }] : []),
              ];

              return (
                <div
                  key={`${player.id}-details`}
                  className="rounded border border-dodger-blue-dark/15 bg-white"
                >
                  <div className="px-3 py-2 text-sm font-medium text-dodger-blue-dark">
                    {playerName} · {formatScore(totalScore)}
                  </div>
                  <div className="border-t border-dodger-blue-light p-3">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead className="bg-dodger-blue text-[#0f172a]">
                          <tr>
                            <th className="px-3 py-1.5 text-left font-semibold">Rank</th>
                            <th className="px-3 py-1.5 text-left font-semibold">Movie</th>
                            <th className="whitespace-nowrap px-3 py-1.5 text-right font-semibold">
                              Box Office
                            </th>
                            <th className="whitespace-nowrap px-3 py-1.5 text-right font-semibold">
                              Multiplier
                            </th>
                            <th className="whitespace-nowrap px-3 py-1.5 text-right font-semibold">
                              Score
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((pick, index) => {
                            const isAlt = pick.displayRank === "ALT";
                            const multiplier = isAlt ? null : 16 - (pick.rank as number);
                            const totalGross = movieTotals.get(pick.movie_id) ?? null;
                            const score =
                              totalGross === null || multiplier === null
                                ? null
                                : Math.round(totalGross * multiplier * 100) / 100;
                            return (
                              <tr
                                key={`${player.id}-${pick.movie_id}-${String(pick.displayRank)}`}
                                className={index % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"}
                              >
                                <td className="border-t border-dodger-blue-light px-3 py-1.5 font-semibold tabular-nums">
                                  {pick.displayRank}
                                </td>
                                <td
                                  className="max-w-[14rem] border-t border-dodger-blue-light px-3 py-1.5"
                                  title={pick.movies?.title ?? "Unknown movie"}
                                >
                                  <span className="block truncate">
                                    {pick.movies?.title ?? "Unknown movie"}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap border-t border-dodger-blue-light px-3 py-1.5 text-right tabular-nums">
                                  {formatMillions(totalGross)}
                                </td>
                                <td className="whitespace-nowrap border-t border-dodger-blue-light px-3 py-1.5 text-right tabular-nums">
                                  {multiplier === null ? "—" : `${multiplier}×`}
                                </td>
                                <td className="whitespace-nowrap border-t border-dodger-blue-light px-3 py-1.5 text-right font-semibold tabular-nums">
                                  {score === null ? "—" : formatScore(score)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
