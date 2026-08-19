"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBanner } from "@/components/ui/error-banner";
import { apiFetch, ApiError } from "@/lib/api";
import type { AdminUser, CostSummaryRow, Paginated } from "@/lib/types";

// Admin's operational overview: headcount (GET /users) and AI spend
// (GET /ai-playground/cost-summary) — the two admin-only aggregates that
// already existed but weren't surfaced anywhere on first load.
export function AdminOverviewWidget() {
  const [users, setUsers] = useState<Paginated<AdminUser> | null>(null);
  const [cost, setCost] = useState<CostSummaryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<Paginated<AdminUser>>("/users"),
      apiFetch<CostSummaryRow[]>("/ai-playground/cost-summary"),
    ])
      .then(([usersData, costData]) => {
        setUsers(usersData);
        setCost(costData);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load operational overview."));
  }, []);

  const totalCost = cost?.reduce((sum, row) => sum + (Number(row.total_cost_usd) || 0), 0);
  const activeUsers = users?.data.filter((u) => u.is_active).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Operational overview</CardTitle>
        <CardDescription>Headcount and AI spend at a glance</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {!users && !cost && !error && (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}
        {users && cost && (
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/users" className="rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
              <p className="text-2xl font-semibold tabular-nums text-foreground">{users.total}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Total users &middot; {activeUsers} active
              </p>
            </Link>
            <Link
              href="/admin/playground"
              className="rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
            >
              <p className="text-2xl font-semibold tabular-nums text-foreground">
                ${totalCost != null ? totalCost.toFixed(2) : "0.00"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">AI spend to date</p>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
