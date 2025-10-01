// =========================
// Formulario de contacto: validación y modal de feedback
// =========================
(function () {
  const form = document.getElementById('contacto-form');
  const modal = document.getElementById('alert-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc  = document.getElementById('modal-desc');
  const modalIcon  = modal.querySelector('.modal-icon-svg use');
  const closeEls   = modal.querySelectorAll('[data-close]');
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Abre el modal de feedback
  const openModal = ({ type = 'info', title = 'Aviso', message = 'Mensaje del sistema.' } = {}) => {
    modal.classList.remove('modal--success', 'modal--error', 'modal--info');
    modal.classList.add(`modal--${type}`);
    const iconHref = type === 'success' ? '#ico-success' : type === 'error' ? '#ico-error' : '#ico-info';
    modalIcon.setAttribute('href', iconHref);
    modalTitle.textContent = title;
    modalDesc.innerHTML = message;
    modal.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => modal.querySelector('.modal-actions .btn')?.focus());
  };
  // Cierra el modal de feedback
  const closeModal = () => {
    modal.hidden = true;
    document.documentElement.style.overflow = '';
    form?.querySelector('button[type="submit"]')?.focus();
  };
  closeEls.forEach(el => el.addEventListener('click', closeModal));
  modal.addEventListener('click', e => { if (e.target.dataset.close !== undefined) closeModal(); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  // Definición de campos y validadores
  const fields = {
    nombre:  { el: form.nombre,  required: true,  validator: v => v.trim().length > 0 || 'El nombre es obligatorio.' },
    email:   { el: form.email,   required: true,  validator: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Ingresá un email válido.' },
    asunto:  { el: form.asunto,  required: false, validator: () => true },
    mensaje: { el: form.mensaje, required: true,  validator: v => v.trim().length > 0 || 'El mensaje es obligatorio.' }
  };

  // Marca un campo como inválido
  const setError = (input, msg) => {
    input.classList.remove('is-valid');
    input.classList.add('is-invalid');
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('data-error', msg);
  };
  // Marca un campo como válido
  const setSuccess = (input) => {
    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
    input.removeAttribute('data-error');
    input.classList.add('is-valid');
  };
  // Limpia el estado visual de un campo
  const clearState = (input) => {
    input.classList.remove('is-invalid', 'is-valid');
    input.removeAttribute('aria-invalid');
    input.removeAttribute('data-error');
  };

  // Valida un campo individual
  const validateField = (key) => {
    const { el, required, validator } = fields[key];
    const val = el.value ?? '';
    const res = validator(val);
    if (required && res !== true) { setError(el, typeof res === 'string' ? res : 'Campo obligatorio.'); return false; }
    if (!required && val.trim() === '') { clearState(el); return true; }
    setSuccess(el);
    return true;
  };
  // Valida todos los campos
  const validateAll = () => {
    let ok = true;
    for (const key in fields) ok = validateField(key) && ok;
    return ok;
  };

  // Validación instantánea por campo
  Object.keys(fields).forEach(key => {
    const { el } = fields[key];
    el.addEventListener('input', () => validateField(key));
    el.addEventListener('blur', () => validateField(key));
  });

  // Envío del formulario
  form?.addEventListener('submit', e => {
    e.preventDefault();
    let errores = [];
    Object.keys(fields).forEach(key => {
      const valido = validateField(key);
      if (!valido) {
        const label = form.querySelector(`label[for="${key}"]`)?.innerText || key;
        errores.push(label);
      }
    });
    if (errores.length > 0) {
      const lista = '<ul class="error-list">' +
        errores.map(campo => `<li>${campo}</li>`).join('') +
        '</ul>';
      openModal({
        type: 'error',
        title: 'Hay campos por completar',
        message: '<p>Falta completar:</p>' + lista
      });
      form.querySelector('.is-invalid')?.focus();
      return;
    }
    // Simulación de envío exitoso
    setTimeout(() => {
      openModal({
        type: 'success',
        title: '¡Mensaje enviado!',
        message: 'Gracias por contactarte. Te responderemos a la brevedad.'
      });
      form.reset();
      Object.values(fields).forEach(({ el }) => clearState(el));
    }, prefersReduced ? 0 : 350);
  });

  // Limpia validaciones al resetear
  form?.addEventListener('reset', () => {
    Object.values(fields).forEach(({ el }) => clearState(el));
  });

  // Autoajuste de altura de textarea
  document.querySelectorAll('textarea').forEach(txt => {
    txt.style.height = txt.scrollHeight + 'px';
    txt.addEventListener('input', () => {
      txt.style.height = 'auto';
      txt.style.height = txt.scrollHeight + 'px';
    });
  });
})();
