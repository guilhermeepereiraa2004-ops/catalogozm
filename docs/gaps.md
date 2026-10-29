# Lacunas

| Prioridade | Lacuna | Estado |
|---|---|---|
| Alta | Backend e banco compartilhado com estoque transacional | Implementado no Neon; API, revisão atômica e concorrência verificados |
| Alta | Autenticação e autorização do admin no servidor | Implementado com vitrine pública em production e admin isolado em preview protegida por Vercel Authentication; APIs administrativas públicas negadas |
| Alta | Quantidades físicas, variantes, medidas e tamanhos reais | Loja deve cadastrar antes de operação real |
| Média | Pagamento, frete, envio de notificações | Não integrados; combinar detalhes pelo contato público |
| Média | Auditoria completa de acessibilidade e teste em aparelhos reais | Padrões implementados; revisão completa pendente |
| Baixa | CI | Sem CI existente; gate local implementado |

Revisão 2026-10-29: QA visual da nova logo e paleta pendente por indisponibilidade do acesso à prévia correta e interrupção do Computer Use. Fonte e build passaram; ver docs/branding.md.

2026-10-29: produção pública em zm-exclusiva-tau.vercel.app, admin no alias privado zm-exclusiva-admin-guilherme.vercel.app. Standard Protection preservado para previews. 20 testes e HTTP anônimo aprovados; navegação até o checkout e acesso do proprietário ao admin conferidos no navegador.
