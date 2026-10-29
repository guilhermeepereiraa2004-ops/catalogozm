# Hero com logo — 2026-10-29

A pedido da cliente, a arte central da hero substitui o vestido por uma adaptação da logo em medalhão rosé com relevo dourado. Mantidos título editorial, CTA do catálogo, paleta branca/rosa/dourada e foto original da logo no cabeçalho e rodapé. A adaptação é uma imagem, sem viewer 3D ou controles de giro.

Arquivo final: assets/hero-logo-medallion.png, RGBA, 1254 × 1254 px, com transparência real (alfa de 0 a 255), 2.131.616 bytes. Criado com a ferramenta integrada image_gen; fonte assets/logo-zm-exclusiva.jpg. Original da logo preservado. A arte gerada foi inspecionada: ZM, coroa, EXCLUSIVA, coração e STORE presentes.

Integração: classe hero-brand, legenda atualizada, tamanho quadrado, flutuação suave e paralaxe reduzida para manter a leitura da logo. No celular usa a área de imagem do grid existente, com medidas próprias do medalhão. Preferência de movimento reduzido usa deslocamento de apenas 2 px. Sem botão de pausa, conforme preferência anterior. O servidor local agora anuncia PNG como image/png.

Validação: gate com 14 testes, sintaxe, camadas, GLB e build; HTTP 200 da página, JS e arte. JS servido contém a arte da logo e não referencia a imagem anterior do vestido na hero. A inspeção do layout montado no navegador permanece pendente pela limitação de acesso à prévia já documentada em docs/branding.md; não afirmar QA visual de desktop/mobile desta composição.

## Prompt final — ferramenta integrada

```text
Use case: precise-object-edit / brand hero asset. Edit target: the attached ZM Exclusiva Store logo. Create a premium three-dimensional boutique medallion version for the center of a fashion website hero. Preserve the exact logo identity: large high contrast serif ZM initials, crown centered above, EXCLUSIVA lettering below, small outlined heart between thin horizontal rules, STORE below. Exact text only: 'ZM', 'EXCLUSIVA', 'STORE'. Preserve the original relative proportions, letter shapes, crown and heart. Render one almost front-facing thick circular emblem, with only a subtle 8 degree perspective and visible narrow gold bevel, not tilted typography. Interior is softly textured matte dusty rose, ring and raised lettering are warm polished champagne gold with delicate realistic embossed shadows and highlights. Sophisticated soft studio lighting, tasteful restrained luxury, sharp and legible. Isolate the whole medallion on a genuinely transparent alpha background; remove all exterior pink square background. Entire circular ring fully inside frame with modest 6 percent transparent padding on all edges. Square 1024x1024 composition, one centered emblem only. No floor, no stand, no props, no extra text, no watermarks, no extra logos. This is a hero art adaptation, not a redesign. Keep it readable at 300 pixels.
```
