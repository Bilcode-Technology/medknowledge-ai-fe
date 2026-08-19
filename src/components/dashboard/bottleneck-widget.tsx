"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorBanner } from "@/components/ui/error-banner";
import { apiFetch, ApiError } from "@/lib/api";
import type { SlaTimer } from "@/lib/types";
import { PROJECT_STATUS_LABEL } from "@/lib/project-status";

// Project Manager's "what needs my attention" view — every SLA timer that
// escalated (GET /sla-timers/overdue), i.e. a pipeline stage that's taken
// longer than its budget without the project moving on.
export function BottleneckWidget() {
  const [timers, setTimers] = useState<SlaTimer[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<SlaTimer[]>("/sla-timers/overdue")
      .then(setTimers)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load bottlenecks."));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bottlenecks</CardTitle>
        <CardDescription>Projects stuck past their SLA in the current stage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {!timers && !error && (
          <div className="space-y-2.5">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}
        {timers && timers.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No projects are past their SLA right now.
          </p>
        )}
        {timers && timers.length > 0 && (
          <ul className="divide-y divide-border">
            {timers.map((timer) => (
              <li key={timer.id}>
                <Link
                  href={`/projects/${timer.project?.id}`}
                  className="flex items-center justify-between gap-3 py-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <span className="font-medium text-foreground">{timer.project?.name ?? "Untitled project"}</span>
                  <StatusBadge tone="warning">{PROJECT_STATUS_LABEL[timer.state] ?? timer.state}</StatusBadge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
