/* ============================================================
   COMMON.JS — comportamiento compartido en TODAS las páginas
   Requiere que data.js esté cargado antes que este archivo.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Menú móvil (burger)
  const navlinksEl = document.querySelector('.navlinks');
  const burger = document.getElementById('burger');
  if (burger && navlinksEl) {
    burger.addEventListener('click', () => navlinksEl.classList.toggle('open'));
    navlinksEl.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navlinksEl.classList.remove('open')));
  }

  // Marca de la página activa en el menú (resalta el link correspondiente)
  const currentPage = (location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.navlinks a[data-page]').forEach(a => {
    if (a.dataset.page === currentPage) a.classList.add('active-link');
  });

  renderFooterCategories();
  renderBrandMarquee();
  renderCategoryGrid();
  initPromoCarousel();
  renderTestimonials();
  renderActivePromos();
});

/* ---------------- FOOTER: líneas de producto ---------------- */
function renderFooterCategories() {
  const footCats = document.getElementById('foot-cats');
  if (!footCats || typeof CATEGORIES === 'undefined') return;
  footCats.innerHTML = CATEGORIES.map(c => `<li><a href="tienda.html?cat=${c.id}">${c.name}</a></li>`).join('');
}

/* ---------------- FRANJA DE MARCAS (marquee) ---------------- */
function renderBrandMarquee() {
  const marqueeTrack = document.getElementById('marquee-track');
  if (!marqueeTrack || typeof BRANDS === 'undefined') return;

  function brandChip(b) {
    const src = b.file ? b.file : `assets/brands/${b.id.toLowerCase()}.svg`;
    return `
      <div class="brand-chip" data-brand="${b.id}" onclick="goToBrand('${b.id}')">
        <div class="brand-logo-slot"><img src="${src}" alt="${b.name}" loading="lazy"></div>
      </div>`;
  }
  marqueeTrack.innerHTML = [...BRANDS, ...BRANDS].map(brandChip).join(''); // duplicado para loop continuo
}

// Ir a la tienda con una marca preseleccionada. Si ya estamos en tienda.html,
// usa el filtro en vivo; si no, navega con parámetro de URL.
function goToBrand(brandId) {
  if (typeof applyBrandFilter === 'function') {
    applyBrandFilter(brandId);
    document.getElementById('tienda-top')?.scrollIntoView({ behavior: 'smooth' });
  } else {
    window.location.href = `tienda.html?brand=${encodeURIComponent(brandId)}`;
  }
}
function goToCategory(catId) {
  if (typeof applyCatFilter === 'function') {
    applyCatFilter(catId);
    document.getElementById('tienda-top')?.scrollIntoView({ behavior: 'smooth' });
  } else {
    window.location.href = `tienda.html?cat=${encodeURIComponent(catId)}`;
  }
}

/* ---------------- CATEGORÍAS (grid, usado en Inicio) ---------------- */
function renderCategoryGrid() {
  const catGrid = document.getElementById('cat-grid');
  if (!catGrid || typeof CATEGORIES === 'undefined') return;
  catGrid.innerHTML = CATEGORIES.map(c => `
    <a href="tienda.html?cat=${c.id}" class="cat-card" data-cat="${c.id}" onclick="return handleCatCardClick(event,'${c.id}')">
      <div class="cat-icon">${svgIcon(c.icon, 26)}</div>
      <h3>${c.name}</h3>
      <span>${c.desc}</span>
      <span class="go">VER PRODUCTOS →</span>
    </a>`).join('');
}
function handleCatCardClick(e, catId) {
  if (typeof applyCatFilter === 'function') {
    e.preventDefault();
    applyCatFilter(catId);
    document.getElementById('tienda-top')?.scrollIntoView({ behavior: 'smooth' });
    return false;
  }
  return true; // navega normalmente a tienda.html?cat=...
}

/* ---------------- PRODUCT / PROMO MODAL (compartido) ---------------- */
function openProductModal(id) {
  const modalOverlay = document.getElementById('modal-overlay');
  const modalBox = document.getElementById('modal-box');
  if (!modalOverlay || !modalBox) return;
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  modalBox.innerHTML = `
    <button class="modal-close" onclick="closeModal()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="modal-grid">
      <div class="modal-media">
        ${p.tag === 'oferta' ? '<span class="badge oferta">OFERTA</span>' : (p.tag === 'nuevo' ? '<span class="badge nuevo">NUEVO</span>' : '')}
        <div class="prod-image-slot" ${p.image ? `style="background-image:url('${p.image}')"` : ''}>
          ${p.image ? '' : svgIcon(p.icon, 90)}
        </div>
      </div>
      <div class="modal-content">
        <div class="card-brand">${p.brand}</div>
        <h2>${p.name}</h2>
        <div class="modal-unit">Presentación: ${p.unit}</div>
        <div class="modal-price">
          ${p.price !== null ? `
            <span class="price-now mono">S/ ${p.price.toFixed(2)}</span>
            ${p.old ? `<span class="price-old mono">S/ ${p.old.toFixed(2)}</span>` : ''}
          ` : `<span class="price-now mono" style="font-size:19px;">Precio a cotizar</span>`}
        </div>
        <div class="modal-badges">
          <span class="mini-badge">✅ Stock disponible</span>
          <span class="mini-badge">🚚 Despacho 24–48h</span>
        </div>
        <p class="modal-desc">${p.desc}</p>
        <div class="spec-table">
          ${p.specs.map(([k, v]) => `<div class="spec-row"><span>${k}</span><span>${v}</span></div>`).join('')}
        </div>
        <div class="modal-actions">
          <button class="btn btn-dark" style="flex:1;" onclick="addToCart('${p.id}'); closeModal();">🛒 Agregar al carrito</button>
          <a class="btn btn-wsp" target="_blank" href="https://wa.me/51933795267?text=${encodeURIComponent('Hola, quisiera cotizar: ' + p.name + ' (' + p.brand + ')')}">Cotizar</a>
        </div>
      </div>
    </div>
  `;
  openModal();
}

