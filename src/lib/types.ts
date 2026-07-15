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
  page_number: number | null;
  paragraph_number: number | null;
  citation_text: string | null;
  status: string;
  gate_reason: string | null;
  drug_a: DrugEntity | null;
  drug_b: DrugEntity | null;
  severity_schema: { id: number; code: string } | null;
  evidence_grade: { id: number; code: string } | null;
  source?: Source;
  annotation?: { id: number; status: string } | null;
  // M50 — AI Knowledge Distillation (5-field ClinicalUseDefinition).
  origin?: "document" | "ai_distillation";
  distillation_run_id?: number | null;
  effect?: string | null;
  management?: string | null;
  management_category?: string | null;
  reference_text?: string | null;
  kfa_code_a?: string | null;
  kfa_code_b?: string | null;
};

// M50 — AI Knowledge Distillation run (ingredient-first).
export type DistillationRun = {
  id: number;
  ingredient_name: string;
  ingredient_kfa_code: string | null;
  counterpart_name: string | null;
  counterpart_kfa_code: string | null;
  model: string;
  status: "queued" | "running" | "completed" | "failed";
  error: string | null;
  total_tokens: number | null;
  cost_usd: string | null;
  created_at: string;
  user?: { id: number; name: string };
  extractions?: Extraction[];
};

export type KfaCodeItem = { id: number; code: string; display: string };

export const MANAGEMENT_CATEGORY_LABELS: Record<string, string> = {
  monitor_closely: "Monitor closely",
  adjust_dose: "Adjust dose",
  avoid_combination: "Avoid combination",
  contraindicated: "Contraindicated",
  no_action: "No action needed",
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
  interaction_confirmed_in_source: "Interaction confirmed in source (false-positive guard)",
  no_missed_interactions: "No interactions were missed (false-negative guard)",
  severity_evidence_finalized: "Severity & evidence grade finalized",
  citation_validated: "Citation validated",
};

// M32 — Diff Viewer: respons GET /annotations/{id}/arbitration.
export type ArbitrationDiff = {
  original_content: string;
  proposed_content: string | null;
  proposed_by: { id: number; name: string } | null;
  dispute_notes: string | null;
};

// M46 — Notification Engine (in-app bell + preferensi channel).
export type NotificationItem = {
  id: string;
  type: string;
  data: { message: string; [key: string]: unknown };
  read_at: string | null;
  created_at: string;
};

export type NotificationPreferences = { email: boolean; whatsapp: boolean };

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

// M36 — GET /knowledge-repository/semantic-search?q=...
export type SemanticSearchResult = {
  annotation: Annotation;
  score: number;
};

// M47 — GET /enterprise-search?q=... (keyword Elasticsearch + semantic Qdrant, lintas entitas).
export type EnterpriseSearchResult = {
  entity_type: "annotation" | "drug_entity";
  source: "keyword" | "semantic";
  score: number;
  data: Record<string, unknown>;
};

// M49 — Administrator Panel & RBAC.
export type Role = { id: number; code: string; name: string };

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  role: Role | null;
  created_at: string;
};

// M03 — Disease/Drug Category Taxonomy (hierarkis via parent_id).
export type Category = {
  id: number;
  name: string;
  parent_id: number | null;
  parent?: Category | null;
};

// M08 — Global Reference Standards Registry.
export type ReferenceStandard = {
  id: number;
  name: string;
  version: string;
  source_url: string | null;
  description: string | null;
  published_at: string | null;
};

// M48 — AI Engine Playground & Cost Monitor.
export type PlaygroundModel = { id: string; object: string; owned_by: string };

export type PlaygroundChatResponse = {
  id: number;
  model: string;
  prompt: string;
  response_content: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  cost_usd: string | null;
};

export type CostSummaryRow = {
  model: string;
  call_count: number;
  total_tokens: number | null;
  total_cost_usd: string | null;
};
