# Banco de dados e servidor

Neon PostgreSQL 18, projeto zm-exclusiva (sweet-voice-91136330), nova organização org-sparkling-pond-70302285. Plano Free, AWS São Paulo. Banco neondb, branch production. Conexão HTTP pelo driver oficial @neondatabase/serverless, sem TCP no Worker.

## Fluxo

O navegador usa store.js para consultar a API. O servidor executa as regras de domain.js e grava no Neon. Produtos, pedidos, estoque e despesas ficam compartilhados. Sacola e favoritos continuam locais. Nenhum pagamento é processado pelo site. O catálogo inicial mantém os 39 produtos, as 42 fotos e o preço de 9990 centavos, com 1 unidade demonstrativa por cadastro.

A tabela public.store_state contém um documento JSONB versionado com produtos, pedidos, despesas e chaves de tentativa. A escolha mantém a estrutura do projeto pequeno e permite uma única atualização atômica para pedido e estoque. read_store lê um snapshot; commit_store só aceita a revisão lida. Em conflito, a API relê, revalida e tenta novamente. Isso impede perda de atualização e venda simultânea da última unidade. A chave de tentativa impede pedido duplicado na repetição da mesma requisição. Preços vêm do banco. Cancelamentos e primeira confirmação preservam as regras anteriores do Fluxo de caixa.

Este modelo serializa gravações e lê o documento inteiro. Se volume de pedidos/fotos crescer, separar tabelas e mover uploads para armazenamento de objetos. Fotos novas ficam como WebP limitado no documento; as fotos iniciais continuam estáticas. Não remover chaves de idempotência sem política de retenção.

## Segurança

DATABASE_URL existe apenas em .env.local ignorado e como segredo de runtime no Sites. O usuário zm_app não cria tabelas/roles e só executa as duas funções necessárias; sem acesso direto à tabela. A conexão proprietária para migrações fica em .env.bootstrap, também ignorado. Nunca incluir esses arquivos em suporte, arquivos de build, Git ou chat. .env.example só contém nomes.

O servidor local escuta somente 127.0.0.1, valida Host/Origin e serve uma lista explícita de arquivos públicos. .env, .git, server e scripts não são publicados.

O Site permanece privado para o proprietário, com autenticação gerenciada pelo Sites. Rotas administrativas exigem o header de identidade confiável que o dispatch injeta. A vitrine usa /api/catalog e não recebe clientes, pedidos, despesas ou chaves de tentativa. POST exige JSON e mesma origem. O servidor local considera o proprietário do dispositivo como admin; não o expor em rede pública.

Antes de abrir a loja publicamente, implementar autorização administrativa específica por usuário (não basta estar autenticado). O identificador de usuário é específico do Site. Não substituir isso por senha no frontend. A hospedagem atual é Sites/Cloudflare Worker com Vinext para roteamento; Vercel não foi configurada nesta entrega.

## Executar

Node >=22.13. Instalar com npm install. npm run dev mantém o endereço http://localhost:4173. npm run gate valida sintaxe, arquitetura, 17 testes, GLB e build do Worker com assets públicos. npm run db:verify exercita persistência real, concorrência, idempotência e financeiro em um schema temporário isolado, removido no fim. Não altera os produtos reais.

Migrações: npm run db:migrate usa a credencial proprietária ignorada. O seed só insere quando a tabela está vazia: nunca repõe estoque em um redeploy. Preservar a senha existente do usuário zm_app em .env.local. Deploy precisa de DATABASE_URL no ambiente do Sites, não de .env no arquivo publicado.

Os dados de demonstração anteriores em localStorage (chave zm-exclusiva-v2) não são apagados nem enviados automaticamente. O banco novo recebeu o catálogo original, sem importar pedidos/despesas de teste de um aparelho. Se houver alterações locais que devam virar dados oficiais, fazer importação revisada com backup antes de sobrepor o banco.

## Verificação desta entrega

17 testes locais aprovados. Neon real: disputa pela última peça, preço autoritativo, repetição do pedido, confirmação única, despesa, cancelamento único e persistência após nova leitura. Catálogo real preservado com 39 produtos, sem pedidos/despesas fictícios. Revisão visual da loja permanece dispensada pelo usuário; inspeção do console Neon confirmou projeto, região e plano.
