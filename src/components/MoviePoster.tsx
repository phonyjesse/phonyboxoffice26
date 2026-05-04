import Image from "next/image";

type MoviePosterProps = {
  title: string;
  posterUrl: string | null | undefined;
  className: string;
  sizes?: string;
  titleClassName?: string;
  showComingSoonTag?: boolean;
};

export function MoviePoster({
  title,
  posterUrl,
  className,
  sizes,
  titleClassName = "text-xl md:text-2xl",
  showComingSoonTag = false,
}: MoviePosterProps) {
  const hasPoster = Boolean(posterUrl?.trim());

  if (hasPoster) {
    return (
      <div className={className}>
        <Image
          src={posterUrl as string}
          alt={`${title} poster`}
          fill
          className="object-cover"
          sizes={sizes}
        />
      </div>
    );
  }

  return (
    <div
      className={`${className} relative flex items-center justify-center overflow-hidden bg-[#005A9C] px-4 text-center`}
    >
      <span className="pointer-events-none absolute inset-2 rounded border-4 border-white/20" />
      {showComingSoonTag ? (
        <span className="absolute right-2 top-2 rounded bg-white/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white">
          COMING SOON
        </span>
      ) : null}
      <span className={`${titleClassName} font-bold leading-tight text-white`}>{title}</span>
    </div>
  );
}
