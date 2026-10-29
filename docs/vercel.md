# Vercel

Destino autorizado pelo usuário: Guilherme Pereira's projects (guilherme-pereiras-projects-5a38e3ba), team_NseDl6bHKTOowzX904mmIj0U. Projeto zm-exclusiva, prj_hYAN6ILZ6N9eE4uQGQqswn0H0AHd. Pasta vinculada por .vercel/project.json, ignorado pelo Git. A integração MCP Vercel está conectada a Diego e não deve ser usada para este destino; usar a CLI autenticada de Guilherme com --scope explícito.

O build Vercel é npm run build:vercel: prepara somente a lista de assets e arquivos frontend em public. As funções api/health.js, api/catalog.js, api/state.js e api/actions.js encaminham para server/vercel.js e reutilizam a API do Neon. Node 24, região gru1, mesmo banco de São Paulo. O build existente npm run build continua produzindo Worker para a prévia Sites. A conexão do banco não muda e não há nova migração/seed durante o deploy.

DATABASE_URL está configurado como Secret na Vercel para preview e production. Nenhum prefixo público, valor em config ou segredo no código. .vercelignore exclui .env*, Git, arquivos locais, originais, node_modules e outputs. O upload foi inspecionado antes da publicação. Limite de corpo do cadastro: 4 MB, verificado no cliente e servidor, abaixo do limite das Vercel Functions.

Vitrine pública: https://zm-exclusiva-tau.vercel.app. Produção não tem autorização administrativa: /api/state e as alterações de produtos, despesas e status retornam 401. O checkout anônimo usa somente order.create; o servidor calcula valores, reserva estoque e responde apenas com o pedido recém-criado. Catálogo não inclui clientes, pedidos, despesas ou chaves de tentativa.

Admin privado: https://zm-exclusiva-admin-guilherme.vercel.app/#admin. Alias aponta para um deployment de preview, protegido por Vercel Authentication. A proteção do projeto deve permanecer em prod_deployment_urls_and_all_previews (Standard Protection): libera somente os domínios de produção e mantém todas as previews privadas. Nunca definir ssoProtection=null. VERCEL_PRIVATE_ADMIN=1 continua SOMENTE em preview. Qualquer pessoa que receba acesso à preview poderá administrar; não compartilhar acesso de revisão com clientes.

O /admin público e o hash #admin encaminham para o alias privado; a autenticação é feita pela Vercel. Esconder a interface não é o controle de acesso: as APIs públicas sempre negam administração, mesmo com headers oai-* forjados. A produção ignora a flag privada ainda que configurada por engano.

O alias privado mantém o deployment administrativo retido. Quando atualizar código de admin, publicar uma preview e mover esse alias; nunca apontar esse alias para production. Ao atualizar a vitrine, publicar production sem mover o alias do admin. Os dois compartilham o mesmo Neon. A hospedagem Sites antiga permanece privada.

Execução: npm run dev para localhost; npm run gate antes de deploy; vercel project inspect --scope guilherme-pereiras-projects-5a38e3ba --non-interactive para confirmar destino; vercel deploy --target preview --scope guilherme-pereiras-projects-5a38e3ba para publicar. Usar vercel curl nas verificações da prévia protegida; não desligar proteção.

GitHub origin não está sincronizado por esta entrega. Deploy inicial sobe a fonte local revisada pela CLI, sem conectar automaticamente a branch remota antiga.
