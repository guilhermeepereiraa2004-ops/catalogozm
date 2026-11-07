# Revisão mobile — 2026-10-29

mobile.css é a última camada de estilos, após branding.css. Aplica a vitrine, o checkout demonstrativo e todos os módulos do admin, preservando a paleta e as logos.

## Regras implementadas

- Até 900 px: cabeçalho compacto e fixo durante a rolagem, menu recolhido com alvos de toque de 44/48 px; hero em uma coluna, imagem quadrada fluida, título proporcional, texto legível e CTA largo. Card e frases decorativas recolhem nas telas pequenas para priorizar logo e ação.
- Catálogo: três colunas em tablet e duas até 600 px, filtros em linhas, busca e ordenação sem largura mínima excedente. Produtos com botões visíveis sem depender de hover, nomes com quebra de linha e favoritos de 44 px. Coleções e rodapé com duas colunas, uma abaixo de 360/280 px conforme conteúdo.
- Diálogos: largura limitada pela tela, rolagem própria, botão de fechar fixo dentro da área rolável (sticky), campos de pelo menos 16 px e botões de 48/50 px. Sacola ocupa a tela nos celulares; formulários passam a uma coluna até 480 px. Espaço inferior considera safe-area.
- Admin (atualizado em 2026-11-07): até 900 px, cabeçalho compacto com botão Menu e módulo atual. Os nove módulos e as ações da conta ficam em um diálogo lateral com rolagem própria e item ativo identificado. Trocar de módulo fecha o menu; Escape e toque fora também fecham, com retorno do foco ao botão. Tabelas de pedidos, produtos e caixa passam a cartões, com rótulos das células. Resumos e filtros usam uma ou duas colunas conforme a largura; valores e textos longos podem quebrar linha. A sidebar e o cabeçalho de desktop são preservados.
- Menu: foco entra nos links ao abrir, Escape fecha e devolve foco ao botão; toque fora fecha. Recolhe ao abrir sacola/busca ou mudar de breakpoint. Navegação do admin leva foco ao título da seção.

## Verificação de 2026-11-07

Inspeção visual em navegador com dados fictícios isolados: os nove módulos abriram pelo menu, o formulário de produto e o cadastro de usuários continuaram acessíveis, Escape devolveu o foco ao botão e as ações da conta ficaram acessíveis pela rolagem do diálogo. Conferidos viewports de 320, 390, 768 e 1280 px, sem transbordamento horizontal nas telas revisadas. No mobile, a mensagem técnica demonstrativa deixa de ocupar o início da página e o foco programático no título não desenha uma borda em volta do texto. Os controles interativos preservam seus indicadores de foco.

Gate completo aprovado com 57 testes, sintaxe, camadas, GLB e build. O teste integrado cobre abertura do menu, navegação para outro módulo, fechamento e abertura de ação da conta. Nenhum dado real da loja foi alterado.

### Ajustes após a revisão dos formulários

Campos de texto, data, horário e seleção do conteúdo administrativo usam 16 px até 900 px. O botão de remover foto tem alvo de 44 × 44 px. O To-do mantém a caixa visual pequena dentro de um label clicável de 44 × 44 px, com ações abaixo do conteúdo em telas móveis.

Em 390 × 844 px, foram conferidos cadastro com foto, preço/estoque, busca e confirmação de pedido, venda dividida e quitação de fiado, receitas/despesas, exclusão/restauração, filtros e PDF do catálogo, agenda até retirada e tarefas até reabertura/exclusão. As 20 mutações fictícias responderam HTTP 200 e os valores finais foram conferidos no estado isolado. Fontes e alvos ampliados foram medidos e acionados no navegador. O PDF filtrado foi baixado e renderizado para inspeção.

A rodada complementar em 320 px, o download de PNG do look e os formulários da conta não foram concluídos: o navegador embutido ficou indisponível e a ferramenta interrompeu a alternativa no Chrome por não conseguir confirmar sua URL. A publicação desses ajustes foi solicitada explicitamente após informar essa limitação.

## Histórico da revisão inicial

Gate aprovado: sintaxe ESM, camadas, 14 testes de domínio/caixa, GLB e build. mobile.css distribuído em dist e servido com HTTP 200; index carrega a folha depois de branding.css. Delimitadores CSS conferidos. Nenhum teste de navegador desta revisão foi concluído.

A prévia automatizada de localhost continua abrindo outro projeto. A alternativa de prévia isolada em data: foi bloqueada pela política de protocolos do navegador e não foi repetida por outro meio; seu script temporário foi removido. A URL HTTPS real da loja abre o gate normal de login. Ao seguir “Continuar com o ChatGPT”, a revisão automática negou o redirecionamento para auth.openai.com por falta de autorização explícita para esse destino. Foi solicitada autorização ao usuário; nenhuma nova tentativa de login foi feita sem resposta. Inspeção visual e teste em viewports móveis permanecem pendentes.

As medidas acima descrevem a implementação, e não resultados medidos em navegador. A loja continua demonstrativa, com dados locais; nenhum pedido ou lançamento real foi modificado nesta revisão.
