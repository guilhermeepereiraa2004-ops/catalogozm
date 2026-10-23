/** Mount and dispose the real GLB viewer rendered in the storefront hero. */
export function mountHero3D(hero) {
  if (!hero) return () => {};
  const controller = new AbortController();
  const {signal} = controller;
  const viewer = hero.querySelector('#hero-dress-model');
  const status = hero.querySelector('.hero-3d-status');
  const buttons = [...hero.querySelectorAll('[data-hero-turn], [data-hero-reset]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let ready = false;

  function loaded() {
    ready = true;
    hero.classList.add('is-3d-ready');
    status.textContent = 'Arraste para girar · 360°';
    buttons.forEach(button => {button.disabled = false;});
  }

  viewer.addEventListener('load', loaded, {signal});
  viewer.addEventListener('error', () => {
    ready = false;
    hero.classList.add('is-3d-unavailable');
    status.textContent = '3D indisponível. Foto de referência.';
    buttons.forEach(button => {button.disabled = true;});
  }, {signal});

  buttons.forEach(button => button.addEventListener('click', () => {
    if (!ready) return;
    if (button.hasAttribute('data-hero-reset')) {
      viewer.cameraOrbit = '-10deg 85deg 2.3m';
    } else {
      const {theta, phi, radius} = viewer.getCameraOrbit();
      const next = theta + Number(button.dataset.heroTurn) * Math.PI / 180;
      viewer.cameraOrbit = `${next}rad ${phi}rad ${radius}m`;
    }
    if (reduced.matches) viewer.jumpCameraToGoal();
  }, {signal}));

  customElements.whenDefined('model-viewer').then(() => {
    if (!signal.aborted && viewer.loaded) loaded();
  });

  return () => controller.abort();
}
