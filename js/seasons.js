// js/seasons.js
(() => {
  const DATA_URL = 'data/temporadas.json';
  const sel = (q, ctx = document) => ctx.querySelector(q);
  const all = (q, ctx = document) => Array.from(ctx.querySelectorAll(q));

  // --- UI refs (modal compartido ya presente en tu HTML) ---
  const modal = sel('#synopsisModal');
  const modalTitle = sel('#synopsisTitle');
  const modalContent = sel('#synopsisContent');
  const modalEpisodes = sel('#synopsisEpisodes');
  const modalBackdrop = modal?.querySelector('[data-close]');
  const modalCloseBtn = modal?.querySelector('.synopsis-close');

  // --- utils ---
  const create = (tag, cls, attrs = {}) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null) continue;
      if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v; // evitar usar 'html' salvo contenido de confianza
      else el.setAttribute(k, v);
    }
    return el;
  };

  const openModal = ({ title, synopsis, episodesUrl }) => {
    if (!modal) return;
    // contenido seguro (texto plano)
    modalTitle.textContent = title;
    // si queres permitir algunas etiquetas, sanitizá antes de usar innerHTML
    modalContent.textContent = synopsis;
    modalEpisodes.setAttribute('href', episodesUrl || '#');

    modal.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    modal.classList.add('is-open');
    // foco al botón cerrar
    modalCloseBtn?.focus();
  };

  const closeModal = () => {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    modal.classList.remove('is-open');
  };

  const bindModalEvents = () => {
    modalBackdrop?.addEventListener('click', closeModal);
    modalCloseBtn?.addEventListener('click', closeModal);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal?.classList.contains('is-open')) closeModal();
    });
  };

  // --- render de card de temporada ---
  const renderSeasonCard = (s) => {
    const article = create('article', 'card season');

    // poster
    const fig = create('figure', 'poster');
    const img = create('img', null, {
      src: s.poster?.src,
      alt: s.poster?.alt || s.title,
      loading: 'lazy',
      decoding: 'async'
    });
    fig.appendChild(img);
    article.appendChild(fig);

    // body
    const body = create('div', 'card-body');
    const h3 = create('h3', null, { text: s.title });
    const p = create('p', 'desc', { text: s.synopsis });
    const meta = create('div', 'meta');
    const chip1 = create('span', 'chip', { text: `${s.episodes} eps` });
    const chip2 = create('span', 'chip', { text: String(s.year) });
    meta.append(chip1, chip2);

    // actions
    const actions = create('div', 'actions');
    const btn = create('button', 'btn secundario open-synopsis', { type: 'button', text: 'Ver sinopsis' });
    const a = create('a', 'btn primario more', {
      href: s.episodes_url,
      target: '_blank',
      rel: 'noopener noreferrer',
      text: 'Ver episodios'
    });

    // dataset para modal
    btn.dataset.title = s.title;
    btn.dataset.synopsis = s.synopsis;
    btn.dataset.episodesUrl = s.episodes_url || '#';

    actions.append(btn, a);
    body.append(h3, p, meta, actions);
    article.appendChild(body);

    return article;
  };

  // --- hook botones sinopsis (delegación) ---
  const bindSynopsisOpen = (root) => {
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('.open-synopsis');
      if (!btn) return;
      const title = btn.dataset.title || '';
      const synopsis = btn.dataset.synopsis || '';
      const episodesUrl = btn.dataset.episodesUrl || '#';
      openModal({ title, synopsis, episodesUrl });
    });
  };

  // --- estado de carga (skeleton mínimo) ---
  const showSkeletons = (container, n = 4) => {
    for (let i = 0; i < n; i++) {
      const sk = create('article', 'card season is-skeleton');
      sk.innerHTML = `
        <figure class="poster"><div class="ph"></div></figure>
        <div class="card-body">
          <h3 class="ph ph-text"></h3>
          <p class="desc ph ph-text"></p>
          <div class="meta"><span class="chip ph"></span><span class="chip ph"></span></div>
          <div class="actions"><span class="btn ph"></span><span class="btn ph"></span></div>
        </div>`;
      container.appendChild(sk);
    }
  };

  const clearSkeletons = (container) => {
    all('.is-skeleton', container).forEach((el) => el.remove());
  };

  // --- init ---
  const init = async () => {
    const container = sel('.cards--seasons');
    if (!container) return;

    bindModalEvents();
    bindSynopsisOpen(container);
    showSkeletons(container, 6);

    try {
      const res = await fetch(DATA_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      clearSkeletons(container);

      const frag = document.createDocumentFragment();
      (data.seasons || []).forEach((s) => {
        frag.appendChild(renderSeasonCard(s));
      });
      container.appendChild(frag);
    } catch (err) {
      clearSkeletons(container);
      const msg = create('p', 'error', {
        text: 'No se pudieron cargar las temporadas. Intenta recargar la pagina.'
      });
      container.appendChild(msg);
      // opcional: console.warn para desarrollo
      console.warn('[seasons] load error:', err);
    }
  };

  // run
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init, { once: true })
    : init();
})();

