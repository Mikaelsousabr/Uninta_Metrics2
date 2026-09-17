import type { CanonicalField, MetricRow, ValidationIssue, ValidationResult } from "../types";
import { FIELD_LABELS, IMPORTANT_FIELDS, NUMERIC_FIELDS, buildMapping } from "./columnMap";
import type { ParsedSheet } from "./parseFile";
import { humanizeResultIndicator } from "../resultTypes";
import { repairMojibake } from "../text";

function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  const raw = `${value}`.replace(/[R$\s%]/g, "").trim();
  if (!raw) return undefined;
  // Handles "1.234,56" and "1,234.56"
  const normalized =
    raw.includes(",") && raw.lastIndexOf(",") > raw.lastIndexOf(".")
      ? raw.replace(/\./g, "").replace(",", ".")
      : raw.replace(/,/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
}

function toDate(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const raw = `${value}`.trim();
  const br = raw.match(/^(\d{2})[/-](\d{2})[/-](\d{4})/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
}


function isLeadResult(indicator?: string): boolean {
  return humanizeResultIndicator(indicator).isLead;
}

function hashKey(parts: (string | undefined)[]): string {
  const input = parts.map((p) => p ?? "").join("|");
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return `k${(h >>> 0).toString(36)}`;
}

/**
 * Turn a parsed sheet into normalized rows plus a validation report.
 * `overrides` lets the user map unrecognized columns manually.
 */
export function validateSheet(
  sheet: ParsedSheet,
  importId: string,
  overrides: Record<string, CanonicalField | null> = {},
  existingKeys: Set<string> = new Set(),
): ValidationResult {
  const mapping = buildMapping(sheet.headers);
  for (const [header, field] of Object.entries(overrides)) {
    if (field) mapping[header] = field;
  }

  const inverse = new Map<CanonicalField, string>();
  for (const [header, field] of Object.entries(mapping)) {
    if (field && !inverse.has(field)) inverse.set(field, header);
  }

  const issues: ValidationIssue[] = [];
  const unrecognized = Object.entries(mapping)
    .filter(([, f]) => !f)
    .map(([h]) => h);
  const missing = IMPORTANT_FIELDS.filter((f) => !inverse.has(f));

  if (!inverse.has("campaign_name")) {
    return {
      ok: false,
      level: "error",
      issues: [
        {
          level: "error",
          title: "Coluna de campanha não encontrada",
          detail:
            "Não foi possível identificar a coluna com o nome da campanha. Use o mapeamento manual abaixo para indicá-la.",
        },
      ],
      rows: [],
      headers: sheet.headers,
      mapping,
      unrecognized,
      missing,
      campaigns: 0,
      adsets: 0,
      ads: 0,
      duplicates: 0,
    };
  }

  const rows: MetricRow[] = [];
  const campaigns = new Set<string>();
  const adsets = new Set<string>();
  const ads = new Set<string>();
  const seen = new Set<string>();
  let duplicates = 0;
  let minDate: string | undefined;
  let maxDate: string | undefined;

  for (const record of sheet.records) {
    const get = (field: CanonicalField) => {
      const header = inverse.get(field);
      return header === undefined ? undefined : record[header];
    };

    const campaignName = repairMojibake(`${get("campaign_name") ?? ""}`.trim()) ?? "";
    if (!campaignName) continue;

    const row: MetricRow = {
      campaign_name: campaignName,
      source: "meta_import",
      import_id: importId,
      row_key: "",
    };

    const date = toDate(get("date"));
    const periodStart = toDate(get("period_start"));
    const periodEnd = toDate(get("period_end"));
    if (date) row.date = date;
    if (periodStart) row.period_start = periodStart;
    if (periodEnd) row.period_end = periodEnd;
    const rangeStart = date ?? periodStart;
    const rangeEnd = date ?? periodEnd ?? periodStart;
    if (rangeStart && (!minDate || rangeStart < minDate)) minDate = rangeStart;
    if (rangeEnd && (!maxDate || rangeEnd > maxDate)) maxDate = rangeEnd;

    const textFields: CanonicalField[] = [
      "campaign_id",
      "campaign_status",
      "adset_id",
      "adset_name",
      "ad_id",
      "ad_name",
      "objective",
      "unit",
      "result_indicator",
      "attribution_setting",
    ];
    for (const field of textFields) {
      const value = get(field);
      if (value !== undefined && value !== null && `${value}`.trim() !== "") {
        (row as Record<string, unknown>)[field] = repairMojibake(`${value}`.trim()) ?? `${value}`.trim();
      }
    }

    for (const field of NUMERIC_FIELDS) {
      const value = toNumber(get(field));
      if (value !== undefined) (row as Record<string, unknown>)[field] = value;
    }

    const endDate = toDate(get("end_date"));
    if (endDate) row.end_date = endDate;

    // Meta's generic "Resultados" column changes meaning by campaign. Only
    // promote it to leads when the result indicator explicitly represents a lead/form conversion.
    if (row.leads === undefined && row.results !== undefined && isLeadResult(row.result_indicator)) {
      row.leads = row.results;
    }

    row.row_key = hashKey([
      row.date ?? row.period_start,
      row.period_end,
      row.campaign_id ?? row.campaign_name,
      row.adset_id ?? row.adset_name,
      row.ad_id ?? row.ad_name,
      row.spend?.toString(),
      row.impressions?.toString(),
      row.clicks?.toString(),
      row.leads?.toString(),
      row.results?.toString(),
      row.result_indicator,
    ]);

    if (seen.has(row.row_key) || existingKeys.has(row.row_key)) duplicates++;
    seen.add(row.row_key);

    campaigns.add(row.campaign_id ?? row.campaign_name);
    if (row.adset_name) adsets.add(`${row.campaign_name}::${row.adset_name}`);
    if (row.ad_name) ads.add(`${row.campaign_name}::${row.adset_name ?? ""}::${row.ad_name}`);

    rows.push(row);
  }

  if (!rows.length) {
    issues.push({
      level: "error",
      title: "Nenhuma linha válida encontrada",
      detail: "O arquivo foi lido, mas não há linhas com nome de campanha preenchido.",
    });
  } else {
    issues.push({
      level: "success",
      title: `${rows.length} linhas lidas`,
      detail: `${campaigns.size} campanhas, ${adsets.size} conjuntos e ${ads.size} anúncios identificados.`,
    });
    issues.push({
      level: "success",
      title: `${Object.values(mapping).filter(Boolean).length} colunas reconhecidas`,
      detail: `de ${sheet.headers.length} colunas presentes no arquivo.`,
    });
  }

  if (minDate && maxDate) {
    issues.push({
      level: "success",
      title: "Período identificado",
      detail: `${minDate} até ${maxDate}`,
    });
  } else {
    issues.push({
      level: "warning",
      title: "Período não identificado",
      detail: "Nenhuma data ou período de relatório foi reconhecido. As análises temporais ficarão indisponíveis.",
    });
  }

  for (const field of missing) {
    issues.push({
      level: "warning",
      title: `${FIELD_LABELS[field]} não encontrado`,
      detail: "Esta métrica ficará indisponível nas análises desta importação.",
    });
  }

  if (unrecognized.length) {
    issues.push({
      level: "warning",
      title: `${unrecognized.length} colunas não reconhecidas`,
      detail: unrecognized.slice(0, 6).join(", "),
    });
  }

  if (duplicates) {
    issues.push({
      level: "warning",
      title: `${duplicates} registros parecem já existir`,
      detail: "Você pode importar somente os registros novos para evitar duplicidade.",
    });
  }

  const level: ValidationResult["level"] = issues.some((i) => i.level === "error")
    ? "error"
    : issues.some((i) => i.level === "warning")
      ? "warning"
      : "success";

  return {
    ok: level !== "error",
    level,
    issues,
    rows,
    headers: sheet.headers,
    mapping,
    unrecognized,
    missing,
    period_start: minDate,
    period_end: maxDate,
    campaigns: campaigns.size,
    adsets: adsets.size,
    ads: ads.size,
    duplicates,
  };
}
