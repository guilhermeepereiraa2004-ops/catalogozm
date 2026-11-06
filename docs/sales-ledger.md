# Fichas de venda

No painel, em **Fluxo de caixa → Registrar venda**, a equipe informa cliente, compra, data e total. Pode registrar pagamento integral, dividir os valores recebidos entre crédito, débito, Pix e dinheiro ou deixar o total fiado. A diferença entre total e pagamentos é o saldo em aberto.

Em **Fichas de venda → Abrir ficha**, a equipe pode consultar o histórico e registrar um recebimento posterior. O saldo baixa a cada pagamento e somente os valores recebidos entram no caixa, na data correspondente. A tabela mostra todas as fichas ativas; os filtros de período continuam aplicados às movimentações de caixa.

Os pedidos do site aparecem em **Fluxo de caixa → Pedidos sem ficha**. O botão **Registrar pagamento** abre a ficha com cliente, itens e total preenchidos, inclusive para pedidos com status Novo. A equipe informa quanto recebeu e quanto fica fiado. Registrar a ficha mantém o status do pedido e as quantidades reservadas.

Vendas de balcão são lançamentos financeiros. Para pedidos vinculados, o caixa usa os recebimentos da ficha e não duplica o valor quando o pedido é confirmado. O vínculo é único. Cancelar ou apagar o pedido também remove seus recebimentos do caixa. A ficha pode ser apagada e restaurada na Lixeira. Apagar uma ficha vinculada não reativa automaticamente o valor integral do pedido.

`sale.save` e `sale.receive` são ações exclusivas do admin. A API valida datas, formas e valores em centavos, rejeita recebimento maior que o saldo e identifica retentativas pelo ID do lançamento. O estado usa a mesma atualização atômica por revisão em JSONB, sem migração. As fichas não são retornadas pela API pública.

O papel foi usado como referência de fluxo, sem copiar dados pessoais da foto para o sistema ou testes.
