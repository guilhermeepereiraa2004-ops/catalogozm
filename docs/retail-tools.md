# Looks, retiradas e To-do

Recursos para teste local, sem push/deploy. O módulo de reposição (ideia 7) foi removido posteriormente por pedido do usuário, substituído por To-do. Rotas: #admin/looks, #admin/pickups e #admin/todo. O controle de quantidade dos produtos e as reservas das vendas continuam funcionando.

## Montador de looks

Seleciona de 2 a 6 produtos diferentes, visíveis e com estoque. Busca e categoria ajudam a combinar peças de grupos diferentes. Título e dois estilos (rosé/branco); rascunho de IDs/título/tema fica apenas no navegador. Preview usa o mesmo renderizador Canvas do PNG de 1080 × 1350. Poppins local, fotos sem corte, preços atuais e soma em centavos. Não reserva estoque nem cria venda. Antes de baixar, consulta o estado autenticado novamente e rejeita uma peça indisponível; gera uma imagem consistente a partir da seleção/preços conferidos. Não envia mensagens automaticamente.

look-card.js é o renderizador compartilhado entre navegador e QA Node; look-builder.js monta a interface. Cards reais de 2 e 6 peças gerados e inspecionados em artifacts/looks-qa. Arquivos de QA permanecem ignorados.

## Agenda

Cada agendamento pertence a um pedido de retirada (delivery.mode=pickup). pickup.save(id,{date,time,status,note}) exige admin e salva o campo pickup no JSON do pedido pelo CAS existente; sem migração. Data/horário obrigatórios, observação até 500 caracteres, estados Agendada/Pronta/Retirada. Agendar um Novo não confirma venda/pagamento. Pronta/Retirada exigem pedido Confirmado ou Em separação. Retirada conclui o pedido, preserva primeira confirmação, não desconta estoque outra vez e não confirma pagamento. Retentativa idêntica é idempotente; retirada não pode ser reagendada/reaberta para preparo. Concluir via Pedidos também encerra um agendamento existente. Cancelados/apagados não aparecem na agenda. Cancelamento mantém as regras anteriores de estoque/caixa.

Calendário, filtros por dia/todos/status/cliente, lista sem horário e editor de agendamento. Registrar retirada tem confirmação em dois cliques. Datas do calendário e horários referem-se a Ubaitaba/BA; nenhum horário de funcionamento foi inventado.

Somente em localhost há o botão Testar com exemplos locais: usa três pedidos fictícios em memória e horários ilustrativos, com banner explícito. Não chama a ação real, não altera estoque/caixa nem aparece em outros módulos. Voltar aos pedidos da loja restaura a visão real. Fora da demonstração, a agenda usa o mesmo Neon da loja; apenas testar a interface com exemplos não grava dados reais.

## To-do

Tarefas administrativas em state.tasks, acessíveis somente por sessão de admin. task.save cria/edita com título, prioridade Alta/Normal/Baixa, prazo opcional e observação; o ID do rascunho evita duplicação em nova tentativa. task.complete recebe um booleano e mantém a data da primeira conclusão em repetições idênticas; reabrir limpa completedAt. Edições preservam createdAt e o estado concluído.

Filtros Pendentes/Hoje/Atrasadas/Concluídas/Todas e busca textual. Tarefas apagadas vão à Lixeira com possibilidade de restaurar status e prazo. Dados ficam no Neon pelo CAS existente, separados das vendas/caixa; API pública retorna tasks vazio. Nenhuma tarefa real é criada automaticamente para teste.

## Verificações

Gate com 46 testes/build. Casos de API/proteção, datas, estado do pedido, idempotência, concorrência com cancelamento, estoque/caixa, preços atuais do look e métricas históricas. Testes DOM exercitam limite de peças/download com preços revalidados, demonstração da agenda sem escrita real e seleção para catálogo. db:verify ampliado para agendar/marcar pronta/retirar/cancelar em schema temporário Neon. Removida a suposição antiga de que a loja sempre tem exatamente 39 produtos; a verificação considera o catálogo atual, preservando comparação se a revisão não mudar.

A revisão visual da interface no navegador local permanece necessária: o navegador embutido historicamente resolve localhost4173 para outro projeto. Não publicar para contornar essa limitação.

Revisão completa posterior:50 testes e fluxo integrado do app com DOM/API/dados isolados. Corrigidos placeholder oculto, total após revalidar preços e corrida de callbacks ao mudar de módulo (panel-lifecycle.js). HTTP de todos os imports e rotas protegidas conferido. Auth e Neon temporários aprovados.

Atualização To-do: gate52 e testes DOM/integrados de criar, editar, concluir, reabrir, apagar/restaurar aprovados. Persistência também verificada em schema temporário. Diálogos administrativos são limpos ao voltar à vitrine para não reter conteúdo privado fora do painel.

Publicação de todas as alterações autorizada pelo usuário em 2026-10-31. A liberação inclui catálogo, looks, agenda e To-do; reposição permanece removida. Exemplos da agenda e ferramentas operacionais temporárias continuam restritos ao ambiente local.
