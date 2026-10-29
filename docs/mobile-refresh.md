# Revisão mobile — 2026-10-29

mobile.css é a última camada de estilos, após branding.css. Aplica a vitrine, o checkout demonstrativo e todos os módulos do admin, preservando a paleta e as logos.

## Regras implementadas

- Até 900 px: cabeçalho compacto e fixo durante a rolagem, menu recolhido com alvos de toque de 44/48 px; hero em uma coluna, imagem quadrada fluida, título proporcional, texto legível e CTA largo. Card e frases decorativas recolhem nas telas pequenas para priorizar logo e ação.
- Catálogo: três colunas em tablet e duas até 600 px, filtros em linhas, busca e ordenação sem largura mínima excedente. Produtos com botões visíveis sem depender de hover, nomes com quebra de linha e favoritos de 44 px. Coleções e rodapé com duas colunas, uma abaixo de 360/280 px conforme conteúdo.
- Diálogos: largura limitada pela tela, rolagem própria, botão de fechar fixo dentro da área rolável (sticky), campos de pelo menos 16 px e botões de 48/50 px. Sacola ocupa a tela nos celulares; formulários passam a uma coluna até 480 px. Espaço inferior considera safe-area.
- Admin: navegação em quatro colunas de tablet e duas no celular; tabelas de pedidos, produtos e caixa passam a cartões até 900 px, com rótulos das células. Resumos e filtros usam uma ou duas colunas conforme a largura; valores e textos longos podem quebrar linha.
- Menu: foco entra nos links ao abrir, Escape fecha e devolve foco ao botão; toque fora fecha. Recolhe ao abrir sacola/busca ou mudar de breakpoint. Navegação do admin leva foco ao título da seção.

## Verificação e pendência

Gate aprovado: sintaxe ESM, camadas, 14 testes de domínio/caixa, GLB e build. mobile.css distribuído em dist e servido com HTTP 200; index carrega a folha depois de branding.css. Delimitadores CSS conferidos. Nenhum teste de navegador desta revisão foi concluído.

A prévia automatizada de localhost continua abrindo outro projeto. A alternativa de prévia isolada em data: foi bloqueada pela política de protocolos do navegador e não foi repetida por outro meio; seu script temporário foi removido. A URL HTTPS real da loja abre o gate normal de login. Ao seguir “Continuar com o ChatGPT”, a revisão automática negou o redirecionamento para auth.openai.com por falta de autorização explícita para esse destino. Foi solicitada autorização ao usuário; nenhuma nova tentativa de login foi feita sem resposta. Inspeção visual e teste em viewports móveis permanecem pendentes.

As medidas acima descrevem a implementação, e não resultados medidos em navegador. A loja continua demonstrativa, com dados locais; nenhum pedido ou lançamento real foi modificado nesta revisão.
