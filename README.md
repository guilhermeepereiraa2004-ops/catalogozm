# ZM Exclusiva Store

Catálogo de moda, painel de pedidos/produtos e Fluxo de caixa. Frontend HTML/CSS/JavaScript ESM, API de servidor e PostgreSQL Neon. A hospedagem privada atual usa Sites/Cloudflare Worker, com Vinext para roteamento.

Instale Node >=22.13 e execute npm install. Configure DATABASE_URL em .env.local, seguindo .env.example. A credencial não pode ir para o frontend ou para o Git.

```sh
npm run dev
npm run gate
npm run build
```

Loja: http://localhost:4173/ · Admin: http://localhost:4173/#admin · Fluxo de caixa: http://localhost:4173/#admin/cash-flow.

Produtos, pedidos, despesas e estoque ficam no Neon. Sacola e favoritos permanecem no navegador. Pedidos reservam estoque atomicamente; confirmar registra receita uma vez; cancelar retira a receita e devolve o estoque uma vez. Não há cobrança integrada.

O catálogo aproveita as 42 fotos fornecidas, distribuídas em 39 cadastros: vestidos, moda praia, fitness, lingerie e acessórios. Preço inicial de todos: R$ 99,90. Três pares do mesmo modelo estão agrupados em carrosséis. Alguns arquivos mostram mais de um modelo/cor; nesses casos a descrição pede confirmação com a loja.


Estoque inicial de uma unidade por cadastro é demonstrativo. Cadastre quantidades físicas, tamanhos e variantes reais antes de operar. O Site está privado para o proprietário; antes de abrir ao público, configurar autorização administrativa específica.

Configuração, migrações, segurança, testes e limites em [docs/database.md](docs/database.md). Dados antigos de demonstração em localStorage são preservados e não são importados automaticamente para o novo banco.

Identidade: logo da loja e branco/rosa/dourado do Rodapé.jpeg; Poppins. Hero com medalhão da logo e animação suave. As 42 fotos originais foram preservadas. Ver docs/branding.md, docs/hero-logo.md e docs/catalog-analysis.md. O estudo GLB separado continua em vestido-3d.html; não aparece na hero.
