# ZM Exclusiva Store

Vitrine e administração de demonstração em HTML, CSS e JavaScript ESM, sem dependências de instalação.

```sh
npm run dev
npm run gate
npm run build
```

Loja: http://localhost:4173/ · Admin: http://localhost:4173/#admin

O catálogo aproveita as 42 fotos fornecidas, distribuídas em 39 cadastros: vestidos, moda praia, fitness, lingerie e acessórios. Preço inicial de todos: R$ 99,90. Três pares do mesmo modelo estão agrupados em carrosséis. Alguns arquivos mostram mais de um modelo/cor; nesses casos a descrição pede confirmação com a loja.

Busca, categorias, ordenação, favoritos, sacola, checkout demonstrativo, criação/edição com fotos e status dos pedidos funcionam no navegador. Quantidade inicial demonstrativa: 1 por cadastro. O pedido baixa o estoque imediatamente e cancelá-lo devolve as unidades. Produtos esgotados ou ocultos não aparecem na vitrine.

## Limite desta etapa de front-end

Dados ficam no localStorage do mesmo navegador e origem, incluindo pedidos e fotos adicionadas. A prévia local e a versão hospedada têm armazenamentos independentes. Não há login, banco compartilhado, cobrança ou envio automático de pedidos ao WhatsApp. O link de WhatsApp abre o contato público fornecido no Instagram. Os dados não sincronizam com outros dispositivos e podem desaparecer se o armazenamento do navegador for apagado.

Para vendas reais: integrar backend com estoque transacional e autorização no servidor, banco persistente, uploads, autenticação do admin, política de entrega e provedor de pagamento (se desejado). A publicação inicial é privada para revisão visual do proprietário.

Referência de identidade: https://www.instagram.com/zmexclusiva.store/ — terracota, dourado, creme, tipografia Poppins solicitada. Fotos convertidas para WebP, originais preservados localmente. Mapeamento em `docs/photo-manifest.json` e `docs/catalog-analysis.md`.
