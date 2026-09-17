import type { CampaignAggregate, CampaignStatus, MetricRow } from "./types";

/**
 * Derived metric formulas (source: "calculated"):
 *   CTR = cliques / impressões * 100
 *   CPC = investimento / cliques
 *   CPL = investimento / leads
 * A metric is only calculated when both operands exist; otherwise undefined.
 */

export const METRIC_HELP: Record<string, string> = {
  CTR: "Percentual de pessoas que clicaram após visualizar o anúncio (cliques ÷ impressões × 100).",
  CPC: "Custo médio por clique (investimento ÷ cliques).",
  CPL: "Custo médio para gerar um lead (investimento ÷ leads).",
  CPM: "Custo por mil impressões.",
  Alcance: "Número de pessoas únicas que viram o anúncio.",
  Leads: "Contatos gerados pela campanha, conforme registrado na fonte importada.",
};

function sum(rows: MetricRow[], key: keyof MetricRow): number | undefined {
  let total = 0;
  let found = false;
  for (const row of rows) {
    const value = row[key];
    if (typeof value === "number") {
      total += value;
      found = true;
    }
  }
  return found ? total : undefined;
}

export function ratio(a?: number, b?: number, factor = 1): number | undefined {
  if (a === undefined || b === undefined || b === 0) return undefined;
  return (a / b) * factor;
}

function statusOf(raw?: string): CampaignStatus {
  const v = (raw ?? "").toLowerCase();
  if (!v) return "desconhecido";
  if (v.includes("activ") || v.includes("ativ") || v.includes("veicul")) return "ativa";
  if (v.includes("paus")) return "pausada";
  if (v.includes("encerr") || v.includes("complet") || v.includes("inactive") || v.includes("desativ"))
    return "encerrada";
  return "desconhecido";
}

export function campaignKey(row: MetricRow): string {
  return row.campaign_id ?? row.campaign_name;
}

export function aggregate(rows: MetricRow[], key: string, name: string): CampaignAggregate {
  const spend = sum(rows, "spend");
  const impressions = sum(rows, "impressions");
  const clicks = sum(rows, "clicks") ?? sum(rows, "link_clicks");
  const leads = sum(rows, "leads");
  const dates = rows.flatMap((r) => [r.date, r.period_start, r.period_end]).filter(Boolean) as string[];
  dates.sort();

  return {
    campaign_key: key,
    campaign_name: name,
    campaign_id: rows.find((r) => r.campaign_id)?.campaign_id,
    objective: rows.find((r) => r.objective)?.objective,
    unit: rows.find((r) => r.unit)?.unit,
    status: statusOf(rows.find((r) => r.campaign_status)?.campaign_status),
    spend,
    impressions,
    reach: sum(rows, "reach"),
    clicks,
    link_clicks: sum(rows, "link_clicks"),
    leads,
    results: sum(rows, "results"),
    result_indicator: rows.find((r) => r.result_indicator)?.result_indicator,
    ctr: ratio(clicks, impressions, 100),
    cpc: ratio(spend, clicks),
    cpl: ratio(spend, leads),
    period_start: dates[0],
    period_end: dates[dates.length - 1],
    rows: rows.length,
  };
}

export function groupCampaigns(rows: MetricRow[]): CampaignAggregate[] {
  const groups = new Map<string, MetricRow[]>();
  for (const row of rows) {
    const key = campaignKey(row);
    const list = groups.get(key);
    if (list) list.push(row);
    else groups.set(key, [row]);
  }
  return [...groups.entries()]
    .map(([key, list]) => aggregate(list, key, list[0].campaign_name))
    .sort((a, b) => (b.spend ?? 0) - (a.spend ?? 0));
}

export function groupBy(rows: MetricRow[], field: "adset_name" | "ad_name"): CampaignAggregate[] {
  const groups = new Map<string, MetricRow[]>();
  for (const row of rows) {
    const key = row[field] ?? "Não informado";
    const list = groups.get(key);
    if (list) list.push(row);
    else groups.set(key, [row]);
  }
  return [...groups.entries()]
    .map(([key, list]) => aggregate(list, key, key))
    .sort((a, b) => (b.spend ?? 0) - (a.spend ?? 0));
}

export interface TimePoint {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
}

export function timeSeries(rows: MetricRow[]): TimePoint[] {
  const map = new Map<string, TimePoint>();
  for (const row of rows) {
    if (!row.date) continue;
    const point = map.get(row.date) ?? {
      date: row.date,
      spend: 0,
      impressions: 0,
      clicks: 0,
      leads: 0,
    };
    point.spend += row.spend ?? 0;
    point.impressions += row.impressions ?? 0;
    point.clicks += row.clicks ?? row.link_clicks ?? 0;
    point.leads += row.leads ?? 0;
    map.set(row.date, point);
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const decimal2 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const NO_DATA = "—";

export function fmtCurrency(value?: number): string {
  return value === undefined ? NO_DATA : currency.format(value);
}
export function fmtNumber(value?: number): string {
  return value === undefined ? NO_DATA : decimal.format(value);
}
export function fmtPercent(value?: number): string {
  return value === undefined ? NO_DATA : `${decimal2.format(value)}%`;
}
export function fmtDate(value?: string): string {
  if (!value) return NO_DATA;
  const [y, m, d] = value.split("-");
  return d ? `${d}/${m}/${y}` : value;
}
