# Aceitação da etapa de front-end
Gerado por node scripts/report.mjs.

Total: 8 | Verificados: 8

| ID | Critério | Estado | Evidência |
|---|---|---|---|
| catalog-photos | 42 fotos preservadas, 39 cadastros e preço inicial autorizado | Verificado | tests/domain.test.mjs; docs/photo-manifest.json |
| categories | Categorias definidas pela análise das peças | Verificado | catalog.js; docs/catalog-analysis.md |
| identity | Poppins, hero grande e paleta do perfil | Verificado | index.html; styles.css; screenshot inspecionado no navegador |
| order-stock | Pedido reserva estoque, esgotados saem da vitrine e cancelamento repõe | Verificado | 6 testes de domínio e fluxo manual no navegador |
| admin-edit | Cadastro e edição de produtos com fotos, preço e estoque | Verificado | app.js; edição salva e inspecionada no navegador |
| mobile | Fluxos responsivos inspecionados em celular, tablet e horizontal | Verificado | docs/responsive-qa.md; QA 320/390/430/768/844 px e diálogos em 320 px |
| publication | Versão privada publicada com sucesso | Verificado | Sites: deployment appgdep_6adaaba5ea248191bdb0122ce4118555 succeeded; versão privada publicada |
| hero-autoplay | Vestido inicia animação contínua sem play/pausa | Verificado | Navegador: playButtons=0, animation=dress-float-gentle, iterations=infinite, state=running |

Esta medição cobre a demonstração de front-end. Requisitos de produção permanecem em docs/gaps.md.
