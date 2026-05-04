import { SiteHeader } from "@/components/SiteHeader";
import { MoviePoster } from "@/components/MoviePoster";
import { formatReleaseDate } from "@/lib/formatReleaseDate";
import { supabasePublic } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type MovieRow = {
  id: string;
  title: string;
  release_date: string;
  status: string | null;
  poster_url: string | null;
};

type WeeklyGrossRow = {
  movie_id: string;
  gross_millions: number;
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

export default async function MoviesPage() {
  const supabase = supabasePublic();

  const [{ data: moviesData, error: moviesError }, { data: weeklyData, error: weeklyError }] =
    await Promise.all([
      supabase
        .from("movies")
        .select("id, title, release_date, status, poster_url")
        .order("release_date", { ascending: true })
        .order("title", { ascending: true }),
      supabase.from("weekly_grosses").select("movie_id, gross_millions"),
    ]);

  if (moviesError) {
    throw new Error(`Failed to load movies: ${moviesError.message}`);
  }
  if (weeklyError) {
    throw new Error(`Failed to load weekly grosses: ${weeklyError.message}`);
  }

  const movies = (moviesData ?? []) as MovieRow[];
  const weeklyByMovie = new Map<string, number>();
  for (const row of (weeklyData ?? []) as WeeklyGrossRow[]) {
    weeklyByMovie.set(
      row.movie_id,
      (weeklyByMovie.get(row.movie_id) ?? 0) + Number(row.gross_millions)
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-700">
      <SiteHeader currentPath="/movies" />
      <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-5">
        <section className="mx-auto max-w-2xl rounded-2xl border border-dodger-blue-dark/20 bg-white p-4 text-center shadow-sm">
          <h1 className="text-center text-4xl font-bold text-dodger-blue">Summer Movies!</h1>
          <p className="mt-1 text-center text-sm text-slate-700">
            Theatrical Releases between May 22nd - August 31st.
          </p>
        </section>

        <section className="grid grid-cols-3 gap-3 lg:grid-cols-5 xl:grid-cols-6">
          {movies.map((movie) => {
            const total = weeklyByMovie.get(movie.id) ?? 0;
            const hasGrosses = weeklyByMovie.has(movie.id);
            const cancelled = movie.status === "cancelled";

            return (
              <article
                key={movie.id}
                className={`rounded-xl border bg-white p-2 shadow-sm ${
                  cancelled
                    ? "border-dodger-red/70 opacity-90"
                    : "border-dodger-blue-dark/20"
                }`}
              >
                <MoviePoster
                  title={movie.title}
                  posterUrl={movie.poster_url}
                  className="relative mb-2 aspect-[2/3] overflow-hidden rounded-md border border-dodger-blue-dark/30"
                  sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
                  showComingSoonTag
                />
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h2
                    className={`text-sm font-semibold text-dodger-blue-dark ${
                      cancelled ? "line-through decoration-dodger-red/80" : ""
                    }`}
                  >
                    {movie.title}
                  </h2>
                  {statusBadge(movie.status)}
                </div>
                <p className="text-xs text-slate-700">
                  {formatReleaseDate(movie.release_date)}
                </p>
                {hasGrosses ? (
                  <p className="mt-1 text-xs font-semibold text-dodger-blue-dark">
                    4-week total: ${total.toFixed(1)}M
                  </p>
                ) : null}
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
