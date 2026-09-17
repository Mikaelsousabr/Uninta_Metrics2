/**
 * Domain model for UNINTA METRIC.
 * All records carry a `source` so future connectors (RD Station, Google Ads,
 * GA4) can coexist with Meta Ads file imports without changing consumers.
 */

export type DataSource = "meta_import" | "rd_station" | "calculated";

export type CampaignStatus = "ativa" | "pausada" | "encerrada" | "desconhecido";
export type ReportGranularity = "campaign" | "adset" | "ad" | "mixed";

/** Canonical metric fields the import engine tries to recognize. */
export type CanonicalField =
  | "date"
  | "period_start"
  | "period_end"
  | "campaign_id"
  | "campaign_name"
  | "campaign_status"
  | "adset_id"
  | "adset_name"
  | "ad_id"
  | "ad_name"
  | "objective"
  | "unit"
  | "spend"
  | "impressions"
  | "reach"
  | "frequency"
  | "clicks"
  | "link_clicks"
  | "ctr"
  | "cpc"
  | "cpm"
  | "results"
  | "result_indicator"
  | "cost_per_result"
  | "leads"
  | "landing_page_views"
  | "attribution_setting"
  | "end_date";

/** One normalized row extracted from an imported file. */
export interface MetricRow {
  date?: string;
  period_start?: string;
  period_end?: string;
  campaign_id?: string;
  campaign_name: string;
  campaign_status?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  objective?: string;
  unit?: string;
  spend?: number;
  impressions?: number;
  reach?: number;
  frequency?: number;
  clicks?: number;
  link_clicks?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  results?: number;
  result_indicator?: string;
  cost_per_result?: number;
  leads?: number;
  landing_page_views?: number;
  attribution_setting?: string;
  end_date?: string;
  source: DataSource;
  import_id: string;
  /** Stable hash used for duplicate detection. */
  row_key: string;
}

export interface ImportRecord {
  id: string;
  /** Grain of the Meta export. Used to relate complementary reports without summing them together. */
  granularity?: ReportGranularity;
  file_name: string;
  file_size: number;
  file_type: string;
  imported_at: string;
  period_start?: string;
  period_end?: string;
  rows: number;
  campaigns: number;
  adsets: number;
  ads: number;
  warnings: string[];
  status: "processado" | "processado_com_avisos" | "erro";
  /** Content-level integrity metadata. */
  fingerprint?: string;
  entity_signature?: string;
  quality_score?: number;
  integrity_status?: "ativo" | "ignorado_duplicado" | "ignorado_inferior";
  integrity_reason?: string;
  related_import_id?: string;
  user: string;
  recognized_columns: string[];
  unrecognized_columns: string[];
  missing_fields: CanonicalField[];
}

/** Aggregated view of a campaign, always derived from MetricRow[]. */
export interface CampaignAggregate {
  campaign_key: string;
  campaign_name: string;
  campaign_id?: string;
  objective?: string;
  unit?: string;
  status: CampaignStatus;
  spend?: number;
  impressions?: number;
  reach?: number;
  clicks?: number;
  link_clicks?: number;
  leads?: number;
  results?: number;
  result_indicator?: string;
  ctr?: number;
  cpc?: number;
  cpl?: number;
  period_start?: string;
  period_end?: string;
  rows: number;
}

export interface ValidationIssue {
  level: "success" | "warning" | "error";
  title: string;
  detail?: string;
}

export interface ValidationResult {
  ok: boolean;
  level: "success" | "warning" | "error";
  issues: ValidationIssue[];
  rows: MetricRow[];
  headers: string[];
  mapping: Record<string, CanonicalField | null>;
  unrecognized: string[];
  missing: CanonicalField[];
  period_start?: string;
  period_end?: string;
  campaigns: number;
  adsets: number;
  ads: number;
  duplicates: number;
}
