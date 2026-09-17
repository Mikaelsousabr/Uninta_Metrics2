import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { ImportRecord, MetricRow, ReportGranularity } from "./types";
import { sourceScore } from "./import/integrity";

/**
 * Persistence layer. Today it writes to localStorage; the interface
 * (load/save/append) is intentionally small so it can be swapped for
 * Supabase/PostgreSQL without touching UI components.
 */

const ROWS_KEY = "uninta-metric:rows";
const IMPORTS_KEY = "uninta-metric:imports";
const AUTH_KEY = "uninta-metric:session";

interface DataState {
  rows: MetricRow[];
  imports: ImportRecord[];
}

let state: DataState = { rows: [], imports: [] };
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  state = {
    rows: read<MetricRow[]>(ROWS_KEY) ?? [],
    imports: read<ImportRecord[]>(IMPORTS_KEY) ?? [],
  };
  hydrated = true;
  emit();
}

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROWS_KEY, JSON.stringify(state.rows));
  window.localStorage.setItem(IMPORTS_KEY, JSON.stringify(state.imports));
}

export function commitImport(record: ImportRecord, rows: MetricRow[]) {
  state = {
    rows: [...state.rows, ...rows],
    imports: [record, ...state.imports],
  };
  persist();
  emit();
}

export function existingRowKeys(): Set<string> {
  return new Set(state.rows.map((r) => r.row_key));
}

export function deleteImport(importId: string) {
  state = {
    rows: state.rows.filter((r) => r.import_id !== importId),
    imports: state.imports.filter((i) => i.id !== importId),
  };
  persist();
  emit();
}

/** Rows from the most recently imported dataset. Historical imports remain stored,
 * but are not silently mixed into current-period analysis. */
export function activeRows(rows: MetricRow[], imports: ImportRecord[]): MetricRow[] {
  const latest = imports[0];
  return latest ? rows.filter((r) => r.import_id === latest.id) : [];
}


export function importGranularity(record: ImportRecord, rows: MetricRow[] = state.rows): ReportGranularity {
  if (record.granularity) return record.granularity;
  const own = rows.filter((r) => r.import_id === record.id);
  const hasAds = own.some((r) => Boolean(r.ad_name || r.ad_id));
  const hasSets = own.some((r) => Boolean(r.adset_name || r.adset_id));
  if (hasAds) return "ad";
  if (hasSets) return "adset";
  return "campaign";
}

/** Latest import for a specific grain. This lets campaign, ad-set and ad exports coexist. */
export function latestRowsByGranularity(rows: MetricRow[], imports: ImportRecord[], grain: "campaign" | "adset" | "ad"): MetricRow[] {
  // Select the strongest usable source, not merely the last uploaded file.
  // This prevents a partial/duplicate export from replacing a broader canonical base.
  const found = imports
    .filter((i) => importGranularity(i, rows) === grain && rows.some(r => r.import_id === i.id))
    .sort((a,b) => sourceScore(b) - sourceScore(a) || b.imported_at.localeCompare(a.imported_at))[0];
  return found ? rows.filter((r) => r.import_id === found.id) : [];
}

/** Portfolio metrics use the latest campaign-level report when available.
 * This prevents spend/impressions from being double counted when complementary
 * ad-set/ad reports cover the same campaigns and period. */
export function portfolioRows(rows: MetricRow[], imports: ImportRecord[]): MetricRow[] {
  const campaign = latestRowsByGranularity(rows, imports, "campaign");
  return campaign.length ? campaign : activeRows(rows, imports);
}

function sameCampaign(a: MetricRow, b: MetricRow): boolean {
  if (a.campaign_id && b.campaign_id) return a.campaign_id === b.campaign_id;
  return a.campaign_name.trim().toLocaleLowerCase("pt-BR") === b.campaign_name.trim().toLocaleLowerCase("pt-BR");
}

/** Complementary detail rows related to a campaign. They are for drill-down only;
 * never add their spend/impressions to the campaign aggregate. */
export function campaignDetailRows(base: MetricRow, rows: MetricRow[], imports: ImportRecord[], grain: "adset" | "ad"): MetricRow[] {
  return latestRowsByGranularity(rows, imports, grain).filter((r) => sameCampaign(base, r));
}

export type CampaignCoverageStatus = "complete" | "partial" | "campaign_only";
export interface CampaignCoverage {
  campaign: boolean;
  adset: boolean;
  ad: boolean;
  count: 1 | 2 | 3;
  status: CampaignCoverageStatus;
}

/** Coverage is relational: detail files only count when their rows can be tied to
 * the same campaign. Merely importing three files never marks every campaign complete. */
export function campaignCoverage(base: MetricRow, rows: MetricRow[], imports: ImportRecord[]): CampaignCoverage {
  const adset = campaignDetailRows(base, rows, imports, "adset").length > 0;
  const ad = campaignDetailRows(base, rows, imports, "ad").length > 0;
  const count = (1 + Number(adset) + Number(ad)) as 1 | 2 | 3;
  return { campaign: true, adset, ad, count, status: count === 3 ? "complete" : count === 1 ? "campaign_only" : "partial" };
}

export function clearData() {
  state = { rows: [], imports: [] };
  persist();
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const EMPTY: DataState = { rows: [], imports: [] };

export function useDataset(): DataState {
  useEffect(hydrate, []);
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY,
  );
}

/* ---------- session (local only; ready for real auth later) ---------- */

export interface Session {
  email: string;
  name: string;
}

export function readSession(): Session | null {
  return read<Session>(AUTH_KEY);
}

export function signIn(email: string): Session {
  const name = email
    .split("@")[0]
    .split(/[._-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
  const session: Session = { email, name: name || "Usuário" };
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  return session;
}

export function signOut() {
  window.localStorage.removeItem(AUTH_KEY);
}

export function useSession() {
  const get = useCallback(() => readSession(), []);
  return get();
}
