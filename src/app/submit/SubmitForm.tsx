"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import { formatReleaseDate } from "@/lib/formatReleaseDate";

import {
  loadExistingPicksAction,
  submitPicksAction,
  type SubmitActionState,
} from "./actions";

type SubmitMovie = {
  id: string;
  title: string;
  release_date: string;
};

type SubmitFormProps = {
  movies: SubmitMovie[];
};

type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

type Slots = {
  ranked: Record<Rank, string | null>;
  alternate: string | null;
  available: string[];
};

type InputErrors = {
  ranked: Partial<Record<Rank, string>>;
  alternate: string;
};

const REQUIRED_RANKED_COUNT = 15;
const initialState: SubmitActionState = { status: "idle", message: "" };
const DRAFT_STORAGE_KEY = "boxoffice26-submit-draft";
const RANKS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
] as const satisfies ReadonlyArray<Rank>;
const TITLE_ALIASES: Record<string, string> = {
  spiderman: "Spider-Man: Brand New Day",
  "spider-man": "Spider-Man: Brand New Day",
  "spider man": "Spider-Man: Brand New Day",
  odyssey: "The Odyssey",
  "the odyssey": "The Odyssey",
  jackass: "Jackass: Best and Last",
  mandalorian: "Star Wars: The Mandalorian and Grogu",
  "the mandalorian": "Star Wars: The Mandalorian and Grogu",
  "mandalorian and grogu": "Star Wars: The Mandalorian and Grogu",
  "the mandalorian and grogu": "Star Wars: The Mandalorian and Grogu",
  grogu: "Star Wars: The Mandalorian and Grogu",
  "scary movie": "Scary Movie 6",
  "toy story": "Toy Story 5",
  minions: "Minions & Monsters",
  "minions and monsters": "Minions & Monsters",
  moana: "Moana (Live-Action)",
  "moana live action": "Moana (Live-Action)",
};

function createInitialSlots(movieIds: string[]): Slots {
  return {
    ranked: {
      1: null,
      2: null,
      3: null,
      4: null,
      5: null,
      6: null,
      7: null,
      8: null,
      9: null,
      10: null,
      11: null,
      12: null,
      13: null,
      14: null,
      15: null,
    },
    alternate: null,
    available: movieIds,
  };
}

function DesktopMovieCard({
  id,
  movieId,
  title,
  subtitle,
  isDragGhost,
  isSelected,
  onTap,
  ariaLabel,
}: {
  id: string;
  movieId: string;
  title: string;
  subtitle?: string;
  isDragGhost?: boolean;
  isSelected?: boolean;
  onTap: (movieId: string) => void;
  ariaLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: "transform 200ms ease-in-out",
      }}
      className={`min-h-8 rounded-md border border-dodger-blue-dark/20 bg-white px-2 py-1 shadow-sm transition-all duration-150 ease-out ${
        isDragging || isDragGhost ? "cursor-grabbing opacity-30" : "cursor-grab opacity-100"
      } ${
        !isDragging ? "hover:bg-dodger-blue-light/20 hover:scale-[1.02]" : ""
      } ${isSelected ? "ring-2 ring-dodger-red shadow-md" : ""}`}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => onTap(movieId)}
        className={`min-h-6 w-full text-left ${
          isDragging ? "cursor-grabbing" : "cursor-grab active:cursor-grabbing"
        }`}
        {...attributes}
        {...listeners}
      >
        <div className="text-sm font-semibold leading-tight text-dodger-blue-dark">{title}</div>
        {subtitle ? <div className="text-[11px] text-slate-700">{subtitle}</div> : null}
      </button>
    </div>
  );
}

