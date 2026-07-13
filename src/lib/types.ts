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
};

export type Annotation = {
  id: number;
  status: string;
  content: string;
  updated_at: string;
  project: Project;
  extraction: Extraction;
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
