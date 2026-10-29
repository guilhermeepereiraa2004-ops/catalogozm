# ZM Exclusiva — instruções para agentes

Catálogo de moda feminina, com vitrine e admin de demonstração. Pedido original: site bonito e acessível, Poppins, hero com título grande, identidade inspirada no Instagram da loja, fotos locais e preço inicial de R$ 99,90.

Identidade atual aprovada pelo usuário: usar a logo fornecida (assets/logo-zm-exclusiva.jpg) e branco com rosa/dourado do card Rodapé.jpeg. Tokens centralizados em branding.css, carregado por último. Preservar cores das roupas; não retornar à paleta verde/creme anterior. Referência em docs/branding.md.

Hero atual: pedido de 2026-10-29 substituiu o vestido por adaptação da logo (assets/hero-logo-medallion.png), com flutuação suave. Preservar a logo original no cabeçalho/rodapé. Não recolocar vestido, GLB ou link 360 na hero sem novo pedido. Arte e prompt em docs/hero-logo.md.

Comece por `plan/STATUS.md`, `plan/execution-plan.md`, `ROADMAP.md` e `log/devlog.md`. Registre sua frente em `plan/LANES.md` antes de editar. Há uma raia única neste trabalho; não delegue sem solicitação.

## Regras
- Valores monetários em centavos inteiros; o catálogo inicial contém 39 cadastros, 42 fotos e preço de 9990 centavos.
- Não inventar tamanhos, composição dos tecidos, prazo/frete ou estoque real. Inicialmente: tamanho a confirmar e estoque demonstrativo de uma unidade por cadastro.
- Pedidos validam estoque agregado; esgotados somem da vitrine. Cancelamento repõe estoque uma única vez.
- Esta fase usa localStorage: não prometer sincronização entre aparelhos, autenticação administrativa ou cobrança real.
- Preservar todas as fotos fornecidas. Direitos de uso são de responsabilidade da loja que forneceu o material. Nenhum asset de terceiros foi copiado do Instagram; apenas referência visual e links públicos.
- Não expor segredos. Antes de entrega ou commit, execute `npm run gate`.

## Arquitetura e ações
`catalog.js` e `domain.js` não importam camadas superiores. `store.js` importa catálogo e domínio. `app.js` importa catálogo e store. `node scripts/check-layers.mjs` verifica imports ESM relativos literais e exercita fixture permitida/proibida. Imports dinâmicos e aliases não são usados nem verificados.

Ações estáveis em `store.js`: `order.create(cart, customer)`, `order.status(id,status)`, `product.save(product)`, `product.toggle(id)`. Validação reutilizável em `domain.js`. Permissões: demonstração local, sem autenticação; backend e autorização devem preceder operação real.

Fluxo de caixa: `expense.save(expense)` cria/edita despesas. Receitas são derivadas de pedidos Confirmado/Em separação/Concluído, uma vez por pedido, pela primeira confirmação. Cancelados não compõem receita. Preservar expenses nas ações e migrar armazenamento antigo sem perda. UI em cash-flow.js importa store.js; app.js importa cash-flow.js. Gate inclui 14 testes, com regras em tests/cash-flow.test.mjs.

## Executar e verificar
`npm run dev`: servidor em http://localhost:4173. `npm run build`: saída dist. `npm run gate`: sintaxe, camadas, testes de domínio e build. Lint e TypeScript não configurados (JavaScript ESM sem dependências). Testes de comportamento: `npm test`.

Inspeção visual e interações pelo navegador com cua_repl. `scripts/mobile-preview.html` fornece iframe de 390 × 844 para QA local, não é distribuído. Mudanças de UI exigem inspeção visual. Catálogo de aceite: `docs/acceptance.json`; relatório gerado por `node scripts/report.mjs`.

Memória operacional em plan/ e log/ permanece local via .gitignore; decisões e arquitetura em docs/ são versionadas. Ao concluir, atualize status, gaps, devlog e libere a raia. CI não existe neste projeto; o gate local é obrigatório.