function SlotDropTarget({
  id,
  label,
  movie,
  activeMovieId,
  isDragActive,
  isSelectionActive,
  onTapTarget,
  onMovieTap,
  isMovieSelected,
}: {
  id: string;
  label: string;
  movie: SubmitMovie | null;
  activeMovieId: string | null;
  isDragActive: boolean;
  isSelectionActive: boolean;
  onTapTarget: (targetId: string) => void;
  onMovieTap: (movieId: string) => void;
  isMovieSelected: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const isEmpty = !movie;
  const showTapEmpty = isSelectionActive && isEmpty && !isDragActive;

  const emptyClasses = isOver && isDragActive
    ? "border-dodger-blue bg-dodger-blue/20 ring-2 ring-dodger-blue"
    : isDragActive && isEmpty
      ? "border-dodger-blue bg-dodger-blue-light/30 ring-2 ring-dodger-blue"
      : showTapEmpty
        ? "border-dodger-red bg-dodger-red/5 ring-2 ring-dodger-red animate-pulse"
        : "border-dodger-blue-dark/30 bg-slate-100";

  return (
    <div className="flex items-stretch gap-2">
      <div className="flex min-h-8 w-8 shrink-0 items-center justify-end pr-2 text-base font-bold text-dodger-blue">
        {label}
      </div>
      {isEmpty ? (
        <button
          ref={setNodeRef}
          type="button"
          aria-label={`${label} slot empty, tap to place selected movie`}
          onClick={() => onTapTarget(id)}
          disabled={!isSelectionActive}
          className={`flex min-h-8 flex-1 items-center rounded-md border border-dashed px-2 py-1 text-left text-xs transition-all duration-150 ease-out ${emptyClasses}`}
        >
          <span className="text-slate-500">Drop here</span>
        </button>
      ) : (
        <div
          ref={setNodeRef}
          className={`flex-1 rounded-md transition-all duration-150 ease-out ${
            isDragActive && isOver ? "bg-dodger-blue/20 ring-2 ring-dodger-blue" : ""
          }`}
        >
          <DesktopMovieCard
            id={`movie-${movie!.id}`}
            movieId={movie!.id}
            title={movie!.title}
            isDragGhost={activeMovieId === movie!.id}
            isSelected={isMovieSelected}
            onTap={onMovieTap}
            ariaLabel={`Movie: ${movie!.title}, currently in ${label}, tap to select`}
          />
        </div>
      )}
    </div>
  );
}

function AvailableDropZone({
  isDragActive,
  isSelectionActive,
  children,
  onTapTarget,
}: {
  isDragActive: boolean;
  isSelectionActive: boolean;
  children: ReactNode;
  onTapTarget: (targetId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "available" });

  return (
    <button
      type="button"
      onClick={() => onTapTarget("available")}
      aria-label="Available movies zone, tap to place selected movie back"
      ref={setNodeRef}
      disabled={!isSelectionActive}
      className={`min-h-0 w-full max-h-[54rem] flex-1 overflow-y-auto rounded-md p-1 text-left transition-all duration-150 ease-out ${
        isOver
          ? "bg-dodger-blue/20 ring-2 ring-dodger-blue"
          : isDragActive
            ? "bg-dodger-blue-light/10 ring-2 ring-dodger-blue/50"
            : isSelectionActive
              ? "ring-2 ring-dodger-red animate-pulse"
              : ""
      }`}
    >
      {children}
    </button>
  );
}

export function SubmitForm({ movies }: SubmitFormProps) {
  const [state, formAction, isSubmitting] = useActionState(
    submitPicksAction,
    initialState
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [slots, setSlots] = useState<Slots>(() =>
    createInitialSlots(movies.map((movie) => movie.id))
  );
  const slotsRef = useRef(slots);
  const [loadMessage, setLoadMessage] = useState("");
  const [isLoadingExisting, startLoadingExisting] = useTransition();
  const [activeMovieId, setActiveMovieId] = useState<string | null>(null);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [rankedInputs, setRankedInputs] = useState<Record<Rank, string>>({
    1: "",
    2: "",
    3: "",
    4: "",
    5: "",
    6: "",
    7: "",
    8: "",
    9: "",
    10: "",
    11: "",
    12: "",
    13: "",
    14: "",
    15: "",
  });
  const [alternateInput, setAlternateInput] = useState("");
  const [errors, setErrors] = useState<InputErrors>({ ranked: {}, alternate: "" });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const updateIsTouch = () => setIsTouch(mediaQuery.matches);
    updateIsTouch();
    mediaQuery.addEventListener("change", updateIsTouch);
    return () => mediaQuery.removeEventListener("change", updateIsTouch);
  }, []);

  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as { name?: string; email?: string; slots?: Slots };
      if (draft.name) setName(draft.name);
      if (draft.email) setEmail(draft.email);
      if (draft.slots) {
        const knownIds = new Set(movies.map((movie) => movie.id));
        const cleanRanked: Slots["ranked"] = { ...draft.slots.ranked } as Slots["ranked"];
        for (const rank of RANKS) {
          const id = cleanRanked[rank];
          if (id && !knownIds.has(id)) cleanRanked[rank] = null;
        }
        const cleanAlt =
          draft.slots.alternate && knownIds.has(draft.slots.alternate)
            ? draft.slots.alternate
            : null;
        const usedIds = new Set([
          ...(Object.values(cleanRanked).filter(Boolean) as string[]),
          ...(cleanAlt ? [cleanAlt] : []),
        ]);
        const cleanAvailable = movies.map((movie) => movie.id).filter((id) => !usedIds.has(id));
        const nextSlots = { ranked: cleanRanked, alternate: cleanAlt, available: cleanAvailable };
        setSlots(nextSlots);
        syncInputsFromSlots(nextSlots);
      }
    } catch {
      // corrupt JSON or storage error — silently ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ name, email, slots }));
    } catch {
      // storage full or disabled — ignore
    }
  }, [name, email, slots]);

  useEffect(() => {
    if (state.status === "success") {
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {}
    }
  }, [state.status]);

  const movieMap = useMemo(
    () => new Map(movies.map((movie) => [movie.id, movie])),
    [movies]
  );
  const movieByQueryTerm = useMemo(() => {
    const map = new Map<string, string>();
    for (const movie of movies) {
      map.set(movie.title.trim().toLowerCase(), movie.id);
    }
    const titleToId = new Map(movies.map((movie) => [movie.title, movie.id]));
    for (const [alias, canonicalTitle] of Object.entries(TITLE_ALIASES)) {
      const id = titleToId.get(canonicalTitle);
      if (id) {
        map.set(alias.trim().toLowerCase(), id);
      }
    }
    return map;
  }, [movies]);

  const rankedMovieIdsInOrder = RANKS.map((rank) => slots.ranked[rank]);
  const rankedMovieIds = rankedMovieIdsInOrder.filter((id): id is string => Boolean(id));
  const completedRankedCount = rankedMovieIds.length;
  const alternateId = slots.alternate;
  const usedMovieIds = useMemo(
    () => new Set([...rankedMovieIds, ...(alternateId ? [alternateId] : [])]),
    [rankedMovieIds, alternateId]
  );

  const canSubmit =
    name.trim().length > 0 &&
    completedRankedCount === REQUIRED_RANKED_COUNT &&
    Boolean(alternateId) &&
    !rankedMovieIds.includes(alternateId ?? "") &&
    !isSubmitting;

  const selectedMovieTitle = selectedMovieId
    ? (movieMap.get(selectedMovieId)?.title ?? "selected movie")
    : null;

  function syncInputsFromSlots(nextSlots: Slots) {
    setRankedInputs({
      1: nextSlots.ranked[1] ? (movieMap.get(nextSlots.ranked[1] ?? "")?.title ?? "") : "",
      2: nextSlots.ranked[2] ? (movieMap.get(nextSlots.ranked[2] ?? "")?.title ?? "") : "",
      3: nextSlots.ranked[3] ? (movieMap.get(nextSlots.ranked[3] ?? "")?.title ?? "") : "",
      4: nextSlots.ranked[4] ? (movieMap.get(nextSlots.ranked[4] ?? "")?.title ?? "") : "",
      5: nextSlots.ranked[5] ? (movieMap.get(nextSlots.ranked[5] ?? "")?.title ?? "") : "",
      6: nextSlots.ranked[6] ? (movieMap.get(nextSlots.ranked[6] ?? "")?.title ?? "") : "",
      7: nextSlots.ranked[7] ? (movieMap.get(nextSlots.ranked[7] ?? "")?.title ?? "") : "",
      8: nextSlots.ranked[8] ? (movieMap.get(nextSlots.ranked[8] ?? "")?.title ?? "") : "",
      9: nextSlots.ranked[9] ? (movieMap.get(nextSlots.ranked[9] ?? "")?.title ?? "") : "",
      10: nextSlots.ranked[10] ? (movieMap.get(nextSlots.ranked[10] ?? "")?.title ?? "") : "",
      11: nextSlots.ranked[11] ? (movieMap.get(nextSlots.ranked[11] ?? "")?.title ?? "") : "",
      12: nextSlots.ranked[12] ? (movieMap.get(nextSlots.ranked[12] ?? "")?.title ?? "") : "",
      13: nextSlots.ranked[13] ? (movieMap.get(nextSlots.ranked[13] ?? "")?.title ?? "") : "",
      14: nextSlots.ranked[14] ? (movieMap.get(nextSlots.ranked[14] ?? "")?.title ?? "") : "",
      15: nextSlots.ranked[15] ? (movieMap.get(nextSlots.ranked[15] ?? "")?.title ?? "") : "",
    });
    setAlternateInput(
      nextSlots.alternate ? (movieMap.get(nextSlots.alternate ?? "")?.title ?? "") : ""
    );
  }

  function findMovieLocation(currentSlots: Slots, movieId: string) {
    for (const rank of RANKS) {
      if (currentSlots.ranked[rank] === movieId) {
        return { type: "ranked" as const, rank };
      }
    }

    if (currentSlots.alternate === movieId) {
      return { type: "alternate" as const };
    }

    if (currentSlots.available.includes(movieId)) {
      return { type: "available" as const };
    }

    return null;
  }

  function clearLocation(
    currentSlots: Slots,
    location: ReturnType<typeof findMovieLocation>,
    movieId: string
  ) {
    if (!location) return;
    if (location.type === "available") {
      currentSlots.available = currentSlots.available.filter((id) => id !== movieId);
    } else if (location.type === "alternate") {
      currentSlots.alternate = null;
    } else if (location.type === "ranked") {
      currentSlots.ranked[location.rank] = null;
    }
  }

  function setLocation(
    currentSlots: Slots,
    location: { type: "available" } | { type: "alternate" } | { type: "ranked"; rank: Rank },
    movieId: string
  ) {
    if (location.type === "available") {
      if (!currentSlots.available.includes(movieId)) {
        currentSlots.available = [...currentSlots.available, movieId];
      }
      return;
    }

    if (location.type === "alternate") {
      currentSlots.alternate = movieId;
      return;
    }

    currentSlots.ranked[location.rank] = movieId;
  }

  function parseTargetId(overId: string) {
    if (overId === "available") {
      return { type: "available" as const };
    }

    if (overId === "slot-alternate") {
      return { type: "alternate" as const };
    }

    if (overId.startsWith("slot-")) {
      return { type: "ranked" as const, rank: Number(overId.replace("slot-", "")) as Rank };
    }

    return null;
  }

  function placeMovieInTarget(movieId: string, targetId: string) {
    const target = parseTargetId(targetId);
    if (!target) return;

    setSlots((current) => {
      const next: Slots = {
        ranked: { ...current.ranked },
        alternate: current.alternate,
        available: [...current.available],
      };

      const source = findMovieLocation(next, movieId);
      if (!source) return current;

      const isSameTarget =
        (source.type === "available" && target.type === "available") ||
        (source.type === "alternate" && target.type === "alternate") ||
        (source.type === "ranked" && target.type === "ranked" && source.rank === target.rank);
      if (isSameTarget) return current;

      const targetMovieId =
        target.type === "available"
          ? null
          : target.type === "alternate"
            ? next.alternate
            : next.ranked[target.rank];

      clearLocation(next, source, movieId);
      if (targetMovieId) {
        setLocation(next, source, targetMovieId);
      }
      setLocation(next, target, movieId);
      return next;
    });
  }

  function handleMovieTap(movieId: string) {
    if (selectedMovieId && selectedMovieId !== movieId) {
      const location = findMovieLocation(slots, movieId);
      if (location) {
        const targetId =
          location.type === "available"
            ? "available"
            : location.type === "alternate"
              ? "slot-alternate"
              : `slot-${location.rank}`;
        placeMovieInTarget(selectedMovieId, targetId);
      }
      setSelectedMovieId(null);
      return;
    }

    setSelectedMovieId((current) => (current === movieId ? null : movieId));
  }

  function handleTapTarget(targetId: string) {
    if (!selectedMovieId) return;
    placeMovieInTarget(selectedMovieId, targetId);
    setSelectedMovieId(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveMovieId(null);
    const activeIdRaw = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;

    if (!overId || !activeIdRaw.startsWith("movie-")) {
      return;
    }

    const movieId = activeIdRaw.replace("movie-", "");
    placeMovieInTarget(movieId, overId);
  }

  function handleDragStart(event: DragStartEvent) {
    const activeIdRaw = String(event.active.id);
    setActiveMovieId(
      activeIdRaw.startsWith("movie-") ? activeIdRaw.replace("movie-", "") : null
    );
  }

  function handleDragCancel() {
    setActiveMovieId(null);
  }

  function handleLoadExisting() {
    setLoadMessage("");
    startLoadingExisting(async () => {
      const result = await loadExistingPicksAction(name);

      if (!result.ok) {
        setLoadMessage(result.error);
        return;
      }

      const validRanked = result.rankedMovieIds.filter((id) => movieMap.has(id)).slice(0, 15);
      const validAlternate =
        movieMap.has(result.alternateMovieId) &&
        !validRanked.includes(result.alternateMovieId)
          ? result.alternateMovieId
          : "";
      const usedIds = new Set([...validRanked, validAlternate].filter(Boolean) as string[]);
      const rankedFromResult: Slots["ranked"] = {
        1: validRanked[0] ?? null,
        2: validRanked[1] ?? null,
        3: validRanked[2] ?? null,
        4: validRanked[3] ?? null,
        5: validRanked[4] ?? null,
        6: validRanked[5] ?? null,
        7: validRanked[6] ?? null,
        8: validRanked[7] ?? null,
        9: validRanked[8] ?? null,
        10: validRanked[9] ?? null,
        11: validRanked[10] ?? null,
        12: validRanked[11] ?? null,
        13: validRanked[12] ?? null,
        14: validRanked[13] ?? null,
        15: validRanked[14] ?? null,
      };

      setEmail(result.email);
      const nextSlots = {
        ranked: rankedFromResult,
        alternate: validAlternate || null,
        available: movies.map((movie) => movie.id).filter((id) => !usedIds.has(id)),
      };
      setSlots(nextSlots);
      syncInputsFromSlots(nextSlots);
      setErrors({ ranked: {}, alternate: "" });
      setLoadMessage("Loaded your existing picks.");
    });
  }

  function handleClearDraft() {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}
    setName("");
    setEmail("");
    const resetSlots = createInitialSlots(movies.map((movie) => movie.id));
    setSlots(resetSlots);
    syncInputsFromSlots(resetSlots);
    setErrors({ ranked: {}, alternate: "" });
    setLoadMessage("");
    setSelectedMovieId(null);
    setActiveMovieId(null);
  }

  function updateAvailable(nextRanked: Slots["ranked"], nextAlternate: string | null) {
    const used = new Set([
      ...(Object.values(nextRanked).filter(Boolean) as string[]),
      ...(nextAlternate ? [nextAlternate] : []),
    ]);
    return movies.map((movie) => movie.id).filter((id) => !used.has(id));
  }

  function validateRankInput(value: string, rank: Rank) {
    const normalized = value.trim().toLowerCase();
    const movieId = normalized ? (movieByQueryTerm.get(normalized) ?? null) : null;
    if (movieId) {
      const canonicalTitle = movieMap.get(movieId)?.title ?? value;
      setRankedInputs((current) => ({ ...current, [rank]: canonicalTitle }));
    }
    const currentSlots = slotsRef.current;
    const duplicateRank = movieId
      ? RANKS.find((candidate) => candidate !== rank && currentSlots.ranked[candidate] === movieId)
      : undefined;
    const nextRanked = { ...currentSlots.ranked, [rank]: duplicateRank ? null : movieId };
    const nextAlternate = currentSlots.alternate;
    setSlots({
      ranked: nextRanked,
      alternate: nextAlternate,
      available: updateAvailable(nextRanked, nextAlternate),
    });

    if (!normalized) {
      setErrors((current) => ({ ...current, ranked: { ...current.ranked, [rank]: "" } }));
      return;
    }

    if (!movieId) {
      setErrors((current) => ({
        ...current,
        ranked: {
          ...current.ranked,
          [rank]: "No movie matches that title — pick one from the list",
        },
      }));
      return;
    }

    if (duplicateRank) {
      setRankedInputs((current) => ({ ...current, [rank]: "" }));
      setErrors((current) => ({
        ...current,
        ranked: { ...current.ranked, [rank]: `This movie is already at rank ${duplicateRank}.` },
      }));
      return;
    }

    setErrors((current) => ({ ...current, ranked: { ...current.ranked, [rank]: "" } }));
  }

  function validateAlternateInput(value: string) {
    const normalized = value.trim().toLowerCase();
    const movieId = normalized ? (movieByQueryTerm.get(normalized) ?? null) : null;
    if (movieId) {
      const canonicalTitle = movieMap.get(movieId)?.title ?? value;
      setAlternateInput(canonicalTitle);
    }
    const currentSlots = slotsRef.current;
    const nextRanked = { ...currentSlots.ranked };
    const duplicateRank = movieId ? RANKS.find((rank) => currentSlots.ranked[rank] === movieId) : undefined;
    const nextAlternate = duplicateRank ? null : movieId;
    setSlots({
      ranked: nextRanked,
      alternate: nextAlternate,
      available: updateAvailable(nextRanked, nextAlternate),
    });

    if (!normalized) {
      setErrors((current) => ({ ...current, alternate: "" }));
      return;
    }
    if (!movieId) {
      setErrors((current) => ({
        ...current,
        alternate: "No movie matches that title — pick one from the list",
      }));
      return;
    }
    if (duplicateRank) {
      setAlternateInput("");
      setErrors((current) => ({
        ...current,
        alternate: `This movie is already at rank ${duplicateRank}.`,
      }));
      return;
    }

    setErrors((current) => ({ ...current, alternate: "" }));
  }

  const heroCopy = isTouch
    ? "Enter your name, type your top 15 in rank order, and choose one alternate."
    : "Enter your name, drag your top 15 into rank order, and choose one alternate.";

  return (
    <form action={formAction} className="mx-auto w-full max-w-6xl space-y-5">
      <div className="rounded-lg border border-dodger-blue-dark/20 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-dodger-blue-dark">
          Summer Game Picks
        </h1>
        <p className="mt-1 text-sm text-slate-700">{heroCopy}</p>
      </div>

      <div className="grid gap-3 rounded-lg border border-dodger-blue-dark/20 bg-white p-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-700">
            Name *
          </span>
          <input
            type="text"
            name="name"
            required
            value={name}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setName(value);
            }}
            className="w-full rounded-md border border-dodger-blue-dark/20 px-3 py-2 text-sm"
            placeholder="Your name"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-700">
            Email (optional)
          </span>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setEmail(value);
            }}
            className="w-full rounded-md border border-dodger-blue-dark/20 px-3 py-2 text-sm"
            placeholder="you@example.com"
          />
        </label>

        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleLoadExisting}
            disabled={!name.trim() || isLoadingExisting}
            className="rounded-md border border-dodger-blue-dark/20 bg-slate-100 px-3 py-2 text-sm font-medium text-dodger-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoadingExisting ? "Loading..." : "Load my existing picks"}
          </button>
          {loadMessage ? <p className="text-sm text-slate-700">{loadMessage}</p> : null}
        </div>
      </div>

      {isTouch ? (
        <>
          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-dodger-blue-dark/20 bg-white p-3">
              <h2 className="mb-3 text-sm font-semibold text-dodger-blue-dark">Your top 15 ranked</h2>
              <ol className="space-y-2">
                {RANKS.map((rank) => (
                  <li key={`rank-input-${rank}`}>
                    <label className="flex items-start gap-2">
                      <span className="flex min-h-12 w-8 shrink-0 items-center justify-end pr-2 text-base font-bold text-dodger-blue">
                        {rank}
                      </span>
                      <span className="flex-1">
                        <input
                          type="text"
                          list="movies-options"
                          value={rankedInputs[rank] ?? ""}
                          onChange={(event) => {
                            const value = event.currentTarget.value;
                            setRankedInputs((current) => ({ ...current, [rank]: value }));
                            setErrors((current) => ({
                              ...current,
                              ranked: { ...current.ranked, [rank]: "" },
                            }));
                          }}
                          onBlur={(event) => {
                            const value = event.currentTarget.value;
                            validateRankInput(value, rank);
                          }}
                          className="min-h-12 w-full rounded-md border border-dodger-blue-dark/20 px-3 py-2 text-base"
                          placeholder="Type a movie..."
                        />
                        {errors.ranked[rank] ? (
                          <p className="mt-1 text-xs text-red-700">{errors.ranked[rank]}</p>
                        ) : null}
                      </span>
                    </label>
                  </li>
                ))}
              </ol>
              <div className="mt-3">
                <label className="flex items-start gap-2">
                  <span className="flex min-h-12 w-8 shrink-0 items-center justify-end pr-2 text-base font-bold text-dodger-blue">
                    Alt
                  </span>
                  <span className="flex-1">
                    <input
                      type="text"
                      list="movies-options"
                      value={alternateInput}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        setAlternateInput(value);
                        setErrors((current) => ({ ...current, alternate: "" }));
                      }}
                      onBlur={(event) => {
                        const value = event.currentTarget.value;
                        validateAlternateInput(value);
                      }}
                      className="min-h-12 w-full rounded-md border border-dodger-blue-dark/20 px-3 py-2 text-base"
                      placeholder="Type a movie..."
                    />
                    {errors.alternate ? (
                      <p className="mt-1 text-xs text-red-700">{errors.alternate}</p>
                    ) : null}
                  </span>
                </label>
              </div>
            </div>

            <div className="rounded-lg border border-dodger-blue-dark/20 bg-white p-3">
              <h2 className="mb-3 text-sm font-semibold text-dodger-blue-dark">Available movies</h2>
              <ul className="max-h-[54rem] space-y-1 overflow-y-auto pr-1">
                {movies.map((movie) => {
                  const isUsed = usedMovieIds.has(movie.id);
                  return (
                    <li
                      key={`available-${movie.id}`}
                      className={`rounded-md border px-2 py-2 transition-all duration-150 ease-out ${
                        isUsed
                          ? "border-slate-200 bg-slate-100/70 text-slate-500"
                          : "border-dodger-blue-dark/10 bg-white text-slate-700"
                      }`}
                    >
                      <div className="text-sm font-medium">{movie.title}</div>
                      <div className="text-xs">{formatReleaseDate(movie.release_date)}</div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          <datalist id="movies-options">
            {movies.map((movie) => (
              <option key={`movie-option-${movie.id}`} value={movie.title} />
            ))}
          </datalist>
        </>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <section
              className={`flex flex-col rounded-lg border p-3 transition-all duration-150 ease-out ${
                activeMovieId ? "border-dodger-blue/40 bg-dodger-blue-light/10" : "border-dodger-blue-dark/20 bg-white"
              }`}
            >
              <h2 className="text-sm font-semibold text-dodger-blue-dark">Available movies</h2>
              <p className="mb-3 text-xs text-slate-700">
                Drag into ranked slots or alternate. Tap a movie to select, then tap a slot to place.
              </p>
              <AvailableDropZone
                isDragActive={Boolean(activeMovieId)}
                isSelectionActive={Boolean(selectedMovieId)}
                onTapTarget={handleTapTarget}
              >
                <div className="grid grid-cols-2 gap-2">
                  {slots.available.map((movieId) => {
                    const movie = movieMap.get(movieId);
                    if (!movie) return null;
                    return (
                      <div key={movieId} className="min-w-0">
                        <DesktopMovieCard
                          id={`movie-${movie.id}`}
                          movieId={movie.id}
                          title={movie.title}
                          subtitle={formatReleaseDate(movie.release_date)}
                          isDragGhost={activeMovieId === movie.id}
                          isSelected={selectedMovieId === movie.id}
                          onTap={handleMovieTap}
                          ariaLabel={`Movie: ${movie.title}, in Available — tap to select`}
                        />
                      </div>
                    );
                  })}
                </div>
              </AvailableDropZone>
            </section>

            <section
              className={`flex flex-col rounded-lg border p-3 transition-all duration-150 ease-out ${
                activeMovieId ? "border-dodger-blue/40 bg-dodger-blue-light/10" : "border-dodger-blue-dark/20 bg-white"
              }`}
            >
              <h2 className="text-sm font-semibold text-dodger-blue-dark">Your top 15 ranked</h2>
              <p className="mb-2 text-xs text-slate-700">
                {selectedMovieId
                  ? `Tap a slot to place “${selectedMovieTitle}”.`
                  : "Tap a movie to pick it up. Tap again to deselect."}
              </p>
              <ol className="space-y-1">
                {RANKS.map((rank) => {
                  const movieId = slots.ranked[rank];
                  const movie = movieId ? (movieMap.get(movieId) ?? null) : null;
                  return (
                    <li key={`slot-${rank}`}>
                      <SlotDropTarget
                        id={`slot-${rank}`}
                        label={String(rank)}
                        movie={movie}
                        activeMovieId={activeMovieId}
                        isDragActive={Boolean(activeMovieId)}
                        isSelectionActive={Boolean(selectedMovieId)}
                        onTapTarget={handleTapTarget}
                        onMovieTap={handleMovieTap}
                        isMovieSelected={selectedMovieId === movieId}
                      />
                    </li>
                  );
                })}
              </ol>

              <div className="mt-3">
                <SlotDropTarget
                  id="slot-alternate"
                  label="Alt"
                  movie={slots.alternate ? (movieMap.get(slots.alternate) ?? null) : null}
                  activeMovieId={activeMovieId}
                  isDragActive={Boolean(activeMovieId)}
                  isSelectionActive={Boolean(selectedMovieId)}
                  onTapTarget={handleTapTarget}
                  onMovieTap={handleMovieTap}
                  isMovieSelected={selectedMovieId === slots.alternate}
                />
              </div>
            </section>
          </div>

          <DragOverlay>
            {activeMovieId ? (
              <div className="scale-105 rounded-md border border-dodger-blue-dark/20 bg-white p-3 shadow-lg">
                <div className="font-medium text-dodger-blue-dark">
                  {movieMap.get(activeMovieId)?.title ?? "Movie"}
                </div>
                <div className="text-xs text-slate-700">
                  {formatReleaseDate(movieMap.get(activeMovieId)?.release_date)}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <input
        type="hidden"
        name="ranked_movie_ids"
        value={JSON.stringify(rankedMovieIdsInOrder.map((id) => id ?? ""))}
      />
      <input type="hidden" name="alternate_movie_id" value={alternateId ?? ""} />

      <div className="rounded-lg border border-dodger-blue-dark/20 bg-white p-4">
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-md bg-dodger-red px-4 py-3 text-sm font-semibold text-white transition hover:bg-dodger-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Make Your List"}
        </button>
        <p className="mt-2 text-xs text-slate-700">
          Submit unlocks once you have 15 ranked movies and 1 alternate.
        </p>
        <p className="mt-1 text-xs text-slate-700">
          {completedRankedCount} of {REQUIRED_RANKED_COUNT} ranked +{" "}
          {alternateId ? "alt picked" : "alt missing"}
        </p>
        <button
          type="button"
          onClick={handleClearDraft}
          className="link-inline-body mt-2 text-xs font-medium"
        >
          Clear draft
        </button>
        {state.message ? (
          <p
            className={`mt-3 text-sm ${
              state.status === "success" ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
