# Arquitetura

| Camada | Arquivo | Dependências permitidas | Responsabilidade |
|---|---|---|---|
| Base | catalog.js | nenhuma | Fotos, categorias e produtos iniciais |
| Domínio | domain.js | nenhuma | Validação, pedido, estoque, despesas e cálculo do caixa |
| Dados e ações | store.js | catalog.js, domain.js | Persistência local e registro de ações |
| UI | app.js | catalog.js, store.js, hero-motion.js, cash-flow.js | Vitrine e administração |
| UI financeira | cash-flow.js | store.js | Formulário de despesas, filtros, totais e movimentações |

Verificador: `node scripts/check-layers.mjs`. Cobertura: imports e reexports ESM relativos literais; sem aliases ou imports dinâmicos neste produto. Fixtures permitida e proibida executadas a cada verificação. O domínio não acessa DOM, storage ou UI.

Persistência: um documento JSON em localStorage por origem, com produtos, pedidos e despesas. Uploads redimensionados a 1000 px e convertidos em WebP para reduzir uso de espaço; falhas de quota são mostradas sem anunciar salvamento. Não há garantias de transação entre abas simultâneas: implementar estoque no servidor antes da operação real.

Acessibilidade: lang pt-BR, link para conteúdo, HTML semântico, dialogs nativos, Escape, labels, foco visível, estados aria-pressed, anúncios de resultados e mensagens de erro, preferências de movimento reduzido, botões e filtros operáveis pelo teclado. Não foi realizada auditoria completa de conformidade WCAG.

UI adicional: hero-motion.js gerencia perspectiva sobre foto recortada, eventos e movimento reduzido; app.js importa e encerra seu ciclo de vida ao navegar. Não é malha 3D nem visualizador 360°.

Prévia 3D: vestido-3d.html e viewer-3d.js (UI) importam apenas vendor/model-viewer.min.js (terceiro Apache-2.0). Viewer externo ao catálogo; nenhuma regra de pedido foi alterada. O build distribui vendor/ e o GLB. scripts/validate-glb.mjs é uma verificação de desenvolvimento incluída no gate.

Responsividade: responsive.css carregado após hero.css centraliza ajustes até 800/600/380 px, com hero fluida em grid, controles de toque, formulários de 16 px e cartões de tabela no admin até 600 px. hero-motion.js inicia a animação automaticamente, sem controles de pausa. A preferência de movimento reduzido usa amplitude menor e desativa paralaxe; não exige ativação manual.
