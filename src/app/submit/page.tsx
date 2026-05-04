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
}
