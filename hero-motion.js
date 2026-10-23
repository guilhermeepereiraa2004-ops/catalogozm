/** Photo-based perspective effect; no hidden surfaces or 360° geometry. */
export function mountHeroMotion(hero) {
  if (!hero) return () => {};
  const controller = new AbortController();
  const { signal } = controller;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  const toggle = hero.querySelector('.hero-motion-toggle');
  let paused = reduced.matches;
  let frame = 0;
  let point = null;

  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    point = null;
    hero.style.setProperty('--dress-turn', '0deg');
    hero.style.setProperty('--dress-lean', '0deg');
    hero.style.setProperty('--dress-x', '0px');
    hero.style.setProperty('--dress-y', '0px');
    hero.classList.remove('is-tracking');
  }

  function sync() {
    const active = !paused;
    hero.classList.toggle('has-depth-motion', active);
    toggle.setAttribute('aria-label', paused ? 'Ativar movimento do vestido' : 'Pausar movimento do vestido');
    toggle.setAttribute('title', paused ? 'Ativar movimento' : 'Pausar movimento');
    toggle.setAttribute('aria-pressed', String(paused));
    if (!active) reset();
  }

  function paint() {
    frame = 0;
    if (!point) return;
    const rect = hero.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, ((point.x - rect.left) / rect.width - .5) * 2));
    const y = Math.max(-1, Math.min(1, ((point.y - rect.top) / rect.height - .5) * 2));
    hero.style.setProperty('--dress-turn', `${(x * 13).toFixed(2)}deg`);
    hero.style.setProperty('--dress-lean', `${(-y * 7).toFixed(2)}deg`);
    hero.style.setProperty('--dress-x', `${(x * 10).toFixed(2)}px`);
    hero.style.setProperty('--dress-y', `${(y * 5).toFixed(2)}px`);
  }

  hero.addEventListener('pointermove', event => {
    if (paused || !hover.matches || event.pointerType !== 'mouse') return;
    point = { x: event.clientX, y: event.clientY };
    hero.classList.add('is-tracking');
    if (!frame) frame = requestAnimationFrame(paint);
  }, { signal, passive: true });
  hero.addEventListener('pointerleave', reset, { signal });
  window.addEventListener('blur', reset, { signal });
  toggle.addEventListener('click', () => { paused = !paused; sync(); }, { signal });
  reduced.addEventListener('change', () => {
    if (reduced.matches) paused = true;
    sync();
  }, { signal });
  hover.addEventListener('change', reset, { signal });
  sync();

  return () => { controller.abort(); reset(); };
}
