"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Folder, FileText, Cpu, Eye, Plus } from "lucide-react";
import { ProtectedShell } from "@/components/protected-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorBanner } from "@/components/ui/error-banner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { AiDraftAccuracy, AverageVerificationTime, Paginated, Project } from "@/lib/types";
import { PROJECT_PHASE_GROUPS, PROJECT_STATUS_LABEL } from "@/lib/project-status";
import { PipelineSummaryWidget } from "@/components/dashboard/pipeline-summary-widget";
import { BottleneckWidget } from "@/components/dashboard/bottleneck-widget";
import { RecentActivityWidget } from "@/components/dashboard/recent-activity-widget";
import { AdminOverviewWidget } from "@/components/dashboard/admin-overview-widget";
import { AcquisitionQueueWidget } from "@/components/dashboard/acquisition-queue-widget";
import { TerminologyQueueWidget } from "@/components/dashboard/terminology-queue-widget";
import { AnnotationQueueWidget } from "@/components/dashboard/annotation-queue-widget";
import { FhirQueueWidget } from "@/components/dashboard/fhir-queue-widget";

function priorityBadge(priority: string) {
  const tone = priority === "contraindicated" ? "destructive" : priority === "minor" ? "muted" : "warning";
  return (
    <StatusBadge tone={tone} className="capitalize">
      {priority}
    </StatusBadge>
  );
}

// Project pipeline overview — the closest thing to "everything, everywhere,"
// so it's shown only to the two roles actually responsible for the whole
// portfolio (PM, Admin), not surfaced as the default view for every role.
function PipelineBoard() {
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
      setError(err instanceof ApiError ? err.message : "Failed to load dashboard data.");
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
      setError(err instanceof ApiError ? err.message : "Failed to create project.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && <ErrorBanner>{error}</ErrorBanner>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Projects</CardTitle>
            <Folder className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{projects?.total ?? "-"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Draft Accuracy</CardTitle>
            <Cpu className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {accuracy?.accuracy_rate_percent != null ? `${accuracy.accuracy_rate_percent}%` : "-"}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {accuracy ? `${accuracy.approved_first_pass}/${accuracy.total_pharmacist_reviews} approved first-pass` : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg. Verification Time</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {verificationTime?.average_hours != null ? `${verificationTime.average_hours} hrs` : "-"}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{verificationTime ? `${verificationTime.sample_size} samples` : ""}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="font-semibold">Project Pipeline</CardTitle>
            <CardDescription className="text-xs">Every project currently in the AI &amp; verification pipeline.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button size="sm" className="gap-1">
                  <Plus className="h-3.5 w-3.5" /> New Project
                </Button>
              }
            />
            <DialogContent>
              <form onSubmit={handleCreateProject}>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-1.5 py-3">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    required
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. Warfarin-Amiodarone Interaction Update"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {PROJECT_PHASE_GROUPS.map((group) => {
              const groupProjects = projects?.data.filter((project) => group.statuses.includes(project.status)) ?? [];
              return (
                <div key={group.key} className="flex h-[600px] flex-col rounded-xl border border-border bg-muted/20">
                  <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.title}</h3>
                    <StatusBadge tone="muted">{groupProjects.length}</StatusBadge>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto p-2.5">
                    {groupProjects.map((project) => (
                      <Card key={project.id} className="shadow-sm">
                        <CardContent className="space-y-2 px-3 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-medium text-foreground">{project.name}</span>
                            {priorityBadge(project.priority)}
                          </div>
                          <StatusBadge tone="info">{PROJECT_STATUS_LABEL[project.status] ?? project.status}</StatusBadge>
                          <Button
                            render={<Link href={`/projects/${project.id}`} />}
                            nativeButton={false}
                            variant="ghost"
                            size="xs"
                            className="-ml-2 text-primary hover:text-foreground"
                          >
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                    {groupProjects.length === 0 && (
                      <p className="py-6 text-center text-[10px] text-muted-foreground">No projects.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const ROLE_LABEL: Record<string, string> = {
  project_manager: "Project Manager",
  data_acq_officer: "Data Acquisition Officer",
  terminologist: "Terminologist",
  pharmacist: "Pharmacist Reviewer",
  senior_reviewer: "Senior Reviewer",
  fhir_engineer: "FHIR Engineer",
  arbiter: "Clinical Arbitrator",
  admin: "Administrator",
};

export default function DashboardHome() {
  const { user } = useAuth();
  const roleCode = user?.role?.code;

  return (
    <ProtectedShell breadcrumb="Dashboard">
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          {roleCode ? `${ROLE_LABEL[roleCode] ?? user?.role?.name} dashboard` : "Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground">What&rsquo;s happening, what needs you, and what to do next.</p>
      </div>

      {roleCode === "project_manager" && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <PipelineSummaryWidget />
            <BottleneckWidget />
          </div>
          <RecentActivityWidget />
          <PipelineBoard />
        </>
      )}

      {roleCode === "admin" && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <AdminOverviewWidget />
            <RecentActivityWidget />
          </div>
          <PipelineSummaryWidget />
          <PipelineBoard />
        </>
      )}

      {roleCode === "data_acq_officer" && <AcquisitionQueueWidget />}

      {roleCode === "terminologist" && <TerminologyQueueWidget />}

      {roleCode === "pharmacist" && (
        <AnnotationQueueWidget
          status="draft"
          title="Pending review"
          description="Drafts ready for Pharmacist Review"
          emptyMessage="Nothing waiting on you right now."
        />
      )}

      {roleCode === "senior_reviewer" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <AnnotationQueueWidget
            status="senior_review"
            title="Escalations"
            description="Pharmacist-approved drafts awaiting your sign-off"
            emptyMessage="No escalations right now."
          />
          <AnnotationQueueWidget
            status="disputed"
            title="Disputes"
            description="Items you disputed, awaiting arbitration"
            emptyMessage="No open disputes."
          />
        </div>
      )}

      {roleCode === "arbiter" && (
        <AnnotationQueueWidget
          status="disputed"
          title="Arbitration queue"
          description="Reviewer disagreements awaiting a final decision"
          emptyMessage="No disputes to arbitrate."
        />
      )}

      {roleCode === "fhir_engineer" && <FhirQueueWidget />}
    </ProtectedShell>
  );
}
