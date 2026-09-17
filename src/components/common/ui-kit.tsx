import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { METRIC_HELP, NO_DATA } from "@/lib/metrics";
import type { CampaignStatus, DataSource } from "@/lib/types";

/* ---------------- MetricTooltip ---------------- */

export function MetricTooltip({ label, help }: { label: string; help?: string }) {
  const text = help ?? METRIC_HELP[label];
  if (!text) return <>{label}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-help items-center gap-1 border-b border-dotted border-muted-foreground/50">
          {label}
          <Info className="size-3 text-muted-foreground" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-60">{text}</TooltipContent>
    </Tooltip>
  );
}

/* ---------------- MetricCard ---------------- */

export function MetricCard({
  label,
  value,
  help,
  icon,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  help?: string;
  icon?: ReactNode;
  hint?: string;
  highlight?: boolean;
}) {
  const unavailable = value === NO_DATA;
  return (
    <div
      className={cn(
        "panel flex flex-col gap-2 p-4",
        highlight && "border-primary/50 bg-primary/10",
      )}
    >
      <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {icon}
        <MetricTooltip label={label} help={help} />
      </div>
      {unavailable ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="font-display text-2xl text-muted-foreground">{NO_DATA}</span>
          </TooltipTrigger>
          <TooltipContent>Dado não disponível na fonte importada.</TooltipContent>
        </Tooltip>
      ) : (
        <span className="font-display text-2xl leading-tight font-semibold">{value}</span>
      )}
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  );
}

/* ---------------- StatusBadge ---------------- */

const STATUS_STYLE: Record<CampaignStatus, string> = {
  ativa: "bg-success/15 text-success border-success/30",
  pausada: "bg-warning/15 text-warning border-warning/30",
  encerrada: "bg-muted text-muted-foreground border-border",
  desconhecido: "bg-muted text-muted-foreground border-border",
};

const STATUS_LABEL: Record<CampaignStatus, string> = {
  ativa: "Ativa",
  pausada: "Pausada",
  encerrada: "Encerrada",
  desconhecido: "Sem status",
};

export function StatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        STATUS_STYLE[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/* ---------------- SourceBadge ---------------- */

const SOURCE_LABEL: Record<DataSource, string> = {
  meta_import: "Meta Ads — arquivo",
  rd_station: "RD Station",
  calculated: "Calculado",
};

export function SourceBadge({ source }: { source: DataSource }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-muted-foreground">
      Fonte: {SOURCE_LABEL[source]}
    </span>
  );
}

/* ---------------- DataQualityBadge ---------------- */

export function DataQualityBadge({
  level,
  available,
  missing,
  source,
  period,
}: {
  level: "completo" | "parcial" | "insuficiente";
  available: string[];
  missing: string[];
  source: string;
  period: string;
}) {
  const style =
    level === "completo"
      ? "border-success/40 text-success"
      : level === "parcial"
        ? "border-warning/40 text-warning"
        : "border-destructive/40 text-destructive";
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Qualidade dos dados</h3>
        <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium capitalize", style)}>
          {level}
        </span>
      </div>
      <dl className="mt-3 space-y-2 text-xs">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Fonte</dt>
          <dd className="text-right">{source}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Período</dt>
          <dd className="text-right">{period}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Dados CRM</dt>
          <dd className="text-right">Não conectados</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Disponíveis</dt>
          <dd className="mt-1 text-foreground/90">{available.join(", ") || NO_DATA}</dd>
        </div>
        {missing.length ? (
          <div>
            <dt className="text-muted-foreground">Ausentes</dt>
            <dd className="mt-1 text-warning">{missing.join(", ")}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

/* ---------------- EmptyState ---------------- */

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="panel flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {icon ? <div className="text-primary">{icon}</div> : null}
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description ? (
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

/* ---------------- ChartCard ---------------- */

export function ChartCard({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold">{title}</h2>
          {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}

/* ---------------- PageHeader ---------------- */

export function PageHeader({
  title,
  subtitle,
  quote,
  actions,
}: {
  title: string;
  subtitle?: string;
  quote?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="diagonal-glow mb-6 flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-card/50 p-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      <div className="relative z-10 flex items-center gap-3">
        {quote ? (
          <p className="hidden max-w-70 border-l-2 border-primary pl-3 text-sm text-muted-foreground italic lg:block">
            {quote}
          </p>
        ) : null}
        {actions}
      </div>
    </header>
  );
}
