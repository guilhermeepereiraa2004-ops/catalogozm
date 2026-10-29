# Pagamento e entrega

Checkout pergunta “Você é de Ubaitaba?”, sem resposta pré-selecionada. Somente Sim habilita dados de contato, endereço local e forma de pagamento. Não apresenta o link de atendimento existente da loja para combinar frete, prazo e pagamento; não cria pedido nem reserva estoque. Aurelino Leal não está incluída na entrega direta, conforme correção final do proprietário.

Formas configuradas: Pix e Combinar com a loja. Nenhum outro meio ou parcelamento foi presumido. O servidor exige a confirmação local, endereço e uma opção válida. Pedidos antigos continuam legíveis; novos pedidos guardam payment (method/status Pendente) e delivery (Ubaitaba/endereço/fee null). Não há cobrança de entrega, confirmação bancária ou baixa de pagamento automática. Pedidos ainda nascem Novo; estoque é reservado e receita só entra no Fluxo de caixa ao confirmar no admin.

Após registrar um pedido com Pix, a cliente vê o QR, a chave, o titular e botões Copiar chave e Pix Copia e Cola. QR estático sem valor definido, pois o total com entrega será combinado com a loja. Não efetuar pagamento automaticamente. O responsável informou a chave CPF para publicação e corrigiu o titular para Zeidizan de Souza Menezes.

QR gerado localmente por scripts/generate-pix.mjs, usando qrcode 1.5.4, sem serviço externo. pix.js implementa TLV/CRC16 do BR Code. Referência: [Banco Central, Manual de Padrões para Iniciação do Pix 2.10.0, §2.6](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf). Testes reproduzem o vetor oficial (CRC 1D3D), decodificam o QR com jsQR e comparam o PNG distribuído ao payload atual. Validar estrutura não consulta o DICT nem confirma a titularidade bancária; o app do pagador apresenta o recebedor registrado na chave.

UI em checkout.js; constantes de pagamento e validação em domain.js; persistência pela API/Neon existente, sem alteração de schema. Endereço e pagamento só no pedido retornado ao autor e na API administrativa, nunca no catálogo público.
