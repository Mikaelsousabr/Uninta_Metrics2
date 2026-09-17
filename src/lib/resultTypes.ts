export type ResultFamily = "lead" | "engagement" | "conversation" | "reach" | "traffic" | "other" | "unknown";

export function humanizeResultIndicator(indicator?: string): { label: string; family: ResultFamily; isLead: boolean } {
  const raw = (indicator ?? "").trim();
  const v = raw.toLowerCase();
  if (!v) return { label: "Não informado", family: "unknown", isLead: false };
  if (v === "actions:lead") return { label: "Lead", family: "lead", isLead: true };
  if (v === "actions:leadgen.other") return { label: "Lead de formulário Meta", family: "lead", isLead: true };
  if (v.includes("fb_pixel_custom.form")) return { label: "Conversão de formulário no site", family: "lead", isLead: true };
  if (v.includes("fb_pixel_custom.lead") || v.includes("meta_leads")) return { label: "Lead rastreado no site", family: "lead", isLead: true };
  if (v.includes("messaging_conversation_started")) return { label: "Conversa iniciada", family: "conversation", isLead: false };
  if (v.includes("post_engagement")) return { label: "Engajamento com publicação", family: "engagement", isLead: false };
  if (v === "reach" || v.includes("reach")) return { label: "Alcance", family: "reach", isLead: false };
  if (v.includes("link_click") || v.includes("landing_page")) return { label: "Tráfego", family: "traffic", isLead: false };
  return { label: raw, family: "other", isLead: false };
}


/** Human-readable label for a raw Meta result indicator. */
export function resultLabel(indicator?: string): string {
  return humanizeResultIndicator(indicator).label;
}
