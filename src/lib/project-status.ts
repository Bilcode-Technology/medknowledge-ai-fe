// Project.status is a ~15-value system-driven enum (draft…maintenance) —
// shared between the dashboard Kanban, the pipeline-summary widget, and any
// other view that needs to label or group it, so the two never drift apart.
export const PROJECT_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  source_upload: "Source Upload",
  metadata_validation: "Metadata Validation",
  ai_extraction: "AI Extraction",
  reference_check: "Reference Check",
  kfa_mapping: "KFA Mapping",
  ai_draft: "AI Draft",
  pharmacist_review: "Pharmacist Review",
  request_revision: "Revision Requested",
  senior_review: "Senior Review",
  arbitration: "Arbitration",
  published: "Published",
  fhir_sync: "FHIR Synced",
  maintenance: "Maintenance",
  auto_rejected: "Auto Rejected",
  reject_source: "Source Rejected",
};

export type ProjectPhaseGroup = { key: string; title: string; statuses: string[] };

export const PROJECT_PHASE_GROUPS: ProjectPhaseGroup[] = [
  {
    key: "acquisition",
    title: "Acquisition",
    statuses: ["draft", "source_upload", "metadata_validation", "reject_source"],
  },
  {
    key: "extraction_decision",
    title: "Extraction & Decision",
    statuses: ["ai_extraction", "reference_check", "auto_rejected", "kfa_mapping", "ai_draft"],
  },
  {
    key: "review",
    title: "Review",
    statuses: ["pharmacist_review", "request_revision", "senior_review", "arbitration"],
  },
  {
    key: "done",
    title: "Done",
    statuses: ["published", "fhir_sync", "maintenance"],
  },
];
