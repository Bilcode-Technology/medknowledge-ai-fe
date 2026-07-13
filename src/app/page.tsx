"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Folder, FileText, Cpu, CheckCircle2, Clock, AlertTriangle, Eye, Plus } from "lucide-react";
import { ProtectedShell } from "@/components/protected-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiFetch, ApiError } from "@/lib/api";
import type { AiDraftAccuracy, AverageVerificationTime, Paginated, Project } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  source_upload: "Source Upload",
  metadata_validation: "Metadata Validation",
  ai_extraction: "AI Extraction",
  reference_check: "Reference Check",
  kfa_mapping: "KFA Mapping",
  ai_draft: "AI Draft",
  request_revision: "Revision Requested",
  senior_review: "Senior Review",
  published: "Published",
  fhir_sync: "FHIR Synced",
  maintenance: "Maintenance",
  auto_rejected: "Auto Rejected",
  reject_source: "Source Rejected",
};

function statusBadge(status: string) {
  if (status === "published" || status === "fhir_sync") {
    return (
      <Badge className="bg-success/10 text-success border-success/20 text-[10px] flex items-center gap-1 w-fit">
        <CheckCircle2 className="h-3 w-3" /> {STATUS_LABEL[status] ?? status}
      </Badge>
    );
  }
  if (status === "senior_review" || status === "request_revision") {
    return (
      <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px] flex items-center gap-1 w-fit">
        <AlertTriangle className="h-3 w-3" /> {STATUS_LABEL[status] ?? status}
      </Badge>
    );
  }
  return (
    <Badge className="bg-info/10 text-info border-info/20 text-[10px] flex items-center gap-1 w-fit">
      <Clock className="h-3 w-3" /> {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

function priorityBadge(priority: string) {
  const styles: Record<string, string> = {
    contraindicated: "bg-destructive/10 text-destructive border-destructive/20",
    major: "bg-warning/15 text-warning border-warning/25",
    moderate: "bg-warning/10 text-warning border-warning/20",
    minor: "bg-muted text-muted-foreground border-border",
  };
  return <Badge className={`${styles[priority] ?? styles.minor} text-[10px] capitalize`}>{priority}</Badge>;
}

export default function DashboardHome() {
  const [projects, setProjects] = useState<Paginated<Project> | null>(null);
  const [accuracy, setAccuracy] = useState<AiDraftAccuracy | null>(null);
  const [verificationTime, setVerificationTime] = useState<AverageVerificationTime | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  async function loadData() {
    try {
      const [projectsData, accuracyData, verificationData] = await Promise.all([
        apiFetch<Paginated<Project>>("/projects"),
        apiFetch<AiDraftAccuracy>("/reports/ai-draft-accuracy"),
        apiFetch<AverageVerificationTime>("/reports/average-verification-time"),
      ]);
      setProjects(projectsData);
      setAccuracy(accuracyData);
      setVerificationTime(verificationData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat data dashboard.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data saat mount, bukan derivasi sinkron dari props
    loadData();
  }, []);

  async function handleCreateProject(event: React.FormEvent) {
    event.preventDefault();
    setIsCreating(true);
    try {
      await apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify({ name: newProjectName, priority: "minor" }),
      });
      setNewProjectName("");
      setDialogOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal membuat proyek.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <ProtectedShell breadcrumb="Dashboard Overview">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Proyek</CardTitle>
            <Folder className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{projects?.total ?? "-"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Akurasi Draf AI</CardTitle>
            <Cpu className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {accuracy?.accuracy_rate_percent != null ? `${accuracy.accuracy_rate_percent}%` : "-"}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {accuracy ? `${accuracy.approved_first_pass}/${accuracy.total_pharmacist_reviews} disetujui first-pass` : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rata-rata Waktu Verifikasi</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {verificationTime?.average_hours != null ? `${verificationTime.average_hours} jam` : "-"}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{verificationTime ? `${verificationTime.sample_size} sampel` : ""}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="font-semibold">Clinical Knowledge Pipeline</CardTitle>
            <CardDescription className="text-xs">Proyek yang sedang berjalan di pipeline AI &amp; verifikasi.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button size="sm" className="gap-1">
                  <Plus className="h-3.5 w-3.5" /> Proyek Baru
                </Button>
              }
            />
            <DialogContent>
              <form onSubmit={handleCreateProject}>
                <DialogHeader>
                  <DialogTitle>Buat Proyek Baru</DialogTitle>
                </DialogHeader>
                <div className="space-y-1.5 py-3">
                  <Label htmlFor="project-name">Nama Proyek</Label>
                  <Input
                    id="project-name"
                    required
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="mis. Warfarin-Amiodarone Interaction Update"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Menyimpan..." : "Simpan"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-6 text-xs font-semibold">Nama Proyek</TableHead>
                <TableHead className="text-xs font-semibold">Prioritas</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="px-6 text-xs font-semibold text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects?.data.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="px-6">
                    <span className="font-medium text-xs text-foreground">{project.name}</span>
                  </TableCell>
                  <TableCell>{priorityBadge(project.priority)}</TableCell>
                  <TableCell>{statusBadge(project.status)}</TableCell>
                  <TableCell className="px-6 text-right">
                    <Button
                      render={<Link href={`/projects/${project.id}`} />}
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-primary hover:text-foreground"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" /> Lihat
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {projects?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6">
                    Belum ada proyek. Buat proyek baru untuk memulai.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </ProtectedShell>
  );
}
