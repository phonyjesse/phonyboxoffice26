import Link from "next/link";

import { supabaseAdmin } from "@/lib/supabase";

import { SubmitForm } from "./SubmitForm";

export const dynamic = "force-dynamic";

type MovieRow = {
  id: string;
  title: string;
  release_date: string;
  status: string | null;
};

export default async function SubmitPage() {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("movies")
      .select("id, title, release_date, status")
      .neq("status", "cancelled")
      .order("release_date", { ascending: true })
      .order("title", { ascending: true });

    if (error) {
      throw new Error(`Failed to load movies: ${error.message}`);
    }

    const movies = ((data ?? []) as MovieRow[]).map((movie) => ({
      id: movie.id,
      title: movie.title,
      release_date: movie.release_date,
    }));

    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-700">
        <div className="mx-auto mb-3 w-full max-w-6xl">
          <Link
            href="/"
            className="inline-flex text-sm font-medium text-dodger-blue underline-offset-2 hover:underline"
          >
            ← Back to home
          </Link>
        </div>
        <SubmitForm movies={movies} />
      </main>
    );
  } catch (err) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-700">
        <div className="mx-auto mb-3 w-full max-w-6xl">
          <Link
            href="/"
            className="inline-flex text-sm font-medium text-dodger-blue underline-offset-2 hover:underline"
          >
            ← Back to home
          </Link>
        </div>
        <section className="mx-auto w-full max-w-3xl rounded-xl border border-red-300 bg-red-50 p-4 shadow-sm">
          <h1 className="text-xl font-semibold text-red-900">Couldn&apos;t load submit form</h1>
          <pre className="mt-3 overflow-x-auto rounded bg-white p-3 text-xs text-red-800">
            {String((err as { message?: string } | null | undefined)?.message ?? err)}
          </pre>
          <p className="mt-3 text-sm text-red-900">
            NEXT_PUBLIC_SUPABASE_URL defined:{" "}
            {Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL).toString()}
          </p>
          <p className="text-sm text-red-900">
            SUPABASE_SERVICE_ROLE_KEY defined:{" "}
            {Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY).toString()}
          </p>
        </section>
      </main>
    );
  }
}
