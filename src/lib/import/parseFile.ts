import * as XLSX from "xlsx";

export interface ParsedSheet {
  headers: string[];
  records: Record<string, unknown>[];
}

/** Read a .xlsx/.csv file into raw header + record arrays (no normalization). */
export async function parseFile(file: File): Promise<ParsedSheet> {
  const buffer = await file.arrayBuffer();
  // CSV exports from Meta are UTF-8. Decoding explicitly prevents mojibake
  // such as "PÃ“S" when SheetJS guesses a legacy code page.
  const isCsv = file.name.toLowerCase().endsWith(".csv") || file.type.includes("csv");
  const workbook = isCsv
    ? XLSX.read(new TextDecoder("utf-8", { fatal: false }).decode(buffer).replace(/^\uFEFF/, ""), { type: "string", cellDates: true })
    : XLSX.read(buffer, { type: "array", cellDates: true });
  const first = workbook.SheetNames[0];
  if (!first) throw new Error("O arquivo não possui planilhas legíveis.");
  const sheet = workbook.Sheets[first];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false });
  if (!matrix.length) throw new Error("O arquivo está vazio.");

  // Meta Ads exports sometimes carry title rows: pick the densest first rows.
  let headerIndex = 0;
  let best = -1;
  for (let i = 0; i < Math.min(matrix.length, 5); i++) {
    const filled = (matrix[i] ?? []).filter((c) => c !== undefined && c !== null && `${c}`.trim() !== "").length;
    if (filled > best) {
      best = filled;
      headerIndex = i;
    }
  }

  const headers = (matrix[headerIndex] ?? []).map((h, i) =>
    h === undefined || h === null || `${h}`.trim() === "" ? `Coluna ${i + 1}` : `${h}`.trim(),
  );

  const records: Record<string, unknown>[] = [];
  for (let i = headerIndex + 1; i < matrix.length; i++) {
    const row = matrix[i] ?? [];
    if (row.every((c) => c === undefined || c === null || `${c}`.trim() === "")) continue;
    const record: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      record[h] = row[idx];
    });
    records.push(record);
  }

  return { headers, records };
}