// =========================
// Modal de sinopsis de temporada
// =========================
(function () {
  const modal = document.getElementById('synopsisModal');
  if (!modal) return;
  const titleEl = document.getElementById('synopsisTitle');
  const contentEl = document.getElementById('synopsisContent');
  const episodesEl = document.getElementById('synopsisEpisodes');
  const closeEls = modal.querySelectorAll('[data-close]');
  let lastFocus = null;

  // Abre el modal de sinopsis
  const openModal = ({ title, html, episodesHref }) => {
    lastFocus = document.activeElement;
    titleEl.textContent = title || 'Sinopsis';
    contentEl.innerHTML = html || '';
    if (episodesHref) episodesEl.setAttribute('href', episodesHref);
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('show');
    // Enfocar el botón cerrar para accesibilidad
    const closeBtn = modal.querySelector('.synopsis-close');
    closeBtn?.focus();
    // Evitar scroll de fondo
    document.documentElement.style.overflow = 'hidden';
  };
  
  // Cierra el modal de sinopsis
  const closeModal = () => {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  };
  closeEls.forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal();
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  // Delegación: botones "Ver sinopsis"
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.open-synopsis');
    if (!btn) return;
    const card = btn.closest('.card');
    if (!card) return;
    // Título = <h3> de la card
    const h3 = card.querySelector('h3');
    const title = h3 ? h3.textContent.trim() : 'Temporada';
    // Sinopsis = el primer <p> largo de la card
    const p = card.querySelector('p');
    const html = p ? `<p>${p.innerHTML}</p>` : '';
    // Link "Ver episodios" (si existe en la card)
    const episodesLink = card.querySelector('.btn.more, a.more');
    const href = episodesLink ? episodesLink.getAttribute('href') : '#';
    openModal({ title, html, episodesHref: href });
  });
})();

// utilidades (al inicio del IIFE)
let lastActiveEl = null;
const trapFocus = (container, e) => {
  if (e.key !== 'Tab') return;
  const focusables = container.querySelectorAll(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusables.length) return;
  const first = focusables[0];
  const last  = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
};

// al abrir
const openModal = ({ title, synopsis, episodesUrl }) => {
  if (!modal) return;
  lastActiveEl = document.activeElement;
  modalTitle.textContent = title;
  modalContent.textContent = synopsis;
  modalEpisodes.setAttribute('href', episodesUrl || '#');
  modal.setAttribute('aria-hidden', 'false');
  document.documentElement.style.overflow = 'hidden';
  modal.classList.add('is-open');
  modal.addEventListener('keydown', onKeyTrap);
  modalCloseBtn?.focus();
};
const onKeyTrap = (e) => trapFocus(modal, e);

// al cerrar
const closeModal = () => {
  if (!modal) return;
  modal.removeEventListener('keydown', onKeyTrap);
  modal.setAttribute('aria-hidden', 'true');
  document.documentElement.style.overflow = '';
  modal.classList.remove('is-open');
  lastActiveEl?.focus();
};