function openPromoModal(id) {
  const modalOverlay = document.getElementById('modal-overlay');
  const modalBox = document.getElementById('modal-box');
  if (!modalOverlay || !modalBox) return;
  const promo = (typeof PROMOS !== 'undefined' && PROMOS[id]) || (typeof ACTIVE_PROMOTIONS !== 'undefined' && ACTIVE_PROMOTIONS.find(item => item.id === id));
  if (!promo) return;

  const items = promo.items || [
    promo.text,
    'Consulta disponibilidad y condiciones actuales por WhatsApp.',
    'Válido mientras haya stock disponible.'
  ];

  const imageMarkup = promo.image ? `
    <div class="promo-modal-media">
      <img src="${promo.image}" alt="${promo.title}" loading="eager">
    </div>
  ` : '';

  modalBox.innerHTML = `
    <button class="modal-close" onclick="closeModal()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="promo-modal-head">
      <div class="eyebrow">${promo.badge || promo.label || 'Promoción vigente'}</div>
      <h2>${promo.title}</h2>
    </div>
    <div class="promo-modal-layout">
      ${imageMarkup}
      <div class="promo-modal-body">
        <p class="modal-desc" style="margin-top:0;">${promo.desc || promo.text}</p>
        <ul>
          ${items.map(i => `<li><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>${i}</li>`).join('')}
        </ul>
        <div class="modal-actions">
          <a class="btn btn-wsp" style="flex:1; text-align:center;" target="_blank" href="https://wa.me/51933795267?text=${encodeURIComponent('Hola, quisiera aprovechar la promoción: ' + promo.title)}">Consultar esta promoción</a>
        </div>
        <div class="promo-terms">${promo.terms || 'Consulta condiciones actualizadas por WhatsApp.'}</div>
      </div>
    </div>
  `;
  openModal();
}

