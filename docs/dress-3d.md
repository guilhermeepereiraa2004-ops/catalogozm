# Vestido Aurora — GLB aproximado

Arquivo: `assets/models/vestido-aurora-aproximado.glb`.
Prévia: `/vestido-3d.html`. A hero renderiza o GLB diretamente com giro pelo mouse/toque, setas e retorno à frente. A foto é usada apenas durante o carregamento. Um link permite ampliar nessa prévia dedicada.

## Referências e método
Somente a vista frontal deste vestido está disponível: `assets/look-01.webp`, originalmente enviada pela loja. O recorte transparente derivado dessa foto, `assets/hero-aurora-cutout.png`, orienta a silhueta e fornece a textura.

O script `scripts/create-dress-glb.py` lê a imagem sem alterá-la e gera superfícies trianguladas curvas para frente e costas, com seção de profundidade estimada. A concha dourada recebe uma malha e material metálico separados. Não é uma placa com a foto girando: há coordenadas X, Y e Z, normais e materiais, com textura incorporada no GLB. O viewer oferece rotação completa, zoom e posições acessíveis de frente/laterais/costas.

## Limites da interpretação
- Profundidade e costas são inferidas da silhueta frontal; a projeção do tecido da frente também é reaproveitada nas costas.
- Não há informação fotográfica das costas, escaneamento 3D, simulação física de tecido, medidas reais ou reconstrução por múltiplas vistas.
- Acabamentos e bordas têm a resolução da malha extraída da silhueta. A concha é uma aproximação geométrica.
- As dimensões são normalizadas para exibição; não representam medidas de confecção.
- A visualização é ilustrativa e não comprova caimento ou aparência real dos ângulos não fotografados. Esse aviso aparece junto ao viewer.

## Verificação
`npm run validate:glb` usa o [validador oficial da Khronos](https://github.com/KhronosGroup/glTF-Validator). O relatório completo é salvo em `docs/glb-validation.json`; estatísticas em `docs/dress-3d-report.json`. Resultado: zero erros e zero avisos; uma informação sobre dimensões da imagem (não potência de dois), compatíveis com a prévia WebGL atual.

Viewer: [model-viewer 4.4.0](https://modelviewer.dev/), distribuído localmente a partir do CDN oficial do Google. Licença Apache-2.0 em `vendor/MODEL_VIEWER_LICENSE.txt`; avisos de terceiros no próprio bundle. Sem upload das fotos para um serviço externo de reconstrução 3D. O GLB é gerado localmente por NumPy/Pillow e empacotado conforme [glTF 2.0](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html).
