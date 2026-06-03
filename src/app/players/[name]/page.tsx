import { notFound } from "next/navigation";

import { MoviePoster } from "@/components/MoviePoster";
import { SiteHeader } from "@/components/SiteHeader";
import { supabasePublic } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type PlayerRow = {
  id: string;
  name: string;
};

type PickRow = {
  movie_id: string;
  rank: number | null;
  is_alternate: boolean | null;
  movies: {
    title: string;
    status: string | null;
    poster_url: string | null;
    total_gross_millions: number | null;
    opening_weekend_gross: number | null;
  } | null;
};

function statusBadge(status: string | null) {
  if (status === "released") {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
        released
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
        cancelled
      </span>
    );
  }
  return null;
}

function formatMillions(value: number | null) {
  if (value === null) return "—";
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}M`;
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const supabase = supabasePublic();

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id, name")
    .eq("name", decodedName)
    .limit(1)
    .maybeSingle();

  if (playerError) {
    throw new Error(`Failed to load player: ${playerError.message}`);
  }

  if (!player) {
    notFound();
  }

  const typedPlayer = player as PlayerRow;
  const { data: picksData, error: picksError } = await supabase
    .from("picks")
    .select("movie_id, rank, is_alternate, movies(title, status, poster_url, total_gross_millions, opening_weekend_gross)")
    .eq("player_id", typedPlayer.id);

  if (picksError) {
    throw new Error(`Failed to load picks: ${picksError.message}`);
  }

  const picks = (picksData ?? []) as unknown as PickRow[];
  const rankedPicks = picks
    .filter((pick) => !pick.is_alternate && pick.rank !== null)
    .sort((a, b) => (a.rank as number) - (b.rank as number));
  const alternatePick = picks.find((pick) => Boolean(pick.is_alternate));

  const cancelledRanks = rankedPicks
    .filter((pick) => pick.movies?.status === "cancelled")
    .map((pick) => pick.rank as number);
  const activatedRank = cancelledRanks.length > 0 ? Math.min(...cancelledRanks) : null;

  let totalScore = 0;
  for (const pick of rankedPicks) {
    const gross = pick.movies?.total_gross_millions ?? null;
    if (gross !== null && pick.rank !== null) {
      totalScore += gross * (16 - (pick.rank as number));
    }
  }
  totalScore = Math.round(totalScore * 100) / 100;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-700">
      <SiteHeader currentPath={`/players/${encodeURIComponent(typedPlayer.name)}`} />
      <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-5">
        <section className="rounded-2xl border border-dodger-blue-dark/20 bg-white p-4 shadow-sm">
          <h1 className="text-2xl font-bold text-dodger-blue-dark">🎟️ {typedPlayer.name}</h1>
          <p className="mt-1 text-sm text-slate-700">
            Current total score:{" "}
            <span className="font-semibold tabular-nums">
              {new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              }).format(totalScore)}
            </span>
          </p>
        </section>

        <section className="overflow-hidden rounded-2xl border border-dodger-blue-dark/20 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-2 py-2 text-left font-semibold">Rank</th>
                  <th className="px-2 py-2 text-left font-semibold">Multiplier</th>
                  <th className="px-2 py-2 text-left font-semibold">Movie</th>
                  <th className="px-2 py-2 text-right font-semibold">Total Gross</th>
                  <th className="px-2 py-2 text-right font-semibold">Score</th>
                </tr>
              </thead>
              <tbody>
                {rankedPicks.map((pick) => {
                  const rank = pick.rank as number;
                  const multiplier = 16 - rank;
                  const totalGross = pick.movies?.total_gross_millions ?? pick.movies?.opening_weekend_gross ?? null;
                  const score =
                    totalGross === null ? null : Math.round(totalGross * multiplier * 100) / 100;

                  return (
                    <tr key={`${pick.movie_id}-${rank}`}>
                      <td className="border-t border-dodger-blue-light px-2 py-2 font-semibold">{rank}</td>
                      <td className="border-t border-dodger-blue-light px-2 py-2 tabular-nums">
                        {multiplier}×
                      </td>
                      <td className="border-t border-dodger-blue-light px-2 py-2">
                        <div className="flex items-center gap-2">
                          <MoviePoster
                            title={pick.movies?.title ?? "Movie"}
                            posterUrl={pick.movies?.poster_url}
                            className="relative h-10 w-8 overflow-hidden rounded border border-dodger-blue-dark/30"
                            sizes="32px"
                            titleClassName="text-[8px]"
                          />
                          <span>{pick.movies?.title ?? "Unknown movie"}</span>
                          {statusBadge(pick.movies?.status ?? null)}
                        </div>
                      </td>
                      <td className="border-t border-dodger-blue-light px-2 py-2 text-right tabular-nums">
                        {formatMillions(totalGross)}
                      </td>
                      <td className="border-t border-dodger-blue-light px-2 py-2 text-right font-semibold tabular-nums">
                        {formatMillions(score)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-dodger-blue-dark/20 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-dodger-blue-dark">
            {activatedRank
              ? `Alternate (activated, scoring at rank ${activatedRank})`
              : "Alternate (not activated)"}
          </h2>
          <p className="mt-1 text-sm text-slate-700">
            <span className="inline-flex items-center gap-2">
              <span>
                <MoviePoster
                  title={alternatePick?.movies?.title ?? "Movie"}
                  posterUrl={alternatePick?.movies?.poster_url}
                  className="relative h-10 w-8 overflow-hidden rounded border border-dodger-blue-dark/30"
                  sizes="32px"
                  titleClassName="text-[8px]"
                />
              </span>
              {alternatePick?.movies?.title ?? "No alternate pick on file"}
            </span>
          </p>
        </section>
      </main>
    </div>
  );
}
