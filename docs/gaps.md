# Lacunas

| Prioridade | Lacuna | Estado |
|---|---|---|
| Alta | Backend e banco compartilhado com estoque transacional | Implementado no Neon; API, revisão atômica e concorrência verificados |
| Alta | Autenticação e autorização do admin no servidor | Better Auth com e-mail/senha e vínculo administrativo no Neon; vitrine pública e APIs administrativas exigem sessão própria |
| Alta | Quantidades físicas, variantes, medidas e tamanhos reais | Loja deve cadastrar antes de operação real |
| Média | Pagamento, frete, envio de notificações | Não integrados; combinar detalhes pelo contato público |
| Média | Auditoria completa de acessibilidade e teste em aparelhos reais | Padrões implementados; revisão completa pendente |
| Baixa | CI | Sem CI existente; gate local implementado |

Revisão 2026-10-29: QA visual da nova logo e paleta pendente por indisponibilidade do acesso à prévia correta e interrupção do Computer Use. Fonte e build passaram; ver docs/branding.md.

2026-10-29: produção pública em zm-exclusiva-tau.vercel.app, admin no alias privado zm-exclusiva-admin-guilherme.vercel.app. Standard Protection preservado para previews. 20 testes e HTTP anônimo aprovados; navegação até o checkout e acesso do proprietário ao admin conferidos no navegador.

2026-10-29: autenticação própria de e-mail/senha implementada com Better Auth/Neon. Cadastro inicial fica a cargo do proprietário na tela local, sem signup público. Recuperação de senha por e-mail não integrada. QA local de UI limitado pelo navegador embutido apontando para outro localhost; validar login na URL pública após deploy.

2026-10-29: primeiro administrador criado pelo proprietário via ativação HTTPS consumida; cadastro inicial encerrado. Fluxo publicado verificado pela interface da loja e do admin, com conferência independente no Neon: pedido Novo reserva estoque 1→0 sem receita; confirmação registra R$ 99,90 uma única vez, inclusive após recarga; cancelamento restaura estoque 1 e retira a receita. Pedido fictício ZM-MVU567L5-4U3 mantido como Cancelado para histórico. Checkout no navegador compartilhou a sessão existente do proprietário; acesso sem sessão é coberto pelos testes de API. Não houve cobrança, contato ou entrega. Evidências locais ignoradas em artifacts/e2e-order-flow.json e screenshots e2e-*.png. Gate aprovado, 20 testes. Sem correção de código ou novo deploy.
