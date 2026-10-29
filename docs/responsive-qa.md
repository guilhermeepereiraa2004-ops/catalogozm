# Revisão responsiva e animação — 2026-10-22

Atualização 2026-10-29: a revisão descrita abaixo é histórica. A hero atual usa a logo e os layouts foram reorganizados em mobile.css; as verificações antigas não comprovam a composição atual. A nova implementação e a pendência de acesso para QA visual estão em docs/mobile-refresh.md.

Implementação: responsive.css após hero.css; hero-motion.js inicia animação contínua da foto sem controle de play/pausa. O GLB e o link 360 continuam fora da hero, conforme preferência do usuário.

## Verificações no navegador

| Largura da moldura | Área útil com scrollbar | Resultado |
|---|---|---|
| 320 px | 305 px | Hero, catálogo, menu, admin, edição, detalhes da roupa, sacola e checkout sem largura excedente |
| 390 px | 375 px | Hero e catálogo inspecionados; página mantém largura útil |
| 430 px | 415 px | Hero e catálogo inspecionados; página mantém largura útil |
| 768 px | 753 px | Hero e navegação de tablet sem largura excedente |
| 844 × 390 px | 829 px | Cabeçalho e hero na horizontal sem largura excedente; página rola verticalmente |

No mobile, as categorias quebram em linhas para manter todas as opções visíveis. A elipse decorativa da hero ultrapassa sua caixa transformada e é recortada pelo próprio componente; isso não amplia a página.

Revisão após relato de corte lateral: uma aba aberta ainda exibia HTML anterior, sem responsive.css. Após recarregar, também foram verificadas molduras de 240 e 280 px (áreas úteis 225 e 265 px). Antes do ajuste, o cabeçalho aumentava a página para 268 e 270 px; após o ajuste, scrollWidth = clientWidth, com deslocamento horizontal zero. Em até 320 px, a marca fica compacta e a hero empilha texto e CTA; abaixo de 280 px, fotos e produtos usam uma coluna. Em 320/390/430 px, catálogo, filtros e títulos ficam inteiros, sem elementos fora da largura. Filtro Vestidos em 320 px confirmou 4 peças. O harness agora mede também elementos à esquerda e scrollLeft.

Em 320 px: menu com favoritos acessível quando o atalho é recolhido do cabeçalho; admin renderiza as linhas como cartões; formulário de produto usa uma coluna; imagem dos detalhes usa contain; sacola e checkout mantêm campos e ações dentro da largura. A sacola de teste foi esvaziada ao fim; nenhum pedido foi criado nesta revisão.

Animação confirmada via estilo computado do elemento visível: `animationName=dress-float-gentle`, `animationIterationCount=infinite`, `animationPlayState=running`. Não existe `.hero-motion-toggle` no DOM. Em preferência normal usa dress-float; com movimento reduzido, amplitude de 3 px e rotação de 0,5° e sem paralaxe do mouse.

Harness local: scripts/responsive-preview.html. Não é distribuído no build. A medição usa scrollWidth/clientWidth do documento e inspeção visual pelo cua_repl. Testes feitos em viewports de navegador; não em aparelhos físicos ou uma auditoria completa de tecnologias assistivas.
