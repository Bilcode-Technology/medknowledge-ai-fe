export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};

export type Project = {
  id: number;
  name: string;
  status: string;
  priority: string;
  deadline: string | null;
  disease_category: { id: number; name: string } | null;
  drug_category: { id: number; name: string } | null;
  assigned_reviewer: { id: number; name: string } | null;
  created_at: string;
};

export type Source = {
  id: number;
  source_type: string;
  original_filename: string | null;
  title: string | null;
  doi: string | null;
  pmid: string | null;
  validation_status: string;
  ocr_status: string;
  is_primary_source: boolean | null;
  rejected_reason: string | null;
  created_at: string;
};

export type DrugEntity = {
  id: number;
  canonical_name: string;
  rxnorm_code: string | null;
  atc_code: string | null;
  kfa_code: string | null;
};

export type Extraction = {
  id: number;
  raw_drug_a_text: string;
  raw_drug_b_text: string;
  mechanism: string | null;
  confidence_score: string | null;
  citation_text: string | null;
  status: string;
  gate_reason: string | null;
  drug_a: DrugEntity | null;
  drug_b: DrugEntity | null;
  severity_schema: { id: number; code: string } | null;
  evidence_grade: { id: number; code: string } | null;
  source?: Source;
  annotation?: { id: number; status: string } | null;
};

export type AnnotationVersion = {
  id: number;
  version_number: number;
  content_snapshot: string;
  change_summary: string | null;
  changed_by: { id: number; name: string } | null;
  created_at: string;
};

export type Review = {
  id: number;
  review_role: string;
  decision: "approved" | "revision_requested" | "rejected" | "disputed";
  checklist_results: Record<string, boolean> | null;
  notes: string | null;
  decided_at: string;
  reviewer: { id: number; name: string };
};

export type Comment = {
  id: number;
  content: string;
  resolved: boolean;
  created_at: string;
  user: { id: number; name: string };
  replies: Comment[];
};

export type Annotation = {
  id: number;
  status: string;
  content: string;
  current_version_number: number;
  updated_at: string;
  project: Project;
  extraction: Extraction;
  versions?: AnnotationVersion[];
  reviews?: Review[];
  comments?: Comment[];
};

// M29 — 4 poin wajib checklist verifikasi Pharmacist sebelum bisa approve (lihat
// ReviewController::REQUIRED_CHECKLIST_KEYS di backend — urutan & key HARUS sama persis).
export const REQUIRED_CHECKLIST_KEYS = [
  "interaction_confirmed_in_source",
  "no_missed_interactions",
  "severity_evidence_finalized",
  "citation_validated",
] as const;

export const CHECKLIST_LABELS: Record<(typeof REQUIRED_CHECKLIST_KEYS)[number], string> = {
  interaction_confirmed_in_source: "Interaksi terkonfirmasi ada di sumber (guard false positive)",
  no_missed_interactions: "Tidak ada interaksi yang terlewat (guard false negative)",
  severity_evidence_finalized: "Severity & evidence grade sudah final",
  citation_validated: "Sitasi sudah tervalidasi",
};

// M32 — Diff Viewer: respons GET /annotations/{id}/arbitration.
export type ArbitrationDiff = {
  original_content: string;
  proposed_content: string | null;
  proposed_by: { id: number; name: string } | null;
  dispute_notes: string | null;
};

// M45 report shapes
export type AverageVerificationTime = { sample_size: number; average_hours: number | null };
export type AiDraftAccuracy = {
  total_pharmacist_reviews: number;
  approved_first_pass: number;
  accuracy_rate_percent: number | null;
};
export type ReviewerThroughput = {
  reviewer_id: number;
  review_count: number;
  reviewer: { id: number; name: string };
};
