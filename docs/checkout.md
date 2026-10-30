# Pagamento, retirada e envio

Checkout pergunta “Você é de Ubaitaba?”, sem resposta pré-selecionada. Sim habilita contato e forma de pagamento para retirada no estabelecimento; não há entrega em domicílio na cidade nem campo de endereço da cliente. A resposta Não mostra o link de atendimento da loja para combinar entrega, frete, prazo e pagamento, sem criar pedido ou reservar estoque. Aurelino Leal segue esse caminho externo.

Local de retirada informado pelo responsável: **ZM Exclusiva Store, Avenida Presidente Vargas, Centro, Ubaitaba, CEP 45545-000**. O número não foi fornecido; não inventar S/N, horários ou referências. `pickupLocation` em domain.js centraliza a informação. Checkout, confirmação e detalhes do pedido exibem endereço e link de pesquisa no Google Maps. Retirada e envio, no rodapé, também informa o local. Horário de retirada é combinado com a equipe pelo WhatsApp; não há calendário ou horário confirmado automaticamente.

Formas configuradas: Pix e Combinar com a loja. O servidor exige confirmação de Ubaitaba e uma opção válida; o nome legado localDelivery=yes é mantido no contrato. Novos pedidos guardam payment (method/status Pendente) e delivery (mode pickup/cidade/endereço do estabelecimento/fee 0), sem confiar em endereço vindo do cliente. Pedidos continuam Novo no admin, com reserva de estoque; receita só entra no caixa ao confirmar. Cancelamento segue repondo uma vez. Registros antigos de entrega mantêm seus dados e apresentação originais.

Após registrar um pedido com Pix, a cliente vê o QR, a chave, o titular e botões Copiar chave e Pix Copia e Cola. QR estático sem valor definido; a loja confirma pedido e valor antes do pagamento. Não há confirmação bancária ou baixa de pagamento automática. O responsável informou a chave CPF para publicação e corrigiu o titular para Zeidizan de Souza Menezes.

O rodapé também oferece Pix da loja para consultar os dados depois de fechar o pedido. Feedback de cópia fica dentro do diálogo; código em campo somente leitura oferece cópia manual se o navegador negar acesso à área de transferência.

QR gerado localmente por scripts/generate-pix.mjs, usando qrcode 1.5.4, sem serviço externo. pix.js implementa TLV/CRC16 do BR Code. Referência: [Banco Central, Manual de Padrões para Iniciação do Pix 2.10.0, §2.6](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf). Testes reproduzem o vetor oficial (CRC 1D3D), decodificam o QR com jsQR e comparam o PNG distribuído ao payload atual. Validar estrutura não consulta o DICT nem confirma a titularidade bancária; o app do pagador apresenta o recebedor registrado na chave.

UI em checkout.js; constantes de pagamento, local e validação em domain.js; persistência pela API/Neon existente, sem alteração de schema. Pagamento só no pedido retornado ao autor e na API administrativa, nunca no catálogo público. Endereço do estabelecimento é público; endereços particulares de pedidos antigos seguem restritos.

QA anterior à mudança para retirada (2026-10-29): caminho Não exibiu WhatsApp correto, sem formulário de finalização; caminho Sim registrou pedido fictício ZM-MVU6FTUX-QJ9 com Pix Pendente e endereço em Ubaitaba. QR/titular renderizados em 390 px; cópia retornou sucesso. Pedido cancelado após teste, com estoque e saldo preservados. Nenhum pagamento, mensagem ou entrega.
