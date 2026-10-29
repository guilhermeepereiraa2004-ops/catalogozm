/** Gentle artwork perspective; no hidden surfaces or 360° geometry. */
export function mountHeroMotion(hero) {
  if (!hero) return () => {};
  const controller = new AbortController();
  const { signal } = controller;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  const intensity = hero.classList.contains('hero-brand') ? .35 : 1;
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
    hero.classList.add('has-depth-motion');
    reset();
  }

  function paint() {
    frame = 0;
    if (!point) return;
    const rect = hero.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, ((point.x - rect.left) / rect.width - .5) * 2));
    const y = Math.max(-1, Math.min(1, ((point.y - rect.top) / rect.height - .5) * 2));
    hero.style.setProperty('--dress-turn', `${(x * 13 * intensity).toFixed(2)}deg`);
    hero.style.setProperty('--dress-lean', `${(-y * 7 * intensity).toFixed(2)}deg`);
    hero.style.setProperty('--dress-x', `${(x * 10 * intensity).toFixed(2)}px`);
    hero.style.setProperty('--dress-y', `${(y * 5 * intensity).toFixed(2)}px`);
  }

  hero.addEventListener('pointermove', event => {
    if (reduced.matches || !hover.matches || event.pointerType !== 'mouse') return;
    point = { x: event.clientX, y: event.clientY };
    hero.classList.add('is-tracking');
    if (!frame) frame = requestAnimationFrame(paint);
  }, { signal, passive: true });
  hero.addEventListener('pointerleave', reset, { signal });
  window.addEventListener('blur', reset, { signal });
  reduced.addEventListener('change', sync, { signal });
  hover.addEventListener('change', reset, { signal });
  sync();

  return () => { controller.abort(); reset(); };
}
