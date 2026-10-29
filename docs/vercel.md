# Vercel

Destino autorizado pelo usuário: Guilherme Pereira's projects (guilherme-pereiras-projects-5a38e3ba), team_NseDl6bHKTOowzX904mmIj0U. Projeto zm-exclusiva, prj_hYAN6ILZ6N9eE4uQGQqswn0H0AHd. Pasta vinculada por .vercel/project.json, ignorado pelo Git. A integração MCP Vercel está conectada a Diego e não deve ser usada para este destino; usar a CLI autenticada de Guilherme com --scope explícito.

O build Vercel é npm run build:vercel: prepara somente a lista de assets e arquivos frontend em public. As funções api/health.js, api/catalog.js, api/state.js e api/actions.js encaminham para server/vercel.js e reutilizam a API do Neon. Node 24, região gru1, mesmo banco de São Paulo. O build existente npm run build continua produzindo Worker para a prévia Sites. A conexão do banco não muda e não há nova migração/seed durante o deploy.

DATABASE_URL está configurado como Secret na Vercel para preview e production. Nenhum prefixo público, valor em config ou segredo no código. .vercelignore exclui .env*, Git, arquivos locais, originais, node_modules e outputs. O upload foi inspecionado antes da publicação. Limite de corpo do cadastro: 4 MB, verificado no cliente e servidor, abaixo do limite das Vercel Functions.

Nesta entrega usar apenas preview protegido por Vercel Authentication. Configuração confirmada do projeto: ssoProtection.deploymentType=all_except_custom_domains, que cobre as URLs de preview. VERCEL_PRIVATE_ADMIN=1 existe somente no ambiente preview. Admin na Vercel confia na barreira privada da plataforma; qualquer pessoa que receber acesso à prévia poderá usar o painel. Não criar links compartilháveis para clientes. Não desativar proteção da prévia. Headers oai-* do navegador são ignorados por este adaptador. Production não habilita admin por esta flag.

Antes de publicar a loja para clientes, implementar login/autorização administrativa específicos. Não promover esta prévia presumindo que o login do Sites existe na Vercel. A hospedagem Sites atual permanece privada e funcionando.

Execução: npm run dev para localhost; npm run gate antes de deploy; vercel project inspect --scope guilherme-pereiras-projects-5a38e3ba --non-interactive para confirmar destino; vercel deploy --target preview --scope guilherme-pereiras-projects-5a38e3ba para publicar. Usar vercel curl nas verificações da prévia protegida; não desligar proteção.

GitHub origin não está sincronizado por esta entrega. Deploy inicial sobe a fonte local revisada pela CLI, sem conectar automaticamente a branch remota antiga.
