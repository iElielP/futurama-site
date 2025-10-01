// =========================
// Hero Carousel (index.html)
// Autoplay SIEMPRE activo, sin interaccion del usuario
// Crossfade sin zoom, indicadores "dots"
// =========================
(function () {
  const hero = document.getElementById('hero');
  if (!hero) return;

  const imgA = document.getElementById('hero-img-a');
  const imgB = document.getElementById('hero-img-b');
  const dotsUl = document.getElementById('hero-dots');
  if (!imgA || !imgB || !dotsUl) return;

  // lista de imagenes desde data-images
  const LIST = (() => {
    try { return JSON.parse(hero.getAttribute('data-images') || '[]'); }
    catch { return []; }
  })().filter(Boolean);

  if (LIST.length <= 1) return; // no hace falta carrusel

  // estado
  let idx = 0;
  let useA = true;          // cual capa esta activa
  const DURATION_MS = 4500; // tiempo por slide
  let timer = null;

  // render de dots
  function renderDots() {
    dotsUl.innerHTML = LIST.map(() => `<li></li>`).join('');
    updateDots();
  }

  function updateDots() {
    const nodes = dotsUl.querySelectorAll('li');
    nodes.forEach((li, i) => li.classList.toggle('is-active', i === idx));
  }

  // preload simple
  function preload(src) {
    const im = new Image();
    im.decoding = 'async';
    im.src = src;
  }

  // crossfade entre capas sin zoom
  function swapTo(src) {
    const active = useA ? imgA : imgB;
    const hidden = useA ? imgB : imgA;

    // preparar capa oculta
    hidden.classList.remove('is-active');
    hidden.setAttribute('aria-hidden', 'true');
    hidden.alt = ''; // evitar texto duplicado
    hidden.src = src;

    hidden.onload = () => {
      // activar nueva
      hidden.classList.add('is-active');
      hidden.removeAttribute('aria-hidden');

      // desactivar anterior
      active.classList.remove('is-active');

      // alternar capa
      useA = !useA;

      // actualizar dots
      updateDots();
    };
  }

  function next() {
    idx = (idx + 1) % LIST.length;
    const nextSrc = LIST[idx];
    swapTo(nextSrc);

    // preload vecinos
    preload(LIST[(idx + 1) % LIST.length]);
    preload(LIST[(idx - 1 + LIST.length) % LIST.length]);

    // programar autoplay siempre
    clearTimeout(timer);
    timer = setTimeout(next, DURATION_MS);
  }

  function start() {
    // sincroniza con la imagen inicial si coincide
    const initial = imgA.getAttribute('src');
    const found = LIST.indexOf(initial);
    if (found >= 0) {
      idx = found;
      preload(LIST[(idx + 1) % LIST.length]);
    } else {
      idx = 0;
      imgA.src = LIST[0];
      imgA.classList.add('is-active');
    }

    clearTimeout(timer);
    timer = setTimeout(next, DURATION_MS);
  }

  renderDots();
  start();

  // sin listeners de pausa/visibilidad: autoplay siempre
})();
