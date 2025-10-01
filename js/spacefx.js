

// ===============================
//  FX Futurama: Fondo animado SOLO ESTRELLAS
// ===============================

(() => {
  // ===============================
  // Variables globales y configuración
  // ===============================
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) { canvas.style.display = 'none'; return; }
  const ctx = canvas.getContext('2d');

  // Paletas de colores estilo Futurama (hues)
  const FUTURAMA_HUES = [160, 196, 286, 320, 180, 210, 265, 300, 155, 170, 190, 205, 285, 200, 230, 260, 290, 320];
  // ===============================
  // Estado de estrellas
  // ===============================
  let stars = [];
  // Capas de estrellas para profundidad y variedad
  const LAYERS = [
    { speed: 6,  size: [0.6, 1.0], alpha: [0.10, 0.20] }, // lejos
    { speed: 12, size: [0.9, 1.4], alpha: [0.10, 0.18] }, // medio
    { speed: 20, size: [1.2, 2.0], alpha: [0.10, 0.16] }  // cerca
  ];
  // Tamaño y resolución
  let dpr = 1, W = 0, H = 0;

  // ===============================
  // Funciones utilitarias
  // ===============================
  // Número aleatorio flotante entre a y b
  function rand(a, b) { return a + Math.random() * (b - a); }
  // Limita valor entre lo y hi
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  // Elige un elemento aleatorio de un array
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
  // Devuelve un color hsla
  const colorHSLA = (h, s = 90, l = 60, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;

  // ===============================
  // Funciones de inicialización y resize
  // ===============================
  // Ajusta el tamaño del canvas y reinicia estrellas
  function resize() {
    dpr = Math.max(1, Math.min(2, devicePixelRatio || 1));
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedStars();
  }

  // ===============================
  // Semilla de estrellas
  // ===============================
  // Genera las estrellas iniciales en las distintas capas
  function seedStars() {
    const area = W * H;
    const base = Math.max(180, Math.min(800, Math.floor(area / 5200)));
    stars = [];
    LAYERS.forEach((def, i) => {
      const count = Math.floor(base * (0.55 + i * 0.32));
      for (let j = 0; j < count; j++) {
        // Cada estrella tiene un color aleatorio de la paleta Futurama
        const hue = pick(FUTURAMA_HUES);
        // Algunas estrellas parpadean
        const twinkle = Math.random() < 0.18 ? {
          t: rand(0, Math.PI * 2),
          sp: rand(0.4, 1.2),
          amp: rand(0.03, 0.06)
        } : null;
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: rand(-1.2, 1.2),
          vy: def.speed + rand(-2, 2),
          r: rand(def.size[0], def.size[1]),
          a: rand(def.alpha[0], def.alpha[1]),
          hue,
          tw: twinkle,
          wob: rand(0.2, 0.6),
          wobT: rand(0, Math.PI * 2)
        });
      }
    });
  }

  // ===============================
  // Dibujo de estrellas
  // ===============================
  function drawStars(sec) {
    // Fondo: degradado radial tipo galaxia
    const grad = ctx.createRadialGradient(W/2, H*0.3, W*0.1, W/2, H/2, Math.max(W, H)*0.7);
    grad.addColorStop(0, '#1a233a');
    grad.addColorStop(1, '#0b1522');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    for (const s of stars) {
      s.wobT += s.wob * sec;
      s.x += s.vx * sec;
      s.y += (s.vy + Math.sin(s.wobT) * 0.6) * sec;

      // Reaparece arriba o a los costados si sale de pantalla
      if (s.y > H + 3) { s.y = -3; s.x = Math.random() * W; }
      if (s.x < -3)    { s.x = W + 3; }
      if (s.x > W + 3) { s.x = -3; }

      let alpha = s.a;
      if (s.tw) {
        s.tw.t += s.tw.sp * sec;
        alpha = clamp(s.a + Math.sin(s.tw.t) * s.tw.amp, 0.05, 0.9);
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = colorHSLA(s.hue, 90, 70, alpha);
      ctx.shadowColor = colorHSLA(s.hue, 100, 70, 0.18);
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // ===============================
  // Bucle principal de animación
  // ===============================
  let last = performance.now();
  let secEMA = 1 / 60; // suavizado para naturalidad
  function frame(now) {
    const dt = Math.min(40, now - last); last = now;
    let sec = dt / 1000;
    // EMA para evitar tirones: 85% anterior + 15% nuevo
    secEMA = secEMA * 0.85 + sec * 0.15;
    sec = secEMA;
    drawStars(sec);
    requestAnimationFrame(frame);
  }

  // ===============================
  // Inicialización principal
  // ===============================
  resize();
  addEventListener('resize', resize, { passive: true });
  requestAnimationFrame(frame);

})();
