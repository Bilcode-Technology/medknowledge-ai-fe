"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ErrorBanner } from "@/components/ui/error-banner";
import { apiFetch, ApiError } from "@/lib/api";
import type { Paginated, TerminologyQueueItem } from "@/lib/types";

function missingCodes(entity: TerminologyQueueItem): string[] {
  const missing: string[] = [];
  if (!entity.kfa_code) missing.push("KFA");
  if (!entity.rxnorm_code) missing.push("RxNorm");
  if (!entity.atc_code) missing.push("ATC");
  return missing;
}

// Terminologist's "what needs my attention": drug entities missing at least
// one of the three terminology mappings, from GET /dashboard/terminology-queue.
export function TerminologyQueueWidget() {
  const [data, setData] = useState<Paginated<TerminologyQueueItem> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Paginated<TerminologyQueueItem>>("/dashboard/terminology-queue")
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load terminology queue."));
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Unresolved mappings</CardTitle>
          <CardDescription>Drug entities missing KFA, RxNorm, or ATC codes</CardDescription>
        </div>
        {data && (
          <Badge variant={data.total > 0 ? "warning" : "muted"} className="shrink-0">
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
            Every drug entity is fully mapped.
          </p>
        )}
        {data && data.data.length > 0 && (
          <ul className="divide-y divide-border">
            {data.data.map((entity) => (
              <li key={entity.id}>
                <Link
                  href="/ingredients"
                  className="flex items-center justify-between gap-3 py-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <span className="font-medium text-foreground">{entity.canonical_name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    Missing {missingCodes(entity).join(", ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
