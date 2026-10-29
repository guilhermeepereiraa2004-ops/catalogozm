# Login administrativo da loja

O admin usa e-mail e senha próprios, com Better Auth 1.7.14 e PostgreSQL Neon. A vitrine continua pública. A URL principal do painel é https://zm-exclusiva-tau.vercel.app/admin (redireciona para /#admin). Não há OAuth nem login Vercel neste fluxo.

## Primeiro acesso

O proprietário abre http://localhost:4173/admin/setup no computador onde este projeto roda. O servidor local escuta apenas 127.0.0.1, valida Host e Origin, e só ele habilita o endpoint de criação inicial. Escolha nome, e-mail e senha de pelo menos 12 caracteres. Após o primeiro administrador, o endpoint recusa novos cadastros. Signup remoto é sempre bloqueado, inclusive em previews. A aplicação não cria senha padrão nem pede credenciais pelo chat.

O bootstrap local usa lock transacional para impedir dois primeiros administradores. A senha é verificada pela biblioteca antes do vínculo em zm_auth_admin. O cadastro não entrega uma sessão; faça login depois. A tabela de vínculo autoriza por ID do usuário, não por e-mail ou header. A presença de cookie não basta: cada API verifica uma sessão ativa no banco e o vínculo administrativo.

## Persistência e acesso

Tabelas zm_auth_user, zm_auth_account, zm_auth_session, zm_auth_verification, zm_auth_rate_limit e zm_auth_admin são separadas de store_state. A role zm_auth_app tem CRUD apenas nessas tabelas e não cria estruturas. DATABASE_URL mantém a role da loja; AUTH_DATABASE_URL e BETTER_AUTH_SECRET são segredos de servidor no local e na Vercel de Guilherme. BETTER_AUTH_URL em production é a URL pública principal.

Senhas usam o hash mantido pelo Better Auth (nenhuma senha em texto puro no código ou banco). Sessões duram 8 horas, com cookies HttpOnly, SameSite=Lax e Secure em HTTPS; cache de sessão está desabilitado para respeitar logout/revogação imediatamente. Há rate limit persistido no PostgreSQL, de 5 tentativas de login por minuto. A proteção de origem/CSRF permanece ativa. Tokens não são gravados em localStorage.

A flag antiga VERCEL_PRIVATE_ADMIN e headers oai-* não concedem mais acesso. /api/state e todas as mutações administrativas exigem sessão + vínculo, tanto em production quanto em preview. Ações de pedido público continuam autorizadas sem sessão. Sem autenticação, a UI mostra o formulário da loja. Sair encerra a sessão no banco e limpa os dados administrativos da tela. Trocar senha exige a senha atual e pode encerrar outras sessões.

Recuperação de senha por e-mail não está integrada; não mostrar botão de recuperação que não funciona. Caso o responsável perca o acesso, preparar um fluxo de recuperação autorizado no computador do proprietário, sem abrir cadastro público.

## Operação e testes

Rodar npm run auth:migrate para a estrutura e credencial restrita (migração proprietária em .env.bootstrap ignorado). npm run auth:verify cria tabelas QA com prefixo aleatório, testa signup local único, login correto/incorreto, hash, autorização por ID, cookie, senha, logout, CSRF e rate limit; remove apenas suas tabelas no fim. Não cria administrador real. npm run gate continua obrigatório.

Local: npm run dev precisa continuar ativo para o proprietário completar o cadastro inicial. Nunca publicar esse servidor local na internet. Não redefinir BETTER_AUTH_SECRET em um deploy comum, pois isso invalida sessões existentes.
