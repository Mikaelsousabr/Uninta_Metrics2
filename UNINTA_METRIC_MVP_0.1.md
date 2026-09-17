# UNINTA Metric — MVP 0.1 continuation

This continuation completes the visible core without changing the existing import engine architecture.

## Implemented
- Institutional login with local MVP session.
- Performance overview driven by imported data only.
- XLSX/CSV import UI wired to the existing parser and validator.
- Automatic Meta Ads column normalization and manual mapping for unknown columns.
- Duplicate filtering against the local dataset.
- Import history and data-quality warnings.
- Campaign listing with calculated CTR/CPC/CPL.
- Campaign 360 with media KPIs, temporal performance, ad-set hierarchy, result-origin distribution, data-quality provenance and explicit CRM-empty state.
- UNINTA Metric metadata and pt-BR document language.

## Persistence
MVP 0.1 intentionally uses browser localStorage through `src/lib/store.ts`. This keeps the data layer replaceable by Supabase later.

## Next milestone
Test against a real Meta Ads export, refine aliases/aggregation based on the actual report shape, then move persistence/auth to Supabase and add RD Station coverage/quality matching.

## v0.1.2 — contrato real Meta Ads / UNINTA Medical
- Ajustado com o export real `[ON]CENTRO-UNI---SITE-Campanhas-1-de-jan-de-2026-16-de-set-de-2026.csv`.
- Reconhece início e encerramento do relatório como período, sem fingir granularidade diária.
- Reconhece Indicador de resultados, Configuração de atribuição e Término.
- `Resultados` não é tratado genericamente como `Leads`: somente indicadores explicitamente relacionados a lead/formulário promovem o valor para leads.
- Resultados de engajamento, alcance e conversa iniciada permanecem como resultados da Meta, sem serem somados a leads.
- Matching automático de colunas ficou conservador para impedir falso positivo em `Orçamento do conjunto de anúncios` como nome de conjunto.
- Ausência de conjunto/anúncio em export no nível Campanha não é tratada como erro.
