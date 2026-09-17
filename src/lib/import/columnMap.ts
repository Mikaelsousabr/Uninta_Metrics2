import type { CanonicalField } from "../types";

/**
 * Column normalization layer: maps loose header labels (PT/EN, Meta Ads
 * exports, manual spreadsheets) onto canonical fields. Matching is
 * accent/case/punctuation insensitive and falls back to substring rules.
 */

export const FIELD_LABELS: Record<CanonicalField, string> = {
  date: "Data",
  period_start: "Início dos relatórios",
  period_end: "Encerramento dos relatórios",
  campaign_id: "ID da campanha",
  campaign_name: "Campanha",
  campaign_status: "Status da campanha",
  adset_id: "ID do conjunto",
  adset_name: "Conjunto de anúncios",
  ad_id: "ID do anúncio",
  ad_name: "Anúncio",
  objective: "Objetivo",
  unit: "Unidade",
  spend: "Investimento",
  impressions: "Impressões",
  reach: "Alcance",
  frequency: "Frequência",
  clicks: "Cliques",
  link_clicks: "Cliques no link",
  ctr: "CTR",
  cpc: "CPC",
  cpm: "CPM",
  results: "Resultados",
  result_indicator: "Indicador de resultados",
  cost_per_result: "Custo por resultado",
  leads: "Leads",
  landing_page_views: "Visualizações da página de destino",
  attribution_setting: "Configuração de atribuição",
  end_date: "Término",
};

export const NUMERIC_FIELDS: CanonicalField[] = [
  "spend",
  "impressions",
  "reach",
  "frequency",
  "clicks",
  "link_clicks",
  "ctr",
  "cpc",
  "cpm",
  "results",
  "cost_per_result",
  "leads",
  "landing_page_views",
];

const ALIASES: Record<CanonicalField, string[]> = {
  date: ["data", "dia", "date", "day"],
  period_start: ["inicio dos relatorios", "reporting starts", "reporting start"],
  period_end: ["encerramento dos relatorios", "reporting ends", "reporting end"],
  campaign_id: ["id da campanha", "campaign id", "identificacao da campanha"],
  campaign_name: ["campanha", "nome da campanha", "campaign name", "campaign"],
  campaign_status: ["status da campanha", "campaign delivery", "veiculacao da campanha", "status"],
  adset_id: ["id do conjunto de anuncios", "ad set id", "adset id"],
  adset_name: ["conjunto de anuncios", "nome do conjunto de anuncios", "ad set name", "adset", "conjunto"],
  ad_id: ["id do anuncio", "ad id"],
  ad_name: ["anuncio", "nome do anuncio", "ad name", "criativo", "nome do criativo"],
  objective: ["objetivo", "objective", "objetivo da campanha"],
  unit: ["unidade", "polo", "campus", "unit"],
  spend: [
    "investimento",
    "valor usado brl",
    "valor usado",
    "amount spent brl",
    "amount spent",
    "spend",
    "custo",
    "gasto",
    "valor gasto",
    "valor gasto brl",
  ],
  impressions: ["impressoes", "impressions"],
  reach: ["alcance", "reach", "pessoas alcancadas"],
  frequency: ["frequencia", "frequency"],
  clicks: ["cliques", "clicks", "cliques todos", "clicks all"],
  link_clicks: ["cliques no link", "link clicks", "cliques em links"],
  ctr: ["ctr", "ctr todos", "taxa de cliques", "ctr link click through rate"],
  cpc: ["cpc", "custo por clique", "cpc custo por clique no link"],
  cpm: ["cpm", "custo por mil impressoes", "cpm custo por 1 000 impressoes brl"],
  results: ["resultados", "results"],
  result_indicator: ["indicador de resultados", "result indicator", "result type"],
  cost_per_result: ["custo por resultado", "cost per result", "custo por resultados"],
  leads: ["leads", "cadastros", "clientes potenciais", "resultados de leads", "lead"],
  attribution_setting: ["configuracao de atribuicao", "attribution setting"],
  end_date: ["termino", "ends", "end date"],
  landing_page_views: [
    "visualizacoes da pagina de destino",
    "landing page views",
    "visualizacoes de pagina de destino",
  ],
};

export function normalizeHeader(value: string): string {
  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[()[\]{}.,:;%$#*/\\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Resolve one header to a canonical field, or null when unknown. */
export function matchField(header: string): CanonicalField | null {
  const n = normalizeHeader(header);
  if (!n) return null;
  for (const [field, aliases] of Object.entries(ALIASES) as [CanonicalField, string[]][]) {
    if (aliases.some((a) => a === n)) return field;
  }
  // Keep automatic matching conservative. Meta exports contain headers such as
  // "Orçamento do conjunto de anúncios"; broad substring matching would wrongly
  // classify that as the ad-set name. Unknown columns are safer in manual mapping.
  return null;
}

/** Build the mapping for a full header row, avoiding duplicate assignments. */
export function buildMapping(headers: string[]): Record<string, CanonicalField | null> {
  const mapping: Record<string, CanonicalField | null> = {};
  const taken = new Set<CanonicalField>();
  for (const h of headers) {
    const field = matchField(h);
    if (field && !taken.has(field)) {
      mapping[h] = field;
      taken.add(field);
    } else {
      mapping[h] = null;
    }
  }
  return mapping;
}

/** Fields that matter enough to warn about when absent. */
export const IMPORTANT_FIELDS: CanonicalField[] = [
  "campaign_name",
  "spend",
  "impressions",
];
