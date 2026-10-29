# Login administrativo da loja

O admin usa e-mail e senha próprios, com Better Auth 1.7.14 e PostgreSQL Neon. A vitrine continua pública. A URL principal do painel é https://zm-exclusiva-tau.vercel.app/admin (redireciona para /#admin). Não há OAuth nem login Vercel neste fluxo.

## Primeiro acesso

O proprietário recebe uma ativação HTTPS temporária no domínio real da loja. Rodar npm run auth:activation no computador do projeto gera um token aleatório de 256 bits; só o hash SHA-256 fica no Neon, com validade de 30 minutos e uso único. O link fica no arquivo local ignorado artifacts/admin-setup-link.json, não em logs/chat/código. Abrir diretamente na aba da loja para o proprietário escolher nome, e-mail e senha >=12 caracteres.

O token chega por fragmento, é retirado do endereço pelo frontend e fica só na memória até o envio. As APIs o recebem em header de mesma origem, com Cache-Control no-store e Referrer-Policy no-referrer. Sem token válido, não há cadastro remoto. Signup genérico continua bloqueado. O token não é uma sessão administrativa e não permite ler pedidos ou despesas.

O cadastro usa lock transacional, revalida a ativação dentro do lock e marca como consumida na mesma transação do vínculo administrativo. Apenas um primeiro administrador pode ser vinculado. O link expira, não pode ser reutilizado e novas ativações não são emitidas depois do primeiro administrador. Renovar um link pendente invalida o anterior. O cadastro não entrega sessão; faça login depois. Nenhuma senha padrão é criada ou pedida pelo chat.

O bootstrap local antigo ainda funciona no servidor 127.0.0.1, mas não é o caminho de entrega porque localhost no navegador embutido pode apontar a outro projeto.

## Persistência e acesso

Tabelas zm_auth_user, zm_auth_account, zm_auth_session, zm_auth_verification, zm_auth_rate_limit e zm_auth_admin são separadas de store_state. A role zm_auth_app tem CRUD apenas nessas tabelas e não cria estruturas. DATABASE_URL mantém a role da loja; AUTH_DATABASE_URL e BETTER_AUTH_SECRET são segredos de servidor no local e na Vercel de Guilherme. BETTER_AUTH_URL em production é a URL pública principal.

Senhas usam o hash mantido pelo Better Auth (nenhuma senha em texto puro no código ou banco). Sessões duram 8 horas, com cookies HttpOnly, SameSite=Lax e Secure em HTTPS; cache de sessão está desabilitado para respeitar logout/revogação imediatamente. Há rate limit persistido no PostgreSQL, de 5 tentativas de login por minuto. A proteção de origem/CSRF permanece ativa. Tokens não são gravados em localStorage.

A flag antiga VERCEL_PRIVATE_ADMIN e headers oai-* não concedem mais acesso. /api/state e todas as mutações administrativas exigem sessão + vínculo, tanto em production quanto em preview. Ações de pedido público continuam autorizadas sem sessão. Sem autenticação, a UI mostra o formulário da loja. Sair encerra a sessão no banco e limpa os dados administrativos da tela. Trocar senha exige a senha atual e pode encerrar outras sessões.

Recuperação de senha por e-mail não está integrada; não mostrar botão de recuperação que não funciona. Caso o responsável perca o acesso, preparar um fluxo de recuperação autorizado no computador do proprietário, sem abrir cadastro público.

## Operação e testes

Rodar npm run auth:migrate para a estrutura e credencial restrita (migração proprietária em .env.bootstrap ignorado). npm run auth:verify cria tabelas QA com prefixo aleatório, testa signup local único, login correto/incorreto, hash, autorização por ID, cookie, senha, logout, CSRF e rate limit; remove apenas suas tabelas no fim. Não cria administrador real. npm run gate continua obrigatório.

Local: npm run dev é opcional para a entrega da ativação HTTPS. Nunca publicar esse servidor local na internet. Não redefinir BETTER_AUTH_SECRET em um deploy comum, pois isso invalida sessões existentes.

zm_auth_bootstrap guarda hash, expiração e consumo. A role de runtime pode apenas ler e atualizar consumed_at; somente o operador com credencial proprietária emite ativações. O teste real inclui token ausente, expirado, usado e requisições concorrentes, além do fluxo de autenticação anterior.
