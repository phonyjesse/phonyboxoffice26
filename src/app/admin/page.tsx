import { formatReleaseDate } from "@/lib/formatReleaseDate";
import { supabaseAdmin } from "@/lib/supabase";

import {
  createMovieAction,
  deleteMovieAction,
  togglePlayerPaidAction,
  updateMovieOpeningWeekendAction,
  upsertWeeklyGrossAction,
} from "./actions";
import { MovieTitleInput } from "./MovieTitleInput";
import { MovieStatusSelect } from "./MovieStatusSelect";
import {
  AutoSubmitCheckbox,
  AutoSubmitNumberInput,
} from "./auto-submit";

export const dynamic = "force-dynamic";

type MovieRow = {
  id: string;
  title: string;
  release_date: string;
  opening_weekend_gross: number | null;
  status: "scheduled" | "released" | "cancelled" | string | null;
  tmdb_id: number | null;
  poster_url: string | null;
};

type PlayerRow = {
  id: string;
  name: string | null;
  email: string | null;
  paid: boolean | null;
};

type PickRow = {
  id: string;
  player_id: string;
  movie_id: string;
  rank: number | null;
  is_alternate: boolean | null;
};

type WeeklyGrossRow = {
  id: string;
  movie_id: string;
  week_number: number;
  gross_millions: number;
  week_start_date: string;
  source: string | null;
};

function sectionTitle(title: string, subtitle?: string) {
  return (
    <div className="border-b border-zinc-300 bg-zinc-100 px-3 py-2">
      <div className="font-semibold text-zinc-900">{title}</div>
      {subtitle ? <p className="text-xs text-zinc-600">{subtitle}</p> : null}
    </div>
  );
}

function rowClassName(index: number) {
  return index % 2 === 0 ? "bg-white" : "bg-zinc-50";
}

