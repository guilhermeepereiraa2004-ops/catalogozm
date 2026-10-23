# Aceitação da etapa de front-end
Gerado por node scripts/report.mjs.

Total: 7 | Verificados: 6

| ID | Critério | Estado | Evidência |
|---|---|---|---|
| catalog-photos | 42 fotos preservadas, 39 cadastros e preço inicial autorizado | Verificado | tests/domain.test.mjs; docs/photo-manifest.json |
| categories | Categorias definidas pela análise das peças | Verificado | catalog.js; docs/catalog-analysis.md |
| identity | Poppins, hero grande e paleta do perfil | Verificado | index.html; styles.css; screenshot inspecionado no navegador |
| order-stock | Pedido reserva estoque, esgotados saem da vitrine e cancelamento repõe | Verificado | 6 testes de domínio e fluxo manual no navegador |
| admin-edit | Cadastro e edição de produtos com fotos, preço e estoque | Verificado | app.js; edição salva e inspecionada no navegador |
| mobile | Layout de celular inspecionado | Verificado | Iframe de 390 × 844 inspecionado no navegador; hero e catálogo |
| publication | Versão privada publicada com sucesso | Pendente | Pendente |

Esta medição cobre a demonstração de front-end. Requisitos de produção permanecem em docs/gaps.md.
