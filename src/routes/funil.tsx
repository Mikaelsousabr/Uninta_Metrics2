import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { MetricCard, PageHeader } from "@/components/common/ui-kit";
import { fmtNumber, groupCampaigns } from "@/lib/metrics";
import { portfolioRows, useDataset } from "@/lib/store";
import { humanizeResultIndicator } from "@/lib/resultTypes";
export const Route=createFileRoute("/funil")({component:Page});
function Page(){
 const ds=useDataset(); const rows=portfolioRows(ds.rows,ds.imports); const c=groupCampaigns(rows);
 const impressions=c.reduce((a,x)=>a+(x.impressions??0),0), clicks=c.reduce((a,x)=>a+(x.clicks??0),0), leads=c.reduce((a,x)=>a+(x.leads??0),0);
 const funnel=[['Impressões',impressions],['Cliques',clicks],['Leads classificados',leads]] as const;
 const byType=new Map<string,number>(); rows.forEach(r=>{if((r.results??0)>0){const label=humanizeResultIndicator(r.result_indicator).label;byType.set(label,(byType.get(label)??0)+(r.results??0))}});
 const types=[...byType].sort((a,b)=>b[1]-a[1]);
 return <AppShell><PageHeader title="Funil" subtitle="Conversão de mídia sem tratar tipos diferentes de resultado como etapas sequenciais."/>
 <div className="grid gap-4 md:grid-cols-3">{funnel.map(([l,v])=><MetricCard key={l} label={l} value={v?fmtNumber(v):'—'}/>)}</div>
 <section className="panel mt-6 p-6"><h2 className="font-display font-semibold">Conversão mensurável</h2><p className="mt-1 text-xs text-muted-foreground">Só exibimos uma taxa quando a etapa anterior existe no arquivo.</p><div className="mt-6 space-y-5">{funnel.map(([l,v],i)=>{const prev=i?funnel[i-1][1]:undefined;const valid=!!prev&&prev>0;const pct=valid?Math.min(100,v/prev*100):undefined;return <div key={l}><div className="mb-2 flex justify-between text-sm"><b>{l}</b><span>{v?fmtNumber(v):'Dado indisponível'}{i&&valid?` • ${(v/prev!*100).toFixed(2)}% da etapa anterior`:''}</span></div><div className="h-3 rounded-full bg-surface-2">{pct!==undefined?<div className="h-3 rounded-full bg-primary" style={{width:`${pct}%`}}/>:null}</div></div>})}</div></section>
 <section className="panel mt-6 overflow-hidden"><div className="border-b border-border p-5"><h2 className="font-display font-semibold">Distribuição dos resultados Meta</h2><p className="text-xs text-muted-foreground">Resultados são classificados por tipo e não entram como uma etapa posterior aos leads.</p></div><div className="divide-y divide-border">{types.map(([label,value])=><div key={label} className="flex justify-between p-4 text-sm"><span>{label}</span><b>{fmtNumber(value)}</b></div>)}</div></section>
 </AppShell>
}
