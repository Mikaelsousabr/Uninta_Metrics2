# UNINTA Metric 0.3.1 — Data Integrity

- Análises usam por padrão apenas a importação mais recente; histórico continua armazenado.
- Importações antigas podem ser removidas individualmente no histórico.
- Funil corrigido: Resultados Meta não são mais tratados como etapa posterior a Leads.
- Distribuição de resultados separada do funil.
- Indicadores técnicos Meta recebem classificação humana, mantendo o código original para auditoria.
- Públicos/Criativos não misturam silenciosamente granularidades de arquivos antigos.
- Diagnósticos usam comparação contextual por categoria/unidade quando há amostra.
- Reparo de mojibake aplicado também aos valores textuais normalizados.
- Período e Impressões são reconhecidos pelos cabeçalhos reais do export Meta fornecido.
