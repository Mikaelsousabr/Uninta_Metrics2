import type { CanonicalField, ImportRecord, ReportGranularity, ValidationResult } from "../types";

export type IntegrityDecision = "accept" | "duplicate" | "inferior";
export interface IntegrityAssessment { decision: IntegrityDecision; fingerprint: string; entity_signature: string; quality_score: number; reason?: string; related_import_id?: string }

function hash(input:string){let h=5381;for(let i=0;i<input.length;i++)h=((h<<5)+h+input.charCodeAt(i))|0;return `f${(h>>>0).toString(36)}`}
const norm=(v?:string)=>`${v??""}`.trim().toLocaleLowerCase("pt-BR");
export function inferGrain(v:ValidationResult):Exclude<ReportGranularity,"mixed">{return v.ads>0?"ad":v.adsets>0?"adset":"campaign"}
export function contentFingerprint(v:ValidationResult, grain:ReportGranularity){return hash([grain,v.period_start??"",v.period_end??"",...v.rows.map(r=>r.row_key).sort()].join("|"))}
export function entitySignature(v:ValidationResult, grain:ReportGranularity){
 const entities=v.rows.map(r=>grain==="ad"?`${norm(r.campaign_id??r.campaign_name)}>${norm(r.adset_id??r.adset_name)}>${norm(r.ad_id??r.ad_name)}`:grain==="adset"?`${norm(r.campaign_id??r.campaign_name)}>${norm(r.adset_id??r.adset_name)}`:norm(r.campaign_id??r.campaign_name));
 return hash([grain,v.period_start??"",v.period_end??"",...Array.from(new Set(entities)).sort()].join("|"));
}
export function qualityScore(v:ValidationResult, grain:ReportGranularity){
 const recognized=Object.values(v.mapping).filter(Boolean).length;
 const fields=new Set(Object.values(v.mapping).filter(Boolean) as CanonicalField[]);
 let score=recognized*2;
 if(fields.has("campaign_name"))score+=15;if(fields.has("campaign_id"))score+=8;
 if(grain==="adset"&&(fields.has("adset_name")||fields.has("adset_id")))score+=15;
 if(grain==="ad"&&(fields.has("ad_name")||fields.has("ad_id")))score+=15;
 if(grain==="ad"&&fields.has("adset_name"))score+=8;
 for(const f of ["spend","impressions","reach","clicks","link_clicks","results","result_indicator"] as CanonicalField[])if(fields.has(f))score+=3;
 return score;
}
export function assessIntegrity(v:ValidationResult, grain:Exclude<ReportGranularity,"mixed">, imports:ImportRecord[], batch:IntegrityAssessment[]=[]):IntegrityAssessment{
 const fingerprint=contentFingerprint(v,grain), entity_signature=entitySignature(v,grain), quality_score=qualityScore(v,grain);
 if(v.rows.length>0 && v.duplicates>=v.rows.length)return{decision:"duplicate",fingerprint,entity_signature,quality_score,reason:"Todos os registros deste arquivo já existem na base atual."};
 const exact=imports.find(i=>i.fingerprint===fingerprint && i.integrity_status!=="ignorado_duplicado") || batch.find(i=>i.fingerprint===fingerprint && i.decision==="accept");
 if(exact)return{decision:"duplicate",fingerprint,entity_signature,quality_score,reason:"Conteúdo idêntico a uma fonte já reconhecida.",related_import_id:"id" in exact?exact.id:undefined};
 const comparable=imports.filter(i=>i.granularity===grain&&i.entity_signature===entity_signature&&i.integrity_status!=="ignorado_duplicado").sort((a,b)=>(b.quality_score??0)-(a.quality_score??0))[0];
 if(comparable && (comparable.quality_score??0)>quality_score)return{decision:"inferior",fingerprint,entity_signature,quality_score,reason:"Existe uma fonte equivalente mais completa; esta versão não será usada nas análises.",related_import_id:comparable.id};
 return{decision:"accept",fingerprint,entity_signature,quality_score};
}
export function sourceScore(i:ImportRecord){
 if(i.integrity_status==="ignorado_duplicado"||i.integrity_status==="ignorado_inferior")return -1;
 const entityCount=i.granularity==="ad"?i.ads:i.granularity==="adset"?i.adsets:i.campaigns;
 return entityCount*1000+(i.quality_score??i.recognized_columns.length*2)+(i.rows>0?10:0);
}
