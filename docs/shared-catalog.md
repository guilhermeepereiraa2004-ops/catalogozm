# Catálogo para enviar

Recurso local pedido em 2026-10-31, sem push/deploy. No admin, abrir Catálogo para enviar (#admin/share).

A seleção inclui somente produtos visíveis, não apagados e com estoque maior que zero, conforme preferência explícita. Filtros: categoria, nome/cor, preços mínimo/máximo e ordem; seleção manual por checkbox e botão para usar todos. Alterar filtro seleciona os resultados novamente; limpar seleção desabilita as exportações. Título editável de até 80 caracteres.

O link usa #colecao com título e IDs. A página pública carrega o catálogo público e revalida disponibilidade, visibilidade e preço; mantém a ordem da seleção. Não inclui dados administrativos ou snapshots de clientes. Não existe cadastro público novo, escrita no banco ou leitura de pedidos. Peças esgotadas/ocultas/apagadas desaparecem mesmo se alguém forjar o ID. Links grandes demais são recusados com alternativa de PDF/coleções menores. Link local só funciona no computador do servidor; a rota precisa ser publicada para envio externo.

PDF real gerado no navegador, baixado como catalogo-zm-exclusiva.pdf. Capa com arte fornecida, Poppins incorporada, quatro peças por página, imagem de capa por produto sem corte, categoria/nome/preço, data e links de atendimento WhatsApp. Não enviar mensagens automaticamente. Os preços do PDF representam a data da exportação; o link reflete valores atuais. Falha de imagem/fonte impede exportação incompleta e permite tentar novamente. jsPDF 4.2.1 (MIT), distribuição UMD local em vendor; Poppins local com OFL. Nenhum serviço externo recebe o PDF ou os produtos durante a geração.

Módulos: catalog-selection.js (seleção/URL), catalog-pdf.js (PDF e assets), catalog-share.js (admin e página pública), catalog-share.css (layout responsivo). Build e servidor incluem arquivos/fontes. Biblioteca PDF carregada somente ao exportar.

Validação: testes de seleção, indisponíveis, atualização de preço/estoque e ordem; teste de interação DOM cobre filtros, limpar/todos, seleção individual, cópia/prévia de URL e escape de título. PDF QA real com 36 produtos/10 páginas/4,2MB, capa e páginas intermediária/final renderizadas e inspecionadas. Gate 37 testes e build. Navegador embutido localhost4173 aponta a outro projeto; revisar interface final no Chrome/Edge local. Não declarar essa revisão visual da interface concluída sem evidência.

Ajuste solicitado: bloco de prévia, copiar link e baixar PDF no topo, logo depois da apresentação e antes dos filtros/produtos. Ordem do DOM e da navegação por teclado acompanham a ordem visual, em desktop e mobile.

Publicação de todas as alterações autorizada pelo usuário em 2026-10-31. A liberação inclui catálogo, looks, agenda e To-do; reposição permanece removida. Exemplos da agenda e ferramentas operacionais temporárias continuam restritos ao ambiente local.
