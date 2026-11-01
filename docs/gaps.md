# Lacunas

| Prioridade | Lacuna | Estado |
|---|---|---|
| Alta | Backend e banco compartilhado com estoque transacional | Implementado no Neon; API, revisão atômica e concorrência verificados |
| Alta | Autenticação e autorização do admin no servidor | Better Auth com e-mail/senha e vínculo administrativo no Neon; vitrine pública e APIs administrativas exigem sessão própria |
| Alta | Quantidades físicas, variantes, medidas e tamanhos reais | Loja deve cadastrar antes de operação real |
| Média | Confirmação bancária, cálculo de frete e notificações | Checkout escolhe Pix/a combinar; QR estático com chave/titular fornecidos; Ubaitaba reserva retirada no estabelecimento e outras localidades combinam entrega/frete pelo WhatsApp. Sem gateway/webhook ou cálculo automático |
| Média | Auditoria completa de acessibilidade e teste em aparelhos reais | Padrões implementados; revisão completa pendente |
| Baixa | CI | Sem CI existente; gate local implementado |

Revisão 2026-10-29: QA visual da nova logo e paleta pendente por indisponibilidade do acesso à prévia correta e interrupção do Computer Use. Fonte e build passaram; ver docs/branding.md.

2026-10-29: produção pública em zm-exclusiva-tau.vercel.app, admin no alias privado zm-exclusiva-admin-guilherme.vercel.app. Standard Protection preservado para previews. 20 testes e HTTP anônimo aprovados; navegação até o checkout e acesso do proprietário ao admin conferidos no navegador.

2026-10-29: autenticação própria de e-mail/senha implementada com Better Auth/Neon. Cadastro inicial fica a cargo do proprietário na tela local, sem signup público. Recuperação de senha por e-mail não integrada. QA local de UI limitado pelo navegador embutido apontando para outro localhost; validar login na URL pública após deploy.

2026-10-29: primeiro administrador criado pelo proprietário via ativação HTTPS consumida; cadastro inicial encerrado. Fluxo publicado verificado pela interface da loja e do admin, com conferência independente no Neon: pedido Novo reserva estoque 1→0 sem receita; confirmação registra R$ 99,90 uma única vez, inclusive após recarga; cancelamento restaura estoque 1 e retira a receita. Pedido fictício ZM-MVU567L5-4U3 mantido como Cancelado para histórico. Checkout no navegador compartilhou a sessão existente do proprietário; acesso sem sessão é coberto pelos testes de API. Não houve cobrança, contato ou entrega. Evidências locais ignoradas em artifacts/e2e-order-flow.json e screenshots e2e-*.png. Gate aprovado, 20 testes. Sem correção de código ou novo deploy.

2026-10-31 — Catálogo para enviar disponível apenas localmente (#admin/share), com PDF e seleção testados. Revisão visual final da interface no navegador local pendente: IABlocalhost4173 resolve outro projeto. Links externos para clientes dependem de futura autorização de publicação; PDF já é um arquivo compartilhável. Ver docs/shared-catalog.md.

2026-10-31 — Ferramentas de looks/retiradas/reposição somente locais. Cards e lógica/DOM/banco temporário verificados; falta revisão visual final da interface no Chrome/Edge do computador (IAB4173 resolve outro projeto). Na agenda, exemplos locais são seguros para demonstração; modo normal usa os pedidos reais do Neon. Ver docs/retail-tools.md.

2026-10-31 — Módulo de reposição retirado por pedido. To-do #admin/todo disponível somente no localhost, com gravação administrativa e Lixeira;52testes/build/Neon temporário aprovados. Revisão visual nativa continua limitada pela ferramenta, sem publicação para contornar isso.

2026-11-01 — Hero exclusivamente com arte, alteração local sem deploy. Gate52/build aprovado; inspeção visual pendente: localhost do IAB resolve outro projeto e Computer Use encerrou porque não identificou URL do Chrome com segurança.

2026-11-01 — Acesso local corrigido iniciando servidor fora do isolamento, restrito a loopback. HTTP200/arte atualizada e API administrativa401 conferidos. Revisão visual da Hero ainda não executada pela ferramenta.

2026-11-01 — Ajuste desktop por viewport concluído; gate52/build aprovado. Inspeção visual continua pendente porque Computer Use não identificou URL do Chrome com segurança.

2026-11-01 — Ajuste por viewport desfeito por solicitação; Hero somente imagem proporcional restaurada. Sem publicação.

2026-11-01 — Publicação autorizada da versão final da Hero somente imagem, largura total e altura proporcional. Experimento por viewport revertido; revisão visual será tentada no domínio público após publicar.

2026-11-01 — Novo enquadramento mobile local até600px. Gate52/build aprovado; QA visual pendente porque navegador de teste não acessa localhost Windows e bloqueou prévia dataURL (somente HTTP/HTTPS). Sem publicação nem contorno do bloqueio.

2026-11-01 — Usuário autorizou publicar enquadramento mobile ampliado; QA visual será feito na URL HTTPS pública após o deploy, sem usar a prévia dataURL bloqueada.

2026-11-01 — Ampliação mobile revertida por esclarecimento do usuário; Hero volta à arte inteira e proporcional em todas as telas (CSS15aec15). Publicação do rollback em andamento.
