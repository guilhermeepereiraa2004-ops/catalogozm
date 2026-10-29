# Vercel

Destino autorizado: Guilherme Pereira's projects (guilherme-pereiras-projects-5a38e3ba), team_NseDl6bHKTOowzX904mmIj0U. Projeto zm-exclusiva, prj_hYAN6ILZ6N9eE4uQGQqswn0H0AHd. A integração MCP está conectada à conta Diego; operar este destino pela CLI autenticada de Guilherme com --scope explícito. .vercel/project.json é local e ignorado.

Loja pública: https://zm-exclusiva-tau.vercel.app. Admin: https://zm-exclusiva-tau.vercel.app/admin, com e-mail/senha próprios via Better Auth. /admin redireciona internamente para /#admin. Não há login Vercel no acesso da loja. Vercel Standard Protection continua protegendo previews para revisão, sem servir como autorização administrativa da aplicação.

O adaptador server/vercel.js valida sessão Better Auth e vínculo de usuário no Neon para qualquer API administrativa. Sem sessão, /api/state e as mutações administrativas retornam 401. VERCEL_PRIVATE_ADMIN e headers oai-* não concedem acesso em nenhum ambiente.

O endpoint api/auth.js recebe /api/auth/:path* por rewrite com auth_path, normalizado no servidor. Signup público e setup remoto são recusados. O primeiro cadastro é escolhido pelo responsável por uma ativação HTTPS temporária de uso único. Instruções em docs/admin-auth.md.

Secrets de runtime em production/preview: DATABASE_URL para catálogo, AUTH_DATABASE_URL para autenticação, BETTER_AUTH_SECRET para cookies. BETTER_AUTH_URL em production aponta para a URL pública principal. Nada vai ao frontend. .vercelignore exclui .env*, Git, arquivos locais, originais, dependências e outputs.

Build Vercel: npm run build:vercel prepara public; funções Node 24 em gru1 reutilizam Neon de São Paulo. O build npm run build permanece Worker para Sites, sem incluir o backend de autenticação Node. Sites antigo continua privado. Não executar seed ou migração durante deploy.

Publicar production com --skip-domain, validar a versão protegida por vercel curl e só então promover. Verificar também o acesso anônimo ao domínio principal e a recusa do admin sem sessão. Não definir ssoProtection=null: isso exporia previews antigas. Atualizar ou redirecionar o alias administrativo legado ao login novo.

Repositório oficial: https://github.com/guilhermeepereiraa2004-ops/catalogozm, branch main. Origin aponta para esse destino, conectado ao mesmo projeto Vercel de Guilherme por vercel git connect. Commits enviados a main podem gerar deploys de produção pela integração Git; validar o resultado e o domínio após cada envio. O repositório anterior andrelopees04-source/catalogo não é mais o destino de trabalho. CLI continua disponível para publicação controlada sem modificar banco ou autenticação.

Correção de primeiro acesso: usar ativação HTTPS temporária no domínio real em vez de entregar localhost. Endpoint /api/auth/setup continua negado sem token válido; o link exige hash/expiração/consumo no Neon e trava depois do primeiro administrador. Ver docs/admin-auth.md.
