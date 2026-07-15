"use client";

import { useEffect, useState } from "react";
import { ClipboardList, GaugeCircle, GraduationCap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";

// Tahap 0 — Penetapan Standar (diagram workflow): skema severity (M05), evidence
// grading (M06), dan template anotasi (M07). Data di-seed backend (read-only di
// sini) — halaman ini membuat Tahap 0 TERLIHAT, menjawab "Tahap 0 ada dimana?".

type SeveritySchemaRow = { id: number; code: string; fhir_severity_r4: string | null; fhir_severity_r5: string | null };
type EvidenceGradeRow = { id: number; code: string; description: string | null };
type TemplateRow = { id: number; name: string; style_guide: string | null };

export default function StandardsPage() {
  const [severities, setSeverities] = useState<SeveritySchemaRow[]>([]);
  const [grades, setGrades] = useState<EvidenceGradeRow[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data saat mount
    apiFetch<SeveritySchemaRow[]>("/config/severity-schemas").then(setSeverities).catch(() => {});
    apiFetch<EvidenceGradeRow[]>("/config/evidence-grades").then(setGrades).catch(() => {});
    apiFetch<TemplateRow[]>("/annotation-templates").then(setTemplates).catch(() => setTemplates([]));
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <GaugeCircle className="h-4 w-4 text-primary" /> Skema Severity (M05)
          </CardTitle>
          <CardDescription className="text-xs">
            Standar tingkat keparahan interaksi + pemetaan FHIR R4/R5 — dipakai lintas proyek, di-seed backend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>FHIR R4</TableHead>
                <TableHead>FHIR R5</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {severities.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px]">{row.code}</Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono">{row.fhir_severity_r4 ?? "-"}</TableCell>
                  <TableCell className="text-xs font-mono">{row.fhir_severity_r5 ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" /> Evidence Grading (M06)
          </CardTitle>
          <CardDescription className="text-xs">Standar tingkat bukti klinis untuk setiap interaksi.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grade</TableHead>
                <TableHead>Deskripsi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Badge className="bg-info/10 text-info border-info/20 text-[10px]">{row.code}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{row.description ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" /> Template Anotasi (M07)
          </CardTitle>
          <CardDescription className="text-xs">Template & style guide penulisan anotasi.</CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <p className="text-xs text-muted-foreground">Belum ada template anotasi.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Style Guide</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-xs font-medium">{row.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.style_guide ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
