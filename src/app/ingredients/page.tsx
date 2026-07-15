"use client";

import { useEffect, useState } from "react";
import { Pill, Search } from "lucide-react";
import { ProtectedShell } from "@/components/protected-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import type { DrugEntity, KfaCodeItem, Paginated } from "@/lib/types";

// Tahap 1 — Akuisisi Bahan Aktif ber-kode KFA (diagram workflow): pencarian
// dataset KFA resmi Kemenkes (M22) + daftar entitas obat yang sudah dikenal
// sistem. Kode KFA di-import via `php artisan kfa:import`, BUKAN dikarang AI.

export default function IngredientsPage() {
  const [query, setQuery] = useState("");
  const [kfaResults, setKfaResults] = useState<KfaCodeItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [entities, setEntities] = useState<DrugEntity[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data saat mount
    apiFetch<Paginated<DrugEntity>>("/drug-entities")
      .then((res) => setEntities(res.data))
      .catch(() => setEntities([]));
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setKfaResults([]);
      setSearched(false);
      return;
    }
    const timeout = setTimeout(() => {
      apiFetch<KfaCodeItem[]>(`/kfa-codes/search?q=${encodeURIComponent(query.trim())}`)
        .then((items) => {
          setKfaResults(items);
          setSearched(true);
        })
        .catch(() => setKfaResults([]));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <ProtectedShell breadcrumb="Stage 1 — Ingredients (KFA)">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Pill className="h-4 w-4 text-primary" /> Active Ingredients — KFA Codes (Stage 1)
            </CardTitle>
            <CardDescription className="text-xs">
              Search active ingredients in the official KFA dataset (Kamus Farmasi & Alat Kesehatan, Kemenkes). This code
              becomes the interactant identity on ClinicalUseDefinition — not free text, not made up by AI.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative max-w-md">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search KFA... (e.g. warfarin)"
                className="pl-8"
              />
            </div>
            {searched && kfaResults.length === 0 && (
              <p className="text-xs text-warning">
                No results. If the KFA dataset hasn&apos;t been imported yet, run <code>php artisan kfa:import</code> on the
                server — distillation still works with a free-text substance name in the meantime (code assigned later).
              </p>
            )}
            {kfaResults.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>KFA Code</TableHead>
                    <TableHead>Display</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kfaResults.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs font-mono text-primary">{item.code}</TableCell>
                      <TableCell className="text-xs">{item.display}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Known Drug Entities (M22-M25)</CardTitle>
            <CardDescription className="text-xs">
              Active ingredients already in the system along with their terminology codes (KFA / RxNorm / ATC).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {entities.length === 0 ? (
              <p className="text-xs text-muted-foreground">No drug entities yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Canonical Name</TableHead>
                    <TableHead>KFA</TableHead>
                    <TableHead>RxNorm</TableHead>
                    <TableHead>ATC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entities.map((entity) => (
                    <TableRow key={entity.id}>
                      <TableCell className="text-xs font-medium">{entity.canonical_name}</TableCell>
                      <TableCell>
                        {entity.kfa_code ? (
                          <Badge className="bg-success/10 text-success border-success/20 text-[10px] font-mono">
                            {entity.kfa_code}
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">none</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{entity.rxnorm_code ?? "-"}</TableCell>
                      <TableCell className="text-xs font-mono">{entity.atc_code ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedShell>
  );
}
