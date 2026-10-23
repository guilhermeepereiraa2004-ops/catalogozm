# Stack — ZM Exclusiva
Data: 2026-10-22. Estado: escolha de implementação para a primeira etapa de front-end autorizada no pedido; backend de produção permanece a definir.

Superfície confirmada: site e admin pelo navegador. Requisitos ditos: fotos locais, agrupamento por peça, preço inicial, catálogo acessível, compra pelo front, gestão de produtos/pedidos/estoque. Não há preferência de framework informada.

Escolha proporcional: HTML sem build de framework, CSS responsivo, JavaScript ESM e localStorage. Node.js v24.12.0 disponível para servidor, build e testes; não é requisito de runtime na hospedagem estática. Sites fornece publicação privada para revisão. Poppins via Google Fonts, com fallback sans-serif.

Alternativas: React + Vite acrescentaria dependências sem necessidade funcional nesta fase; framework com servidor seria indicado para pedidos reais e acesso compartilhado, fora da etapa inicial de front-end. Não há ranking numérico sem dados de volume, orçamento e preferência de manutenção. Esta escolha atende ao protótipo; não satisfaz persistência compartilhada nem autenticação em produção.

Custos anuais a verificar: não há volume de acessos, plano de hospedagem, domínio ou provedor de pagamentos fornecido. Nenhuma compra foi realizada nem recurso pago contratado.

Fontes oficiais consultadas em 2026-10-22: [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage), [dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog). O armazenamento é separado por origem e não constitui banco compartilhado.

Comandos executados: `node scripts/gate.mjs`, `node scripts/serve.mjs`. Ver `docs/arquitetura.md` para o mapa de dependências. Para produção, escolher com a loja backend, identidade, frete e pagamento antes de ampliar a implementação.
