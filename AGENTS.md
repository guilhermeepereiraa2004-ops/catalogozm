# ZM Exclusiva — instruções para agentes

Catálogo de moda feminina, com vitrine e admin de demonstração. Pedido original: site bonito e acessível, Poppins, hero com título grande, identidade inspirada no Instagram da loja, fotos locais e preço inicial de R$ 99,90.

Repositório oficial definido em 2026-10-29: https://github.com/guilhermeepereiraa2004-ops/catalogozm.git, branch main, conectado ao projeto Vercel de Guilherme. Não enviar novas alterações ao repositório antigo andrelopees04-source/catalogo. Usar autenticação Git do responsável, sem copiar tokens para arquivos ou chat.

Identidade atual aprovada pelo usuário: usar a logo fornecida (assets/logo-zm-exclusiva.jpg) e branco com rosa/dourado do card Rodapé.jpeg. Tokens centralizados em branding.css; mobile.css deve ser carregado depois, como última camada responsiva. Preservar cores das roupas; não retornar à paleta verde/creme anterior. Referência em docs/branding.md e docs/mobile-refresh.md.

Hero atual: pedido de 2026-10-29 substituiu o vestido por adaptação da logo (assets/hero-logo-medallion.png), com flutuação suave. Preservar a logo original no cabeçalho/rodapé. Não recolocar vestido, GLB ou link 360 na hero sem novo pedido. Arte e prompt em docs/hero-logo.md.

Comece por `plan/STATUS.md`, `plan/execution-plan.md`, `ROADMAP.md` e `log/devlog.md`. Registre sua frente em `plan/LANES.md` antes de editar. Há uma raia única neste trabalho; não delegue sem solicitação.

## Regras
- Valores monetários em centavos inteiros; o catálogo inicial contém 39 cadastros, 42 fotos e preço de 9990 centavos.
- Não inventar tamanhos, composição dos tecidos, prazo/frete ou estoque real. Inicialmente: tamanho a confirmar e estoque demonstrativo de uma unidade por cadastro.
- Pedidos validam estoque agregado; esgotados somem da vitrine. Cancelamento repõe estoque uma única vez.
- Dados da loja persistem no Neon via API. Sacola e favoritos permanecem locais. Sites permanece privado. Vercel tem vitrine pública e admin com sessão própria de e-mail/senha no mesmo domínio. Não há cobrança integrada.
- Preservar todas as fotos fornecidas. Direitos de uso são de responsabilidade da loja que forneceu o material. Nenhum asset de terceiros foi copiado do Instagram; apenas referência visual e links públicos.
- Não expor segredos. Antes de entrega ou commit, execute `npm run gate`.

## Arquitetura e ações
`catalog.js` e `domain.js` não importam camadas superiores. `store.js` é cliente assíncrono da API e reexporta utilitários de domínio. `server/api.js` valida ações no servidor e `server/database.js` persiste no Neon. `app.js` importa catálogo e store. `node scripts/check-layers.mjs` verifica imports ESM relativos literais e exercita fixture permitida/proibida. Imports dinâmicos e aliases não são usados nem verificados.

Ações estáveis em `store.js`: `order.create(cart, customer)`, `order.status(id,status)`, `product.save(product)`, `product.toggle(id)`. Validação reutilizável em `domain.js`. Permissões: local restrito a loopback; hospedagem privada usa identidade confiável do Sites para admin. Não confiar em headers do cliente fora do dispatch do Sites. Ver docs/database.md e docs/vercel.md.

Fluxo de caixa: `expense.save(expense)` cria/edita despesas; `income.save(income)` cria/edita receitas avulsas em state.incomes, sem alterar estoque. Receitas de pedidos Confirmado/Em separação/Concluído são derivadas uma vez por pedido, pela primeira confirmação. Cancelados não compõem receita; receitas avulsas permanecem. Preservar expenses/incomes nas ações e tratar listas ausentes como vazias. Nenhum financeiro é exposto no catálogo público. UI em cash-flow.js importa store.js; app.js importa cash-flow.js. Gate inclui 22 testes, com regras em tests/cash-flow.test.mjs.

Vitrine: sacola e WhatsApp fixos em uma pilha no canto inferior direito, somente na loja. Contadores do cabeçalho e flutuante compartilham a mesma sacola. Manter safe areas, foco acessível e diálogos acima dos atalhos.

Checkout: somente Ubaitaba finaliza pelo site; pergunta Sim/Não sem seleção inicial. Não (incluindo Aurelino Leal) direciona ao WhatsApp para combinar frete, sem reserva. Novos pedidos exigem localDelivery=yes, endereço e paymentMethod pix/arrange. Payment permanece Pendente, frete não calculado. QR estático com CPF/titular fornecidos e autorizados pelo dono em pix.js/assets/pix-zm-exclusiva.png, exibido após criar pedido Pix; não marcar pago automaticamente. Ver docs/checkout.md. Gate atual com 25 testes, incluindo Pix.

## Executar e verificar
`npm run dev`: servidor em http://localhost:4173. `npm run build`: saída dist. `npm run gate`: sintaxe, camadas, testes de domínio e build. Lint e TypeScript não configurados (JavaScript ESM). Testes de comportamento: `npm test`.

Inspeção visual e interações pelo navegador com cua_repl. `scripts/mobile-preview.html` fornece iframe de 390 × 844 para QA local, não é distribuído. Mudanças de UI exigem inspeção visual. Catálogo de aceite: `docs/acceptance.json`; relatório gerado por `node scripts/report.mjs`.

Memória operacional em plan/ e log/ permanece local via .gitignore; decisões e arquitetura em docs/ são versionadas. Ao concluir, atualize status, gaps, devlog e libere a raia. CI não existe neste projeto; o gate local é obrigatório.

Vercel: usar somente a equipe de Guilherme Pereira, team_NseDl6bHKTOowzX904mmIj0U / guilherme-pereiras-projects-5a38e3ba. Projeto prj_hYAN6ILZ6N9eE4uQGQqswn0H0AHd. Adaptador server/vercel.js, build:vercel e public para esta plataforma; preservar o build Worker do Sites. Admin exige sessão Better Auth válida e vínculo em zm_auth_admin. VERCEL_PRIVATE_ADMIN não concede acesso. Nunca confiar em oai-* fora do Sites. Ver docs/vercel.md.

Publicação autorizada em 2026-10-29: produção https://zm-exclusiva-tau.vercel.app sem login; admin https://zm-exclusiva-tau.vercel.app/admin com e-mail e senha da loja. Standard Protection deve manter todas as previews privadas. Nunca autorizar admin sem sessão e vínculo por usuário, nunca remover a proteção global com ssoProtection=null. /api/state e mutações administrativas no domínio público devem retornar 401 sem sessão e vínculo administrativo.

Autenticação atual: Better Auth em server/auth.js; primeiro acesso por ativação HTTPS temporária e de uso único, fechada depois do primeiro usuário. Signup sem ativação bloqueado. AUTH_DATABASE_URL e BETTER_AUTH_SECRET só no servidor. Vercel não autentica administradores da loja. Ver docs/admin-auth.md.
