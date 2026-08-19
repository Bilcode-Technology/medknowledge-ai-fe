"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { ErrorBanner } from "@/components/ui/error-banner";
import { apiFetch, ApiError } from "@/lib/api";
import type { FhirQueueItem, Paginated } from "@/lib/types";

const TONE: Record<string, StatusTone> = {
  failed: "destructive",
  pending: "info",
  not_synced: "muted",
  synced: "success",
};

// FHIR Engineer's "what needs my attention": resources that failed to sync
// or are still pending, from GET /fhir-resources?sync_status= (cross-annotation,
// unlike the per-annotation GET /annotations/{id}/fhir-resources).
export function FhirQueueWidget() {
  const [data, setData] = useState<Paginated<FhirQueueItem> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Paginated<FhirQueueItem>>("/fhir-resources?sync_status=failed")
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load FHIR queue."));
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Failed FHIR syncs</CardTitle>
          <CardDescription>Resources that did not reach the HAPI FHIR server</CardDescription>
        </div>
        {data && (
          <Badge variant={data.total > 0 ? "destructive" : "muted"} className="shrink-0">
            {data.total}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {!data && !error && (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}
        {data && data.data.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No failed syncs — integration is healthy.
          </p>
        )}
        {data && data.data.length > 0 && (
          <ul className="divide-y divide-border">
            {data.data.map((resource) => (
              <li key={resource.id}>
                <Link
                  href={resource.annotation ? `/annotations/${resource.annotation.id}` : "#"}
                  className="flex items-center justify-between gap-3 py-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{resource.resource_type}</p>
                    {resource.error_message && (
                      <p className="truncate text-xs text-muted-foreground">{resource.error_message}</p>
                    )}
                  </div>
                  <StatusBadge tone={TONE[resource.sync_status] ?? "muted"} className="shrink-0">
                    {resource.sync_status}
                  </StatusBadge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