function openModal() {
  const modalOverlay = document.getElementById('modal-overlay');
  if (!modalOverlay) return;
  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  const modalOverlay = document.getElementById('modal-overlay');
  if (!modalOverlay) return;
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('DOMContentLoaded', () => {
  const modalOverlay = document.getElementById('modal-overlay');
  if (modalOverlay) modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
});

/* ---------------- PROMO CAROUSEL (usado en Inicio) ---------------- */
function initPromoCarousel() {
  const trackEl = document.getElementById('carousel-track');
  const dotsEl = document.getElementById('carousel-dots');
  if (!trackEl || !dotsEl) return;

  const CAROUSEL_SLIDES = [
    { img: 'assets/promos/promo-1.png', promoId: 'p1' },
    { img: 'assets/promos/promo-2.png', promoId: 'p2' },
    { img: 'assets/promos/promo-3.png', promoId: 'p3' },
  ];
  trackEl.innerHTML = CAROUSEL_SLIDES.map(s => `
    <div class="carousel-slide" onclick="window.open('https://heyzine.com/flip-book/ffd9ddecaf.html#page/1','_blank')">
      <img src="${s.img}" alt="Promoción">
    </div>
  `).join('');
  dotsEl.innerHTML = CAROUSEL_SLIDES.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}" data-i="${i}"></span>`).join('');

  let slideIndex = 0;
  function goToSlide(i) {
    slideIndex = (i + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length;
    trackEl.style.transform = `translateX(-${slideIndex * 100}%)`;
    document.querySelectorAll('.carousel-dots .dot').forEach((d, idx) => d.classList.toggle('active', idx === slideIndex));
  }
  document.getElementById('carousel-next')?.addEventListener('click', () => goToSlide(slideIndex + 1));
  document.getElementById('carousel-prev')?.addEventListener('click', () => goToSlide(slideIndex - 1));
  dotsEl.addEventListener('click', e => { const d = e.target.closest('.dot'); if (d) goToSlide(+d.dataset.i); });

  let carouselTimer = setInterval(() => goToSlide(slideIndex + 1), 5000);
  const carouselSection = document.getElementById('promo-carousel-section');
  carouselSection?.addEventListener('mouseenter', () => clearInterval(carouselTimer));
  carouselSection?.addEventListener('mouseleave', () => { carouselTimer = setInterval(() => goToSlide(slideIndex + 1), 5000); });
}

/* ---------------- TESTIMONIOS (usado en Inicio) ---------------- */
function renderTestimonials() {
  const testGrid = document.getElementById('test-grid');
  if (!testGrid) return;
  const TESTIMONIALS = [
    { name: 'Jorge R.', role: 'Dueño de taller mecánico', text: 'Compro grasas y aceites al por mayor para mi taller. Siempre tienen stock y el precio es mejor que en otros proveedores de la zona.', color1: '#0b3b6f', color2: '#159de0' },
    { name: 'Milagros T.', role: 'Cliente particular', text: 'Pedí un aceite por WhatsApp y me lo trajeron el mismo día. Muy buena atención y me explicaron bien qué producto necesitaba mi auto.', color1: '#c8102e', color2: '#f5b400' },
    { name: 'Carlos V.', role: 'Administrador de flota', text: 'Trabajamos con ellos para el mantenimiento de nuestras unidades. El precio por volumen y la facturación son un punto a favor.', color1: '#07213f', color2: '#0d63ad' },
  ];
  testGrid.innerHTML = TESTIMONIALS.map(t => `
    <div class="test-card">
      <div class="test-stars">${'★★★★★'.split('').map(() => '<span>★</span>').join('')}</div>
      <p class="test-quote">"${t.text}"</p>
      <div class="test-person">
        <div class="test-avatar" style="background:linear-gradient(135deg, ${t.color1}, ${t.color2});">${t.name.split(' ').map(w => w[0]).join('')}</div>
        <div><b>${t.name}</b><span>${t.role}</span></div>
      </div>
    </div>
  `).join('');
}

/* ---------------- PROMOCIÓN DESTACADA (tienda) ---------------- */
function renderActivePromos() {
  const promoStorePanel = document.getElementById('promo-store-panel');
  if (!promoStorePanel || typeof ACTIVE_PROMOTIONS === 'undefined') return;
  promoStorePanel.innerHTML = ACTIVE_PROMOTIONS.map(p => `
    <article class="promo-store-card" onclick="openPromoModal('${p.id}')" style="cursor:pointer;">
      <div class="promo-store-image-wrap">
        <img class="promo-store-image" src="${p.image}" alt="${p.title}" loading="eager" draggable="false">
      </div>
      <div class="promo-content">
        <span class="promo-badge">${p.label}</span>
        <div class="promo-label">Promoción vigente</div>
        <h3>${p.title}</h3>
        <p>${p.text}</p>
        <p style="font-size:12px; color:#735d00; font-weight:700;">${p.terms}</p>
      </div>
    </article>
  `).join('');
}

/* ---------------- SEGUIMIENTO DE PEDIDO (demo) ---------------- */
function trackOrder() {
  const orderId = document.getElementById('t-order').value.trim();
  const email = document.getElementById('t-email').value.trim();
  const resultBox = document.getElementById('track-result');
  if (!orderId || !email) return;

  const DEMO_STAGES = ['Confirmado', 'En preparación', 'En camino', 'Entregado'];
  let hash = 0;
  for (const ch of orderId) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const stageIndex = hash % DEMO_STAGES.length;

  resultBox.innerHTML = `
    <div class="track-timeline">
      ${DEMO_STAGES.map((s, i) => `
        <div class="t-item ${i <= stageIndex ? 'done' : ''}">
          <div class="t-dot">${i <= stageIndex ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}</div>
          <div><h5>${s}</h5><span>${i <= stageIndex ? 'Actualizado' : 'Pendiente'}</span></div>
        </div>
      `).join('')}
    </div>
    <p style="font-size:11.5px; color:#8fabc6; margin-top:16px; line-height:1.6;">
      * Vista de demostración para pedido <b style="color:#fff;">${orderId}</b>. Al integrarse con el sistema de ventas de ICC Negocios, este panel mostrará el estado real y actualizado de tu pedido.
      ¿Prefieres consultar directo? <a href="https://wa.me/51933795267?text=${encodeURIComponent('Hola, quisiera consultar el estado de mi pedido ' + orderId)}" target="_blank" style="color:var(--amarillo-claro); font-weight:700;">Escríbenos por WhatsApp</a>.
    </p>
  `;
}

/* ---------------- FORMULARIO DE COTIZACIÓN ---------------- */
function sendQuoteForm() {
  const name = document.getElementById('q-name').value.trim();
  const phone = document.getElementById('q-phone').value.trim();
  const category = document.getElementById('q-category').value;
  const msg = document.getElementById('q-msg').value.trim();
  const text = `Hola ICC Negocios, quisiera una cotización.%0A%0ANombre: ${name}%0ATeléfono: ${phone}%0ACategoría: ${category || 'No especificada'}%0ADetalle: ${msg || 'Sin detalle adicional'}`;
  window.open(`https://wa.me/51933795267?text=${text}`, '_blank');
}
