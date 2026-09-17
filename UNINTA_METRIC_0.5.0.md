# UNINTA Metric 0.5.0 — Complementary Intelligence

## Entregas
- Relatórios de Campanha, Conjunto e Anúncio podem coexistir no histórico.
- O consolidado usa o relatório de Campanha mais recente como fonte autoritativa, evitando dupla contagem.
- Públicos usa o relatório de Conjunto mais recente.
- Criativos usa o relatório de Anúncio mais recente.
- Campanha 360° relaciona detalhes complementares pelo ID da campanha ou, na ausência dele, pelo nome normalizado.
- Importações novas registram explicitamente a granularidade do relatório.
- Registros antigos continuam compatíveis: a granularidade é inferida pelos campos disponíveis.

## Regra de integridade
Relatórios complementares servem para drill-down. Investimento, impressões, cliques e resultados de granularidades diferentes nunca são somados entre si no consolidado.