export default async function AdminPage() {
  const supabase = supabaseAdmin();

  const [moviesResult, playersResult, picksResult, weeklyGrossesResult] =
    await Promise.all([
      supabase
        .from("movies")
        .select("id, title, release_date, opening_weekend_gross, status, tmdb_id, poster_url")
        .order("release_date", { ascending: true })
        .order("id", { ascending: true }),
      supabase
        .from("players")
        .select("id, name, email, paid")
        .order("name", { ascending: true })
        .order("id", { ascending: true }),
      supabase
        .from("picks")
        .select("id, player_id, movie_id, rank, is_alternate")
        .order("player_id", { ascending: true })
        .order("rank", { ascending: true, nullsFirst: false })
        .order("id", { ascending: true }),
      supabase
        .from("weekly_grosses")
        .select("id, movie_id, week_number, gross_millions, week_start_date, source")
        .order("week_start_date", { ascending: true })
        .order("movie_id", { ascending: true })
        .order("week_number", { ascending: true }),
    ]);

  if (moviesResult.error) {
    throw new Error(`Failed to load movies: ${moviesResult.error.message}`);
  }

  if (playersResult.error) {
    throw new Error(`Failed to load players: ${playersResult.error.message}`);
  }

  if (picksResult.error) {
    throw new Error(`Failed to load picks: ${picksResult.error.message}`);
  }

  if (weeklyGrossesResult.error) {
    throw new Error(
      `Failed to load weekly grosses: ${weeklyGrossesResult.error.message}`
    );
  }

  const movies = (moviesResult.data ?? []) as MovieRow[];
  const players = (playersResult.data ?? []) as PlayerRow[];
  const picks = (picksResult.data ?? []) as PickRow[];
  const weeklyGrosses = (weeklyGrossesResult.data ?? []) as WeeklyGrossRow[];

  const movieTitles = new Map(movies.map((movie) => [movie.id, movie.title]));
  const picksByPlayer = new Map<string, PickRow[]>();

  for (const pick of picks) {
    const existing = picksByPlayer.get(pick.player_id) ?? [];
    existing.push(pick);
    picksByPlayer.set(pick.player_id, existing);
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 text-sm">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-950">
          Admin
        </h1>
        <p className="text-sm text-zinc-600">
          Server-rendered admin surface for movies, players, picks, and weekly
          grosses.
        </p>
      </header>

      <section className="overflow-hidden rounded border border-zinc-300">
        {sectionTitle("Movies")}
        <form
          action={createMovieAction}
          className="grid gap-2 border-b border-zinc-300 bg-zinc-50 p-3 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_auto_auto_auto_auto]"
        >
          <MovieTitleInput />
          <input
            type="url"
            name="poster_url"
            placeholder="Poster URL (optional)"
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs"
          />
          <input
            type="date"
            name="release_date"
            required
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs"
          />
          <input
            type="number"
            name="tmdb_id"
            placeholder="TMDB ID (optional)"
            min="1"
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs"
          />
          <input
            type="number"
            name="opening_weekend_gross"
            placeholder="Opening Weekend ($M)"
            step="0.1"
            min="0"
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs"
          />
          <button
            type="submit"
            className="rounded border border-zinc-900 bg-zinc-900 px-3 py-1 text-xs font-medium text-white"
          >
            Add movie
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-xs">
            <thead className="bg-zinc-200 text-zinc-800">
              <tr>
                <th className="border-b border-zinc-300 px-2 py-1 text-left font-semibold">
                  ID
                </th>
                <th className="border-b border-zinc-300 px-2 py-1 text-left font-semibold">
                  Title
                </th>
                <th className="border-b border-zinc-300 px-2 py-1 text-left font-semibold">
                  Release Date
                </th>
                <th className="border-b border-zinc-300 px-2 py-1 text-left font-semibold">
                  Opening Weekend ($M)
                </th>
                <th className="border-b border-zinc-300 px-2 py-1 text-left font-semibold">
                  Status
                </th>
                <th className="border-b border-zinc-300 px-2 py-1 text-left font-semibold">
                  Delete
                </th>
              </tr>
            </thead>
            <tbody>
              {movies.map((movie, index) => (
                <tr key={movie.id} className={rowClassName(index)}>
                  <td className="border-b border-zinc-200 px-2 py-1 align-top">
                    {movie.id}
                  </td>
                  <td className="border-b border-zinc-200 px-2 py-1 align-top">
                    <div className="font-medium text-zinc-900">{movie.title}</div>
                    {movie.tmdb_id ? (
                      <div className="text-[11px] text-zinc-500">
                        TMDB {movie.tmdb_id}
                      </div>
                    ) : null}
                  </td>
                  <td className="border-b border-zinc-200 px-2 py-1 align-top">
                    {formatReleaseDate(movie.release_date)}
                  </td>
                  <td className="border-b border-zinc-200 px-2 py-1 align-top">
                    <form
                      action={updateMovieOpeningWeekendAction.bind(null, movie.id)}
                      className="flex items-center gap-2"
                    >
                      <AutoSubmitNumberInput
                        name="opening_weekend_gross"
                        step="0.1"
                        min="0"
                        defaultValue={movie.opening_weekend_gross ?? ""}
                        aria-label={`Update opening weekend gross for ${movie.title}`}
                      />
                    </form>
                  </td>
                  <td className="border-b border-zinc-200 px-2 py-1 align-top">
                    <MovieStatusSelect
                      movieId={movie.id}
                      currentStatus={movie.status ?? 'scheduled'}
                    />
                  </td>
                  <td className="border-b border-zinc-200 px-2 py-1 align-top">
                    <form action={deleteMovieAction.bind(null, movie.id)}>
                      <input type="hidden" name="id" value={movie.id} />
                      <button
                        type="submit"
                        className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded border border-zinc-300">
        {sectionTitle("Players")}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-xs">
            <thead className="bg-zinc-200 text-zinc-800">
              <tr>
                <th className="border-b border-zinc-300 px-2 py-1 text-left font-semibold">
                  Name
                </th>
                <th className="border-b border-zinc-300 px-2 py-1 text-left font-semibold">
                  Email
                </th>
                <th className="border-b border-zinc-300 px-2 py-1 text-left font-semibold">
                  Paid
                </th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                <tr key={player.id} className={rowClassName(index)}>
                  <td className="border-b border-zinc-200 px-2 py-1">
                    {player.name ?? <span className="text-zinc-400">Unnamed</span>}
                  </td>
                  <td className="border-b border-zinc-200 px-2 py-1">
                    {player.email ?? <span className="text-zinc-400">No email</span>}
                  </td>
                  <td className="border-b border-zinc-200 px-2 py-1">
                    <form
                      action={togglePlayerPaidAction.bind(null, player.id)}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="hidden"
                        name="paid"
                        value={String(Boolean(player.paid))}
                      />
                      <AutoSubmitCheckbox
                        name={`player-paid-${player.id}`}
                        defaultChecked={Boolean(player.paid)}
                        aria-label={`Toggle paid for ${player.name ?? player.email ?? `player ${player.id}`}`}
                      />
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded border border-zinc-300">
        {sectionTitle(
          "Picks",
          "Read-only grouped view for verifying each player's ranked submission and alternate."
        )}
        <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-3">
          {players.map((player) => {
            const playerPicks = picksByPlayer.get(player.id) ?? [];
            const rankedPicks = playerPicks
              .filter((pick) => !pick.is_alternate)
              .sort((a, b) => {
                if (a.rank === null) return 1;
                if (b.rank === null) return -1;
                return a.rank - b.rank;
              });
            const alternate = playerPicks.find((pick) => Boolean(pick.is_alternate));

            return (
              <div
                key={player.id}
                className="rounded border border-zinc-300 bg-white p-3 text-xs"
              >
                <div className="mb-2">
                  <div className="font-semibold text-zinc-900">
                    {player.name ?? "Unnamed player"}
                  </div>
                  <div className="text-zinc-500">
                    {player.email ?? "No email on file"}
                  </div>
                </div>

                <ol className="space-y-1">
                  {rankedPicks.length > 0 ? (
                    rankedPicks.map((pick) => (
                      <li
                        key={pick.id}
                        className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2"
                      >
                        <span className="text-zinc-500">
                          #{pick.rank ?? "?"}
                        </span>
                        <span>{movieTitles.get(pick.movie_id) ?? "Unknown movie"}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-zinc-400">No picks submitted.</li>
                  )}
                </ol>

                <div className="mt-3 border-t border-zinc-200 pt-2 text-zinc-700">
                  <span className="font-medium">Alternate:</span>{" "}
                  {alternate
                    ? movieTitles.get(alternate.movie_id) ?? "Unknown movie"
                    : "None"}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded border border-zinc-300">
        {sectionTitle("Weekly Grosses")}
        <form
          action={upsertWeeklyGrossAction}
          className="grid gap-2 border-b border-zinc-300 bg-zinc-50 p-3 md:grid-cols-[minmax(0,2fr)_auto_auto_auto_auto]"
        >
          <select
            name="movie_id"
            required
            defaultValue=""
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs"
          >
            <option value="" disabled>
              Select movie
            </option>
            {movies.map((movie) => (
              <option key={movie.id} value={movie.id}>
                {movie.title}
              </option>
            ))}
          </select>
          <select
            name="week_number"
            required
            defaultValue=""
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs"
          >
            <option value="" disabled>
              Week
            </option>
            {[1, 2, 3, 4].map((week) => (
              <option key={week} value={week}>
                Week {week}
              </option>
            ))}
          </select>
          <input
            type="number"
            name="gross_millions"
            step="0.01"
            required
            placeholder="Gross millions"
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs"
          />
          <input
            type="date"
            name="week_start_date"
            required
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs"
          />
          <button
            type="submit"
            className="rounded border border-zinc-900 bg-zinc-900 px-3 py-1 text-xs font-medium text-white"
          >
            Add row
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-xs">
            <thead className="bg-zinc-200 text-zinc-800">
              <tr>
                <th className="border-b border-zinc-300 px-2 py-1 text-left font-semibold">
                  Movie
                </th>
                <th className="border-b border-zinc-300 px-2 py-1 text-left font-semibold">
                  Week
                </th>
                <th className="border-b border-zinc-300 px-2 py-1 text-left font-semibold">
                  Gross (M)
                </th>
                <th className="border-b border-zinc-300 px-2 py-1 text-left font-semibold">
                  Week Start
                </th>
                <th className="border-b border-zinc-300 px-2 py-1 text-left font-semibold">
                  Source
                </th>
              </tr>
            </thead>
            <tbody>
              {weeklyGrosses.map((row, index) => (
                <tr key={row.id} className={rowClassName(index)}>
                  <td className="border-b border-zinc-200 px-2 py-1">
                    {movieTitles.get(row.movie_id) ?? `Movie ${row.movie_id}`}
                  </td>
                  <td className="border-b border-zinc-200 px-2 py-1">
                    {row.week_number}
                  </td>
                  <td className="border-b border-zinc-200 px-2 py-1">
                    <form
                      action={upsertWeeklyGrossAction.bind(null, row.id)}
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="movie_id" value={row.movie_id} />
                      <input
                        type="hidden"
                        name="week_number"
                        value={row.week_number}
                      />
                      <input
                        type="hidden"
                        name="week_start_date"
                        value={row.week_start_date}
                      />
                      <AutoSubmitNumberInput
                        name="gross_millions"
                        step="0.01"
                        defaultValue={row.gross_millions}
                        aria-label={`Update weekly gross for ${movieTitles.get(row.movie_id) ?? `movie ${row.movie_id}`}, week ${row.week_number}`}
                      />
                    </form>
                  </td>
                  <td className="border-b border-zinc-200 px-2 py-1">
                    {row.week_start_date}
                  </td>
                  <td className="border-b border-zinc-200 px-2 py-1">
                    {row.source ?? <span className="text-zinc-400">unknown</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        This page uses the service-role Supabase client and is intended for
        admin use only.
      </section>
    </main>
  );
}
