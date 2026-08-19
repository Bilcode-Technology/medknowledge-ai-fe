"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBanner } from "@/components/ui/error-banner";
import { apiFetch, ApiError } from "@/lib/api";
import type { AuditLogEntry, Paginated } from "@/lib/types";

const ACTION_VERB: Record<string, string> = {
  created: "created",
  updated: "updated",
  approved: "approved",
  rejected: "rejected",
  published: "published",
  synced: "synced",
};

// PM's and Admin's "what's happening" view — the immutable audit trail
// (M44), exposed for the first time via GET /audit-logs. Read-only, same
// table AuditLogObserver has always written to.
export function RecentActivityWidget() {
  const [data, setData] = useState<Paginated<AuditLogEntry> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Paginated<AuditLogEntry>>("/audit-logs")
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load activity."));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>Latest actions across the platform</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {!data && !error && (
          <div className="space-y-2.5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        )}
        {data && data.data.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No activity recorded yet.</p>
        )}
        {data && data.data.length > 0 && (
          <ul className="space-y-2.5">
            {data.data.map((entry) => (
              <li key={entry.id} className="flex items-baseline gap-2 text-sm">
                <span className="font-medium text-foreground">{entry.actor?.name ?? "System"}</span>
                <span className="text-muted-foreground">
                  {ACTION_VERB[entry.action] ?? entry.action} {entry.entity_type} #{entry.entity_id}
                </span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground/70">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
