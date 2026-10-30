# Exclusão e Lixeira

Admin oferece Apagar em pedidos, produtos e lançamentos do Fluxo de caixa. A confirmação mostra o registro, valor e impacto; Cancelar recebe foco inicial. Exclusão é reversível, sem remoção física de fotos ou registros do banco. A Lixeira permite restaurar, sem expurgo automático.

- Produto: sai da vitrine/lista; pedidos existentes preservam o retrato da peça. Cancelamentos ainda devolvem unidades ao cadastro na Lixeira. Restaurar retorna o cadastro com estoque e visibilidade preservados.
- Pedido Novo, Confirmado ou Em separação: sai da lista/caixa e libera o estoque reservado uma vez. Restaurar reserva novamente, mantendo status e primeira confirmação; exige estoque disponível.
- Pedido Concluído: sai da lista e do caixa, sem repor produto que já foi vendido. Restaurar não desconta estoque novamente.
- Pedido Cancelado: sai da lista, sem nova reposição. Restaurar mantém Cancelado.
- Receita/despesa avulsa: deixa de compor saldo, busca e filtros; restauração recupera ID/data/valor originais.
- Receita derivada de pedido: Apagar no caixa marca cashExcludedAt, mantendo pedido/status/estoque. Restaurar só altera financeiro e exige pedido confirmado, em separação ou concluído. Se o pedido for apagado, restaure o pedido primeiro; cancelados não geram receita.

deletedAt mantém o registro na Lixeira. deletionRestocked indica a reserva liberada na exclusão do pedido; não é o mesmo que cancelamento. Retentativas de criação de pedido apagado não recriam a venda. Escritas concorrentes usam o mesmo CAS/revisão do Neon. Cadastro e mudanças de status de registros apagados são recusados até restauração.

record.delete(kind,id) e record.restore(kind,id) aceitam product, order, income, expense e order-income. APIs exigem sessão administrativa da loja; catálogo público exclui produtos apagados e não expõe Lixeira/financeiro. Não altera dados antigos ou remove registros automaticamente ao publicar.

Validação: 32 testes no gate, com exclusão/restauração financeira, reserva única, vendas concluídas/canceladas, privacidade, edição bloqueada na Lixeira e concorrência na última peça. db:verify também exerce gravações/restaurações concorrentes em um schema Neon temporário, sem apagar dados da loja.
