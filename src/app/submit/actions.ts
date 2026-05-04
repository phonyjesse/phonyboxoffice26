"use server";

import { revalidatePath } from "next/cache";

import { supabaseAdmin } from "@/lib/supabase";

const SUBMIT_PATH = "/submit";
const REQUIRED_RANKED_COUNT = 15;

export type SubmitActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type ExistingPicksResult =
  | {
      ok: true;
      email: string;
      rankedMovieIds: string[];
      alternateMovieId: string;
    }
  | {
      ok: false;
      error: string;
    };

function parseRankedMovieIds(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((value): value is string => typeof value === "string")
      .filter((value) => value.trim().length > 0);
  } catch {
    return [];
  }
}

function lockDateError() {
  return "Submissions are locked.";
}

function validateLockDate() {
  const lockDateRaw = process.env.LOCK_DATE;
  if (!lockDateRaw) {
    return;
  }

  const lockDate = new Date(lockDateRaw);
  if (Number.isNaN(lockDate.getTime())) {
    return;
  }

  if (new Date() > lockDate) {
    throw new Error(lockDateError());
  }
}

export async function submitPicksAction(
  _prevState: SubmitActionState,
  formData: FormData
): Promise<SubmitActionState> {
  try {
    validateLockDate();

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const rankedMovieIds = parseRankedMovieIds(formData.get("ranked_movie_ids"));
    const alternateMovieId = String(formData.get("alternate_movie_id") ?? "").trim();

    if (!name) {
      return { status: "error", message: "Name is required." };
    }

    if (rankedMovieIds.length !== REQUIRED_RANKED_COUNT) {
      return {
        status: "error",
        message: `Exactly ${REQUIRED_RANKED_COUNT} ranked picks are required.`,
      };
    }

    if (!alternateMovieId) {
      return { status: "error", message: "Alternate pick is required." };
    }

    if (rankedMovieIds.includes(alternateMovieId)) {
      return {
        status: "error",
        message: "Alternate pick cannot be in your top 15.",
      };
    }

    const uniqueRanked = new Set(rankedMovieIds);
    if (uniqueRanked.size !== rankedMovieIds.length) {
      return {
        status: "error",
        message: "Ranked picks must be unique.",
      };
    }

    const supabase = supabaseAdmin();

    const { data: existingPlayer, error: existingPlayerError } = await supabase
      .from("players")
      .select("id")
      .eq("name", name)
      .limit(1)
      .maybeSingle();

    if (existingPlayerError) {
      throw new Error(existingPlayerError.message);
    }

    let playerId = existingPlayer?.id as string | undefined;
    const playerPayload = {
      name,
      email: email || null,
    };

    if (playerId) {
      const { error: updatePlayerError } = await supabase
        .from("players")
        .update(playerPayload)
        .eq("id", playerId);

      if (updatePlayerError) {
        throw new Error(updatePlayerError.message);
      }
    } else {
      const { data: insertedPlayer, error: insertPlayerError } = await supabase
        .from("players")
        .insert(playerPayload)
        .select("id")
        .single();

      if (insertPlayerError) {
        throw new Error(insertPlayerError.message);
      }

      playerId = insertedPlayer.id as string;
    }

    const { error: deletePicksError } = await supabase
      .from("picks")
      .delete()
      .eq("player_id", playerId);

    if (deletePicksError) {
      throw new Error(deletePicksError.message);
    }

    const rankedRows = rankedMovieIds.map((movieId, index) => ({
      player_id: playerId,
      movie_id: movieId,
      rank: index + 1,
      is_alternate: false,
    }));

    const alternateRow = {
      player_id: playerId,
      movie_id: alternateMovieId,
      rank: null,
      is_alternate: true,
    };

    const { error: insertPicksError } = await supabase
      .from("picks")
      .insert([...rankedRows, alternateRow]);

    if (insertPicksError) {
      throw new Error(insertPicksError.message);
    }

    revalidatePath(SUBMIT_PATH);
    return {
      status: "success",
      message: "Picks submitted successfully. You can edit and submit again anytime before lock.",
    };
  } catch (error) {
    if (error instanceof Error && error.message === lockDateError()) {
      return { status: "error", message: error.message };
    }

    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to submit picks.",
    };
  }
}

export async function loadExistingPicksAction(
  nameRaw: string
): Promise<ExistingPicksResult> {
  try {
    validateLockDate();

    const name = nameRaw.trim();
    if (!name) {
      return { ok: false, error: "Enter your name first." };
    }

    const supabase = supabaseAdmin();
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id, email")
      .eq("name", name)
      .limit(1)
      .maybeSingle();

    if (playerError) {
      throw new Error(playerError.message);
    }

    if (!player) {
      return { ok: false, error: "No existing submission found for that name." };
    }

    const { data: picks, error: picksError } = await supabase
      .from("picks")
      .select("movie_id, rank, is_alternate")
      .eq("player_id", player.id);

    if (picksError) {
      throw new Error(picksError.message);
    }

    const rankedMovieIds = (picks ?? [])
      .filter((pick) => !pick.is_alternate && pick.rank !== null)
      .sort((a, b) => (a.rank as number) - (b.rank as number))
      .map((pick) => String(pick.movie_id));

    const alternatePick = (picks ?? []).find((pick) => Boolean(pick.is_alternate));

    if (rankedMovieIds.length !== REQUIRED_RANKED_COUNT || !alternatePick) {
      return {
        ok: false,
        error: "Existing picks were incomplete. Start with a new submission.",
      };
    }

    return {
      ok: true,
      email: String(player.email ?? ""),
      rankedMovieIds,
      alternateMovieId: String(alternatePick.movie_id),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load existing picks.",
    };
  }
}
