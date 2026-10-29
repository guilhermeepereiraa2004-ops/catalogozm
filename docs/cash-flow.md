# Fluxo de caixa

Admin → Fluxo de caixa, ou `/#admin/cash-flow`.

Pedidos nascem como Novo e não geram receita. Em Pedidos → Abrir → Status do pedido, escolher Confirmado inclui a receita no caixa. Em separação e Concluído também contam como confirmados. Cada pedido gera uma única linha, derivada do próprio pedido; alterar entre esses status não duplica o valor. A primeira confirmação grava confirmedAt e mantém a data nas próximas alterações. Um pedido confirmado não pode voltar para Novo; cancelamento remove sua receita do saldo e restaura o estoque uma única vez. Pedidos antigos em separação/concluídos usam createdAt como data de referência.

Nova despesa pede descrição, valor, data e categoria. Valores aceitam vírgula ou ponto com até duas casas decimais, convertidos para centavos inteiros. Não aceita zero, negativos, notação exponencial, separadores de milhar ou datas impossíveis. Editar preserva identidade e data de criação da despesa. Despesas ficam em state.expenses, preservadas ao criar e atualizar pedidos e produtos. Armazenamento antigo sem despesas ganha uma lista vazia na leitura, sem apagar pedidos ou produtos.

O resumo mostra receitas, despesas e saldo do intervalo selecionado, inicialmente o mês atual. Busca e tipo filtram a lista, sem alterar o resumo; essa regra aparece na tela. Este mês e Todo o período restauram os filtros. Datas usam calendário local; intervalo invertido mostra erro e esconde os totais até ser corrigido. Receitas têm atalho para o pedido; despesas têm edição.

Nova receita permite registrar entradas avulsas com descrição, valor, data e categoria (Venda presencial ou Outras receitas). A edição preserva ID e data de criação. Receitas avulsas ficam em state.incomes e somam às vendas confirmadas no período informado, sem alterar estoque ou criar pedidos. Não cadastrar novamente uma venda já confirmada pelo catálogo. Lançamentos manuais oferecem Editar; vendas automáticas oferecem Ver pedido.

Não há gateway de pagamento: receita de venda significa pedido confirmado pela loja, sem verificação bancária de recebimento. Dados persistem no Neon por API administrativa com sessão própria Better Auth. Listas antigas sem incomes são tratadas como vazias, sem migração destrutiva. O catálogo público não expõe pedidos, receitas ou despesas.

## Validação

- Atualização de 2026-10-29: 22 testes aprovados, incluindo receitas manuais, edição, filtros, combinação com vendas e despesas, preservação após cancelamento de pedido, validação e bloqueio de acesso anônimo. Teste no Neon real usa schema temporário descartado, com gravações concorrentes de receita/despesa; dados de operação preservados.

- Gate com 14 testes: estoque e catálogo existentes, confirmação idempotente, data estável, cancelamento, compatibilidade de pedidos antigos, criação/edição e preservação de despesas, valores e datas inválidos, filtros e migração do armazenamento.
- Navegador, origem de teste 127.0.0.1 separada de localhost: checkout cria Novo com receita zero; confirmação gera R$ 99,90; despesa de R$ 25,90 resulta em R$ 74,00; edição para R$ 35,90 deixa dois lançamentos e saldo R$ 64,00. Recarregar mantém os dados. Cancelamento retira a receita e deixa saldo -R$ 35,90.
- Filtro por tipo e intervalo invertido inspecionados no navegador. Formulário em 320 px e páginas de 320/390/768 px sem rolagem horizontal do documento; tabelas viram cartões no celular. Testes em viewports, sem aparelho físico.
- Dados sintéticos ficaram somente na origem local de teste; nenhum pedido ou despesa de exemplo foi criado na origem localhost ou na hospedagem.
