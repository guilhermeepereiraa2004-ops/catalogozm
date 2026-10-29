# Identidade visual — 2026-10-29

Referências fornecidas na pasta do projeto: Logo.jpeg e Rodapé.jpeg. A logo foi copiada sem alteração para assets/logo-zm-exclusiva.jpg, usada no cabeçalho, rodapé, admin e favicon. A prévia 3D separada também recebe a mesma identidade; não foi reintroduzida na hero ou na navegação da loja.

O card Rodapé é referência de cor. Seu fundo rosa contém amostras como #fbd8d4 e #fedfdc; o dourado aparece com variação de luz. A base do site agora é branca, com fundos rosa suave, destaques em rosé e dourado. A tipografia continua Poppins. As cores dos indicadores de cor das roupas foram preservadas.

| Uso | Cor |
|---|---|
| Fundo principal | #ffffff |
| Rosa do card | #fbd8d4 |
| Rosa claro de superfícies | #fff4f2 |
| Rosé de botões e destaques | #99555b |
| Rosé escuro | #794149 |
| Dourado decorativo | #bd884c |
| Dourado para texto | #8b572a |
| Texto | #402c2b |
| Texto secundário | #755b58 |

branding.css, carregado após os estilos existentes, centraliza os tokens e as aplicações da nova identidade. O build distribui a folha e a imagem da logo. Em telas menores, o nome ao lado da logo recolhe para manter espaço para as ações do cabeçalho.

## Verificação e limite

- Logo e página responderam HTTP 200 na prévia local; o título retornado pelo servidor é ZM Exclusiva. Cópia da imagem verificada por hash.
- Contraste calculado entre cores sólidas: rosé/branco 5,52:1; rosé escuro/branco 7,88:1; texto secundário/branco 6,19:1; dourado escuro/rosa 4,54:1. Dourado mais claro fica em detalhes decorativos.
- Inspeção visual desta revisão ficou pendente: a prévia automatizada de localhost abriu outro projeto, enquanto o servidor local retornava a loja correta. A tentativa de inspeção no navegador do computador foi interrompida pela ferramenta por não conseguir validar sua URL. Não foram feitas novas ações de Computer Use após a interrupção. Não afirmar que esta revisão passou por QA visual ou teste em celular.
