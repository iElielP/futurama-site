// =========================
// Variables y selectores globales
// =========================
// (Se definen dentro de cada IIFE para evitar contaminación global)

// =========================
// Menú hamburguesa accesible y mejoras de UX
// =========================
(function () {
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('nav');
  const links = nav?.querySelectorAll('a');

  // Abre el menú de navegación
  const openMenu = () => {
    nav.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
  };
  // Cierra el menú de navegación
  const closeMenu = () => {
    nav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  };

  navToggle?.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    expanded ? closeMenu() : openMenu();
  });
  links?.forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
  const media = window.matchMedia('(min-width: 768px)');
  media.addEventListener('change', (e) => {
    if (e.matches) {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
  // Año dinámico en el footer
  const anio = document.getElementById('anio');
  if (anio) anio.textContent = new Date().getFullYear();
})();

// =========================
// Marcar enlace activo según ruta
// =========================
(function () {
  try {
    const here = location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('.nav-list a');
    links.forEach(a => {
      const href = a.getAttribute('href');
      if (!href) return;
      const file = href.split('/').pop();
      if ((file === '' && here === 'index.html') || file === here) {
        a.classList.add('active');
      }
    });
  } catch {}
})();
