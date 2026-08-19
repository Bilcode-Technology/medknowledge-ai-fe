"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { ErrorBanner } from "@/components/ui/error-banner";
import { apiFetch, ApiError } from "@/lib/api";
import type { AcquisitionQueueItem, Paginated } from "@/lib/types";

// Data Acquisition Officer's "what needs my attention": source documents
// across every project that failed validation or OCR, from
// GET /dashboard/acquisition-queue.
export function AcquisitionQueueWidget() {
  const [data, setData] = useState<Paginated<AcquisitionQueueItem> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Paginated<AcquisitionQueueItem>>("/dashboard/acquisition-queue")
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load acquisition queue."));
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Sources needing action</CardTitle>
          <CardDescription>Rejected during validation, or OCR failed</CardDescription>
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
            No sources are stuck right now — acquisition is clear.
          </p>
        )}
        {data && data.data.length > 0 && (
          <ul className="divide-y divide-border">
            {data.data.map((source) => (
              <li key={source.id}>
                <Link
                  href={source.project ? `/projects/${source.project.id}` : "#"}
                  className="flex items-center justify-between gap-3 py-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {source.title ?? source.original_filename ?? "Untitled source"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{source.project?.name}</p>
                  </div>
                  <StatusBadge tone="destructive" className="shrink-0">
                    {source.ocr_status === "failed" ? "OCR failed" : "Invalid"}
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
