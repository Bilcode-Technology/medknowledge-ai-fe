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
    <ProtectedShell breadcrumb="Tahap 1 — Bahan Aktif (KFA)">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Pill className="h-4 w-4 text-primary" /> Bahan Aktif — Kode KFA (Tahap 1)
            </CardTitle>
            <CardDescription className="text-xs">
              Cari zat aktif pada dataset KFA resmi (Kamus Farmasi & Alat Kesehatan, Kemenkes). Kode ini menjadi identitas
              interactant pada ClinicalUseDefinition — bukan free text, bukan dikarang AI.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative max-w-md">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari KFA... (mis. warfarin)"
                className="pl-8"
              />
            </div>
            {searched && kfaResults.length === 0 && (
              <p className="text-xs text-warning">
                Tidak ada hasil. Bila dataset KFA belum diimpor, jalankan <code>php artisan kfa:import</code> di server —
                sementara itu distilasi tetap bisa berjalan dengan nama zat free-text (kode di-assign belakangan).
              </p>
            )}
            {kfaResults.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode KFA</TableHead>
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
            <CardTitle className="text-sm">Entitas Obat Dikenal (M22-M25)</CardTitle>
            <CardDescription className="text-xs">
              Zat aktif yang sudah masuk sistem beserta kode terminologinya (KFA / RxNorm / ATC).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {entities.length === 0 ? (
              <p className="text-xs text-muted-foreground">Belum ada entitas obat.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Kanonis</TableHead>
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
                          <span className="text-[10px] text-muted-foreground">belum</span>
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
