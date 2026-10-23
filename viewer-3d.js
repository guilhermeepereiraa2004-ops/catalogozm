import './vendor/model-viewer.min.js';
const model = document.querySelector('#dress-model');
const status = document.querySelector('#model-status');
model.addEventListener('load', () => { status.textContent = 'Modelo 3D pronto para girar'; });
model.addEventListener('error', () => {
  status.textContent = 'Não foi possível abrir o 3D neste navegador. Você pode baixar o arquivo GLB.';
});
document.querySelectorAll('[data-angle]').forEach(button => {
  button.addEventListener('click', () => {
    model.cameraOrbit = `${button.dataset.angle}deg 85deg 2.65m`;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) model.jumpCameraToGoal();
    document.querySelectorAll('[data-angle]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  });
});
model.addEventListener('camera-change', event => {
  if (event.detail.source !== 'user-interaction') return;
  document.querySelectorAll('[data-angle]').forEach(b => b.setAttribute('aria-pressed', 'false'));
});
