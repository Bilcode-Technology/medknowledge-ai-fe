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
      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] flex items-center gap-1 w-fit">
        <CheckCircle2 className="h-3 w-3" /> {STATUS_LABEL[status] ?? status}
      </Badge>
    );
  }
  if (status === "senior_review" || status === "request_revision") {
    return (
      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] flex items-center gap-1 w-fit">
        <AlertTriangle className="h-3 w-3" /> {STATUS_LABEL[status] ?? status}
      </Badge>
    );
  }
  return (
    <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px] flex items-center gap-1 w-fit">
      <Clock className="h-3 w-3" /> {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

function priorityBadge(priority: string) {
  const styles: Record<string, string> = {
    contraindicated: "bg-red-500/10 text-red-400 border-red-500/20",
    major: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    moderate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    minor: "bg-slate-800 text-slate-300 border-slate-700",
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
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs text-rose-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-950/70 border-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Proyek</CardTitle>
            <Folder className="h-4 w-4 text-teal-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{projects?.total ?? "-"}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/70 border-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Akurasi Draf AI</CardTitle>
            <Cpu className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {accuracy?.accuracy_rate_percent != null ? `${accuracy.accuracy_rate_percent}%` : "-"}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {accuracy ? `${accuracy.approved_first_pass}/${accuracy.total_pharmacist_reviews} disetujui first-pass` : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/70 border-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rata-rata Waktu Verifikasi</CardTitle>
            <FileText className="h-4 w-4 text-sky-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {verificationTime?.average_hours != null ? `${verificationTime.average_hours} jam` : "-"}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{verificationTime ? `${verificationTime.sample_size} sampel` : ""}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-950/70 border-slate-900 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold text-white">Clinical Knowledge Pipeline</CardTitle>
            <CardDescription className="text-xs text-slate-400">Proyek yang sedang berjalan di pipeline AI &amp; verifikasi.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold h-8 text-xs gap-1">
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
                  <Button type="submit" disabled={isCreating} className="bg-teal-500 hover:bg-teal-600 text-slate-950">
                    {isCreating ? "Menyimpan..." : "Simpan"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="border border-slate-900 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-900/50">
                <TableRow className="border-b border-slate-900 hover:bg-transparent">
                  <TableHead className="text-xs text-slate-400 font-semibold">Nama Proyek</TableHead>
                  <TableHead className="text-xs text-slate-400 font-semibold">Prioritas</TableHead>
                  <TableHead className="text-xs text-slate-400 font-semibold">Status</TableHead>
                  <TableHead className="text-xs text-slate-400 font-semibold text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects?.data.map((project) => (
                  <TableRow key={project.id} className="border-b border-slate-900 hover:bg-slate-900/40 transition-colors">
                    <TableCell>
                      <span className="font-medium text-xs text-white">{project.name}</span>
                    </TableCell>
                    <TableCell>{priorityBadge(project.priority)}</TableCell>
                    <TableCell>{statusBadge(project.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        render={<Link href={`/projects/${project.id}`} />}
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-teal-400 hover:text-white hover:bg-slate-800"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> Lihat
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {projects?.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-xs text-slate-500 py-6">
                      Belum ada proyek. Buat proyek baru untuk memulai.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </ProtectedShell>
  );
}
