/** Repairs common UTF-8 text accidentally decoded as Windows-1252/Latin-1. */
export function repairMojibake(value?: string): string | undefined {
  if (!value || !/[ÃÂ]/.test(value)) return value;
  try {
    const bytes = Uint8Array.from([...value].map((c) => c.charCodeAt(0) & 0xff));
    const repaired = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return repaired.includes("�") ? value : repaired;
  } catch { return value; }
}
