# Arquitetura

| Camada | Arquivo | Dependências permitidas | Responsabilidade |
|---|---|---|---|
| Base | catalog.js | nenhuma | Fotos, categorias e produtos iniciais |
| Domínio | domain.js | nenhuma | Validação, pedido, baixa/restauração de estoque |
| Dados e ações | store.js | catalog.js, domain.js | Persistência local e registro de ações |
| UI | app.js | catalog.js, store.js | Vitrine e administração |

Verificador: `node scripts/check-layers.mjs`. Cobertura: imports e reexports ESM relativos literais; sem aliases ou imports dinâmicos neste produto. Fixtures permitida e proibida executadas a cada verificação. O domínio não acessa DOM, storage ou UI.

Persistência: um documento JSON em localStorage por origem, com produtos e pedidos. Uploads redimensionados a 1000 px e convertidos em WebP para reduzir uso de espaço; falhas de quota são mostradas sem anunciar salvamento. Não há garantias de transação entre abas simultâneas: implementar estoque no servidor antes da operação real.

Acessibilidade: lang pt-BR, link para conteúdo, HTML semântico, dialogs nativos, Escape, labels, foco visível, estados aria-pressed, anúncios de resultados e mensagens de erro, preferências de movimento reduzido, botões e filtros operáveis pelo teclado. Não foi realizada auditoria completa de conformidade WCAG.
