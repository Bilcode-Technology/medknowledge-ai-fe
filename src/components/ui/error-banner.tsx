// The `border-destructive/20 bg-destructive/10 px-4 py-2 text-xs text-destructive`
// banner was hand-copied at the top of nearly every page. One shared version
// so API errors always look and read the same, and never leak raw
// stack traces — callers pass the already-extracted `.message`.
export function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
    >
      {children}
    </div>
  );
}
