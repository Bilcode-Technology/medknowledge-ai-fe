"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBanner } from "@/components/ui/error-banner";
import { apiFetch, ApiError } from "@/lib/api";
import type { PipelineSummary } from "@/lib/types";
import { PROJECT_PHASE_GROUPS } from "@/lib/project-status";

// Project Manager's "what's happening" view: how many projects sit in each
// pipeline phase right now, from GET /dashboard/pipeline-summary
// (Project::groupBy('status')->count() — no per-project fetch needed).
export function PipelineSummaryWidget() {
  const [summary, setSummary] = useState<PipelineSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<PipelineSummary>("/dashboard/pipeline-summary")
      .then(setSummary)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load pipeline summary."));
  }, []);

  const total = summary ? Object.values(summary).reduce((sum, n) => sum + n, 0) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Curation Pipeline</CardTitle>
        <CardDescription>
          {total != null ? `${total} projects across every phase` : "Projects by pipeline phase"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {!summary && !error && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}
        {summary && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PROJECT_PHASE_GROUPS.map((group) => {
              const count = group.statuses.reduce((sum, status) => sum + (summary[status] ?? 0), 0);
              return (
                <div key={group.key} className="rounded-lg border border-border p-3">
                  <p className="text-2xl font-semibold tabular-nums text-foreground">{count}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{group.title}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
