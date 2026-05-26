import Papa from "papaparse";
import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase";

type CsvRow = {
  Release?: string;
  Weeks?: string;
  Gross?: string;
};

type WeekendCsvRow = {
  movie_title?: string;
  weeks?: string;
  weekend_gross_millions?: string;
  Release?: string;
  Weeks?: string;
  Gross?: string;
  "Total Gross"?: string;
};

function normalizeTitle(value: string) {
  return value.trim().toLowerCase();
}

const MAX_WEEK_NUMBER = 30;

/** Returns week 1–30, or null if not a positive integer in range (DB/view enforces Oct 1 cutoff). */
function parseWeekNumber(rawValue: string) {
  const trimmed = rawValue.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const weekNumber = Number.parseInt(trimmed, 10);
  if (weekNumber < 1 || weekNumber > MAX_WEEK_NUMBER) {
    return null;
  }
  return weekNumber;
}

function parseGrossMillions(rawValue: string) {
  const cleaned = rawValue.replace(/\$/g, "").replace(/,/g, "").trim();
  const dollars = Number.parseFloat(cleaned);
  if (!Number.isFinite(dollars)) {
    return null;
  }

  return Math.round((dollars / 1_000_000) * 100) / 100;
}

export async function GET(request: Request) {
  const expectedToken = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const csvUrl = process.env.SHEET_CSV_URL;
  if (!csvUrl) {
    return NextResponse.json(
      { success: false, error: "SHEET_CSV_URL is not configured." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(csvUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`CSV fetch failed with status ${response.status}`);
    }

    const csvText = await response.text();
    const parseResult = Papa.parse<CsvRow>(csvText, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
    });

    if (parseResult.errors.length > 0) {
      console.error("CSV parse warnings", parseResult.errors);
    }

    const supabase = supabaseAdmin();
    const { data: moviesData, error: moviesError } = await supabase
      .from("movies")
      .select("id, title");

    if (moviesError) {
      throw new Error(`Failed to load movies: ${moviesError.message}`);
    }

    const movieIdByTitle = new Map<string, string>();
    for (const movie of moviesData ?? []) {
      const normalized = normalizeTitle(String(movie.title ?? ""));
      if (normalized) {
        movieIdByTitle.set(normalized, String(movie.id));
      }
    }

    const unmatched = new Set<string>();
    let skippedInvalidWeek = 0;
    let matched = 0;
    let upserted = 0;

    for (const row of parseResult.data) {
      const title = String(row.Release ?? "").trim();
      const weekNumber = parseWeekNumber(String(row.Weeks ?? ""));

      if (!weekNumber) {
        skippedInvalidWeek += 1;
        continue;
      }

      const grossMillions = parseGrossMillions(String(row.Gross ?? ""));
      if (grossMillions === null) {
        console.error("Skipping row due to invalid gross", row);
        continue;
      }

      const movieId = movieIdByTitle.get(normalizeTitle(title));
      if (!movieId) {
        unmatched.add(title);
        continue;
      }

      matched += 1;

      const { error: upsertError } = await supabase.from("weekly_grosses").upsert(
        {
          movie_id: movieId,
          week_number: weekNumber,
          gross_millions: grossMillions,
          source: "boxofficemojo_sheet",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "movie_id,week_number" }
      );

      if (upsertError) {
        console.error("Failed to upsert weekly gross row", {
          title,
          weekNumber,
          error: upsertError.message,
        });
        continue;
      }

      upserted += 1;
    }

    const weeklyResult = {
      matched,
      upserted,
      unmatched: Array.from(unmatched),
      skipped_invalid_week: skippedInvalidWeek,
    };

    const weekendCsvUrl = process.env.SHEET_WEEKEND_CSV_URL;
    let weekendResult: {
      matched: number;
      captured: number;
      unmatched: string[];
      message?: string;
      error?: string;
    } = {
      matched: 0,
      captured: 0,
      unmatched: [],
    };

    if (!weekendCsvUrl) {
      console.warn("SHEET_WEEKEND_CSV_URL is not configured. Skipping weekend ingest.");
      weekendResult = {
        ...weekendResult,
        message: "SHEET_WEEKEND_CSV_URL is not configured; skipped weekend ingest.",
      };
    } else {
      try {
        const weekendResponse = await fetch(weekendCsvUrl, { cache: "no-store" });
        if (!weekendResponse.ok) {
          throw new Error(`Weekend CSV fetch failed with status ${weekendResponse.status}`);
        }

        const weekendCsvText = await weekendResponse.text();
        const weekendParseResult = Papa.parse<WeekendCsvRow>(weekendCsvText, {
          header: true,
          dynamicTyping: false,
          skipEmptyLines: true,
        });

        if (weekendParseResult.errors.length > 0) {
          console.error("Weekend CSV parse warnings", weekendParseResult.errors);
        }

        const weekendUnmatched = new Set<string>();
        let weekendMatched = 0;
        let weekendCaptured = 0;

        const GROSS_CUTOFF = new Date("2026-10-01T00:00:00Z");
        const isPastCutoff = new Date() >= GROSS_CUTOFF;

        for (const row of weekendParseResult.data) {
          const title = String(row.movie_title ?? row.Release ?? "").trim();
          const weekNumber = parseWeekNumber(String(row.weeks ?? row.Weeks ?? ""));

          const movieId = movieIdByTitle.get(normalizeTitle(title));
          if (!movieId) {
            weekendUnmatched.add(title);
            continue;
          }

          weekendMatched += 1;

          // Update cumulative total_gross_millions for all in-season movies
          if (!isPastCutoff) {
            const totalGrossMillions = parseGrossMillions(String(row["Total Gross"] ?? ""));
            if (totalGrossMillions !== null) {
              const { error: totalGrossError } = await supabase
                .from("movies")
                .update({ total_gross_millions: totalGrossMillions })
                .eq("id", movieId);

              if (totalGrossError) {
                console.error("Failed to update total_gross_millions", {
                  title,
                  totalGrossMillions,
                  error: totalGrossError.message,
                });
              } else {
                weekendCaptured += 1;
              }
            }
          }

          // Capture opening weekend gross for first-week movies only if not yet set
          if (weekNumber === 1) {
            const weekendGrossMillions = parseGrossMillions(
              String(row.weekend_gross_millions ?? row.Gross ?? "")
            );
            if (weekendGrossMillions !== null) {
              const { error: weekendUpdateError } = await supabase
                .from("movies")
                .update({ opening_weekend_gross: weekendGrossMillions })
                .eq("id", movieId)
                .is("opening_weekend_gross", null);

              if (weekendUpdateError) {
                console.error("Failed to update opening weekend gross", {
                  title,
                  weekendGrossMillions,
                  error: weekendUpdateError.message,
                });
              }
            }
          }
        }

        weekendResult = {
          matched: weekendMatched,
          captured: weekendCaptured,
          unmatched: Array.from(weekendUnmatched),
        };
      } catch (weekendError) {
        console.error("Weekend ingest failed", weekendError);
        weekendResult = {
          ...weekendResult,
          error:
            weekendError instanceof Error
              ? `Weekend ingest failed: ${weekendError.message}`
              : "Weekend ingest failed: unknown error",
        };
      }
    }

    return NextResponse.json({
      success: true,
      weekly: weeklyResult,
      weekend: weekendResult,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown ingestion error",
      },
      { status: 500 }
    );
  }
}
