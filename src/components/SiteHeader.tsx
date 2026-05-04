import Link from "next/link";

type SiteHeaderProps = {
  currentPath: "/" | "/movies" | "/submit" | `/players/${string}`;
};

export function SiteHeader({ currentPath }: SiteHeaderProps) {
  const lockDateRaw = process.env.LOCK_DATE;
  const lockDate = lockDateRaw ? new Date(lockDateRaw) : null;
  const hasValidLockDate = lockDate !== null && !Number.isNaN(lockDate.getTime());
  const showSubmitLink = hasValidLockDate ? new Date() < lockDate : true;
  const links = [
    { href: "/", label: "Standings" as const },
    { href: "/movies", label: "Movies" as const },
    ...(showSubmitLink
      ? [{ href: "/submit", label: "Submit picks" as const }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-10 border-b border-dodger-blue-dark bg-dodger-blue backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-white">
          Phony Box Office Game!
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {links.map((link) => {
            const isCurrent =
              currentPath === link.href ||
              (link.href === "/" && currentPath.startsWith("/players/"));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full border px-3 py-1.5 transition ${
                  link.href === "/submit"
                    ? "border-dodger-red bg-dodger-red text-white hover:bg-red-700"
                    : isCurrent
                      ? "border-dodger-blue bg-dodger-blue font-bold text-white"
                      : "border-dodger-blue bg-white text-dodger-blue hover:bg-dodger-blue-light/40"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
