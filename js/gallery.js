// ==== Galería dinámica desde data/galeria.json ==== //
(async function initGalleryFromJSON() {
  const grid = document.querySelector('#gallery.gallery-grid');
  if (!grid) return; // No estamos en galeria.html

  try {
    const res = await fetch('data/galeria.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const albums = Array.isArray(data?.albums) ? data.albums : [];

    const html = albums.map(a => {
      const rutas = (a.imagenes || []).map(it => it.src).join(',');
      const thumbW = a.imagenes?.[0]?.width || '';
      const thumbH = a.imagenes?.[0]?.height || '';
      const captions = (a.imagenes || []).map(it => it.caption || '').map(c => `<figcaption>${c}</figcaption>`).join('');

      return `
        <figure data-album="${rutas}">
          <img
            src="${a.thumbnail}"
            alt="${a.titulo || ''}"
            loading="lazy"
            ${thumbW ? `width="${thumbW}"` : ''}
            ${thumbH ? `height="${thumbH}"` : ''}
          >
          ${captions}
        </figure>
      `;
    }).join('');

    grid.innerHTML = html;

  } catch (err) {
    console.error('No se pudo cargar data/galeria.json', err);
    grid.innerHTML = `
      <p role="status">No se pudo cargar la galería en este momento.</p>
    `;
  }
})();

// =========================
// Lightbox/Álbum por personaje 
// =========================
(function () {
  const grid      = document.querySelector('.gallery-grid');
  const lightbox  = document.getElementById('lightbox');
  const img       = document.getElementById('lightbox-img');
  const btnClose  = document.getElementById('lightbox-close');
  const btnPrev   = document.getElementById('lightbox-prev');
  const btnNext   = document.getElementById('lightbox-next');
  const counter   = document.getElementById('lightbox-counter');
  const captionEl = document.getElementById('lightbox-caption');
  const progress    = document.getElementById('lightbox-progress');
  const progressBar = document.getElementById('lightbox-progress-bar');

  if (!grid || !lightbox || !img) return;

  let album = [];
  let captions = [];
  let index = 0;
  let lastFocus = null;
  let animating = false;

  // === AUTO-ROTACION (Autoplay) SINCRONIZADA CON LA BARRA ===
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AUTOPLAY_MS = 4500;
  const BUFFER_MS = 40;

  let autoplayActive = false;
  let nextTimer = null;
  let onProgressEnd = null;

  function clearNext() {
    if (nextTimer) { clearTimeout(nextTimer); nextTimer = null; }
    if (onProgressEnd) {
      progressBar?.removeEventListener('transitionend', onProgressEnd);
      onProgressEnd = null;
    }
  }

  function restartProgress() {
    if (!progress || !progressBar) return;
    progressBar.style.transition = 'none';
    progressBar.style.width = '0%';
    // fuerza reflow
    // eslint-disable-next-line no-unused-expressions
    progressBar.offsetHeight;
    progress.classList.remove('is-hidden');
    progressBar.style.transition = `width ${AUTOPLAY_MS}ms linear`;
    progressBar.style.width = '100%';

    onProgressEnd = (e) => {
      if (!autoplayActive) return;
      if (e.propertyName !== 'width') return;
      show(index + 1);
    };
    progressBar.addEventListener('transitionend', onProgressEnd, { once: true });

    clearTimeout(nextTimer);
    nextTimer = setTimeout(() => {
      if (!autoplayActive) return;
      show(index + 1);
    }, AUTOPLAY_MS + BUFFER_MS);
  }

  function startAutoplay() {
    if (prefersReduced || album.length <= 1) {
      lightbox.classList.add('has-no-autoplay');
      return;
    }
    lightbox.classList.remove('has-no-autoplay');
    autoplayActive = true;
    clearNext();
    restartProgress();
  }

  function stopAutoplay() {
    autoplayActive = false;
    clearNext();
    if (progress) progress.classList.add('is-hidden');
    if (progressBar) {
      progressBar.style.transition = 'none';
      progressBar.style.width = '0%';
    }
  }

  function bindAutoplayInteractions() {
    const stopEvts  = ['mouseenter','focusin','pointerdown','keydown','wheel','touchstart'];
    const startEvts = ['mouseleave','focusout','touchend'];
    stopEvts.forEach(evt  => lightbox.addEventListener(evt,  stopAutoplay,  { passive: true }));
    startEvts.forEach(evt => lightbox.addEventListener(evt,  startAutoplay, { passive: true }));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAutoplay(); else startAutoplay();
    });
  }

  // Bloqueo de scroll (coincidir con tu clase global)
  const lockScroll   = () => document.documentElement.classList.add('modal-open');
  const unlockScroll = () => document.documentElement.classList.remove('modal-open');

  // Pausar el fondo (canvas) si tu spacefx.js expone API; si no, no pasa nada
  const pauseFx  = () => (window.spacefx && typeof window.spacefx.pause  === 'function') && window.spacefx.pause();
  const resumeFx = () => (window.spacefx && typeof window.spacefx.resume === 'function') && window.spacefx.resume();

  // Pre-decodifica una imagen: evita el "flash" inicial
  async function predecode(url) {
    const it = new Image();
    it.decoding = 'async';
    it.referrerPolicy = 'no-referrer'; // opcional
    it.src = url;
    if ('decode' in it) {
      try { await it.decode(); } catch {}
    } else {
      await new Promise(res => { it.onload = it.onerror = res; });
    }
    return url;
  }

  // Crea (si no existe) un spinner dentro del contenido
  function ensureSpinner() {
    let spin = lightbox.querySelector('.lightbox-spinner');
    if (!spin) {
      spin = document.createElement('div');
      spin.className = 'lightbox-spinner';
      lightbox.querySelector('.lightbox-content')?.appendChild(spin);
    }
    return spin;
  }

  function animateImgTransition(newSrc, cb) {
    if (img.src === newSrc) { cb && cb(); return; }
    if (!img.src) {
      img.src = newSrc;
      img.onload = () => {
        img.style.transition = 'opacity .28s ease, transform .28s ease';
        img.style.opacity = 1; img.style.transform = 'scale(1) translateY(0)';
        setTimeout(() => { img.style.transition = ''; cb && cb(); }, 280);
      };
      return;
    }
    img.style.transition = 'opacity .18s ease, transform .18s ease';
    img.style.opacity = 0; img.style.transform = 'scale(.96) translateY(36px)'; img.style.visibility = 'hidden';
    setTimeout(() => {
      img.src = newSrc;
      img.onload = () => {
        img.style.visibility = 'visible';
        img.style.transition = 'opacity .24s ease, transform .24s ease';
        img.style.opacity = 1; img.style.transform = 'scale(1) translateY(0)';
        setTimeout(() => { img.style.transition = ''; cb && cb(); }, 240);
      };
    }, 180);
  }

  const show = (i) => {
    if (animating) return;
    animating = true;
    index = (i + album.length) % album.length;
    counter.textContent = `${index + 1} / ${album.length}`;

    const apply = () => {
      if (captionEl.textContent.trim()) {
        captionEl.classList.add('leaving');
        setTimeout(() => {
          captionEl.classList.remove('leaving');
          animateImgTransition(album[index], () => {
            captionEl.textContent = captions[index] || '';
            captionEl.classList.add('entering');
            setTimeout(() => {
              captionEl.classList.remove('entering');
              animating = false;
              if (autoplayActive) {
                clearNext();
                restartProgress();
              }
            }, 260);
          });
        }, 160);
      } else {
        animateImgTransition(album[index], () => {
          captionEl.textContent = captions[index] || '';
          captionEl.classList.add('entering');
          setTimeout(() => {
            captionEl.classList.remove('entering');
            animating = false;
            if (autoplayActive) {
              clearNext();
              restartProgress();
            }
          }, 260);
        });
      }

      // Precarga vecinos
      new Image().src = album[(index + 1) % album.length];
      new Image().src = album[(index - 1 + album.length) % album.length];
    };

    apply();
  };

  const openWith = async (list, start = 0, figure = null) => {
    album = list.filter(Boolean);
    const figs = figure ? Array.from(figure.querySelectorAll('figcaption')) : [];
    captions = figs.length
      ? (figs.length > 1 ? figs.map(c => c.textContent.trim()) : album.map(() => figs[0].textContent.trim()))
      : album.map(() => '');

    lastFocus = document.activeElement;
    img.style.opacity = 0;
    img.style.transform = 'scale(.98) translateY(20px)';
    captionEl.textContent = '';

    // Mostrar overlay, con spinner mientras decodifica la primera
    lightbox.hidden = false;
    lockScroll();
    pauseFx();
    const spin = ensureSpinner();

    const first = album[start] || album[0];
    try {
      await predecode(first); // decodifica antes de pintar
    } finally {
      // una sola vez (se había duplicado)
      spin.remove();
      show(start);
      btnClose?.focus();
      startAutoplay();
      bindAutoplayInteractions();
    }
  };

  const closeLightbox = () => {
    stopAutoplay();
    lightbox.hidden = true;
    unlockScroll();
    resumeFx();
    img.src = '';
    captionEl.textContent = '';
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  };

  // abrir
  grid.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t && t.tagName === 'IMG')) return;
    const figure = t.closest('figure');
    const attr = figure?.dataset.album;
    const list = attr ? attr.split(',').map(s => s.trim()) : [t.src];
    openWith(list, 0, figure);
  });

  // navegar / cerrar
  btnClose?.addEventListener('click', closeLightbox);
  btnPrev?.addEventListener('click', () => show(index - 1));
  btnNext?.addEventListener('click', () => show(index + 1));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') show(index + 1);
    if (e.key === 'ArrowLeft')  show(index - 1);
  });
})();
