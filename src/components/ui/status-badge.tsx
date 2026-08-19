import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type StatusTone = "success" | "warning" | "destructive" | "info" | "muted"

const DOT_CLASS: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
  muted: "bg-muted-foreground/50",
}

// Single source of truth for status semantics app-wide: pending/awaiting
// work is `info`, needs-attention/at-risk is `warning`, failed/rejected is
// `destructive`, done/approved/published is `success`, and inactive/neutral
// is `muted`. Every status badge in the app should render through this
// instead of hand-rolling `bg-success/10 text-success border-...` locally —
// that duplication is why status colors used to drift between pages.
export function StatusBadge({
  tone,
  className,
  children,
}: {
  tone: StatusTone
  className?: string
  children: React.ReactNode
}) {
  return (
    <Badge variant={tone} className={cn("gap-1.5 font-medium", className)}>
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT_CLASS[tone])} aria-hidden="true" />
      {children}
    </Badge>
  )
}
