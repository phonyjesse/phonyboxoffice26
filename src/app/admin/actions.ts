"use server";

import { revalidatePath } from "next/cache";

import { supabaseAdmin } from "@/lib/supabase";

const ADMIN_PATH = "/admin";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readNumber(formData: FormData, key: string) {
  const raw = formData.get(key);

  if (raw == null || raw === "") {
    return null;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

async function refreshAdminPage() {
  revalidatePath(ADMIN_PATH);
}

function resolveBoundActionArgs(
  boundIdOrFormData: string | number | null | FormData,
  maybeFormData?: FormData
) {
  if (boundIdOrFormData instanceof FormData) {
    return { boundId: null, formData: boundIdOrFormData };
  }

  return { boundId: boundIdOrFormData, formData: maybeFormData as FormData };
}

export async function createMovieAction(formData: FormData) {
  const title = readString(formData, "title");
  const releaseDate = readString(formData, "release_date");
  const tmdbId = readNumber(formData, "tmdb_id");
  const posterUrl = readString(formData, "poster_url");
  const openingWeekendGross = readNumber(formData, "opening_weekend_gross");

  if (!title || !releaseDate) {
    throw new Error("Title and release date are required.");
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase.from("movies").insert({
    title,
    release_date: releaseDate,
    tmdb_id: tmdbId,
    poster_url: posterUrl || null,
    opening_weekend_gross: openingWeekendGross,
    status: "scheduled",
  });

  if (error) {
    throw new Error(error.message);
  }

  await refreshAdminPage();
}

export async function updateMovieOpeningWeekendAction(
  boundMovieIdOrFormData: string | FormData,
  maybeFormData?: FormData
) {
  const { boundId, formData } = resolveBoundActionArgs(
    boundMovieIdOrFormData,
    maybeFormData
  );
  const movieId =
    boundId ?? readString(formData, "movie_id") ?? readString(formData, "id");
  const openingWeekendGross = readNumber(formData, "opening_weekend_gross");

  if (!movieId) {
    throw new Error("Movie id is required.");
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("movies")
    .update({ opening_weekend_gross: openingWeekendGross })
    .eq("id", movieId);

  if (error) {
    throw new Error(error.message);
  }

  await refreshAdminPage();
}

export async function updateMovieStatusAction(
  boundMovieIdOrFormData: string | FormData,
  maybeFormData?: FormData
) {
  const { boundId, formData } = resolveBoundActionArgs(
    boundMovieIdOrFormData,
    maybeFormData
  );
  const movieId =
    boundId ?? readString(formData, "movie_id") ?? readString(formData, "id");
  const status = readString(formData, "status");

  if (!movieId) {
    throw new Error("Movie id is required.");
  }

  if (!["scheduled", "released", "cancelled"].includes(status)) {
    throw new Error("Invalid movie status.");
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("movies")
    .update({ status })
    .eq("id", movieId);

  if (error) {
    throw new Error(error.message);
  }

  await refreshAdminPage();
}

export async function deleteMovieAction(
  boundMovieIdOrFormData: string | FormData,
  maybeFormData?: FormData
) {
  const { boundId, formData } = resolveBoundActionArgs(
    boundMovieIdOrFormData,
    maybeFormData
  );
  const movieId =
    boundId || readString(formData, "id") || readString(formData, "movie_id");

  if (!movieId) {
    throw new Error("Movie id is required.");
  }

  const supabase = supabaseAdmin();
  const { error: deletePicksError } = await supabase
    .from("picks")
    .delete()
    .eq("movie_id", movieId);
  if (deletePicksError) {
    console.log("DELETE MOVIE:", { movieId, error: deletePicksError.message });
    throw new Error(deletePicksError.message);
  }

  const { error: deleteGrossesError } = await supabase
    .from("weekly_grosses")
    .delete()
    .eq("movie_id", movieId);
  if (deleteGrossesError) {
    console.log("DELETE MOVIE:", { movieId, error: deleteGrossesError.message });
    throw new Error(deleteGrossesError.message);
  }

  const { error } = await supabase.from("movies").delete().eq("id", movieId);
  console.log("DELETE MOVIE:", { movieId, error: error?.message ?? null });
  if (error) {
    throw new Error(error.message);
  }

  await refreshAdminPage();
}

export async function togglePlayerPaidAction(
  boundPlayerIdOrFormData: string | FormData,
  maybeFormData?: FormData
) {
  const { boundId, formData } = resolveBoundActionArgs(
    boundPlayerIdOrFormData,
    maybeFormData
  );
  const playerId = boundId ?? readString(formData, "player_id");
  const paid = formData.get("paid") === "true";

  if (!playerId) {
    throw new Error("Player id is required.");
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("players")
    .update({ paid })
    .eq("id", playerId);

  if (error) {
    throw new Error(error.message);
  }

  await refreshAdminPage();
}

export async function upsertWeeklyGrossAction(
  boundRowIdOrFormData: string | number | null | FormData,
  maybeFormData?: FormData
) {
  const { boundId, formData } = resolveBoundActionArgs(
    boundRowIdOrFormData,
    maybeFormData
  );
  const rowId = boundId ?? readNumber(formData, "id");
  const movieId = readNumber(formData, "movie_id");
  const weekNumber = readNumber(formData, "week_number");
  const grossMillions = readNumber(formData, "gross_millions");
  const weekStartDate = readString(formData, "week_start_date");

  if (!movieId || !weekNumber || grossMillions === null || !weekStartDate) {
    throw new Error("Movie, week, gross, and week start date are required.");
  }

  const payload = {
    movie_id: movieId,
    week_number: weekNumber,
    gross_millions: grossMillions,
    week_start_date: weekStartDate,
    source: "manual",
  };

  const supabase = supabaseAdmin();
  const query = rowId
    ? supabase.from("weekly_grosses").upsert({ id: rowId, ...payload })
    : supabase
        .from("weekly_grosses")
        .upsert(payload, { onConflict: "movie_id,week_number,week_start_date" });

  const { error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  await refreshAdminPage();
}
