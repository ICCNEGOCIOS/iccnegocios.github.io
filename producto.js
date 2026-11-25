/* ============================================================
   PRODUCTO.JS — ficha de producto (producto.html?id=...)
   Galería con zoom, presentaciones, entrega por ubicación,
   medios de pago, descripción, especificaciones y relacionados.
   Requiere: config.js, data.js, sheets.js, cart.js, common.js
   ============================================================ */

const FREE_LIMA_FROM = 150;       // misma regla que tu promo de delivery gratis

let product = null, group = [], qty = 1, imgIdx = 0, images = [];
let loc = getLoc();
const persistLoc = () => saveLoc(loc);

const inMetro = () => loc.dep === 'Lima' || loc.dep === 'Callao';
const brandName = p => (BRANDS.find(b => b.id === p.brand) || { name: p.brand }).name;
const catName = p => (CATEGORIES.find(c => c.id === p.cat) || { name: p.cat }).name;
const linkTo = p => `producto.html?id=${encodeURIComponent(p.id)}`;

/* ---------- Galería ---------- */
function galleryHTML() {
  images = [product.image && { src: product.image, label: 'Frontal' }, product.image2 && { src: product.image2, label: 'Trasera' }].filter(Boolean);
  imgIdx = 0;
  const main = images.length
    ? `<img id="pd-main-img" src="${esc(images[0].src)}" alt="${esc(product.name)}" referrerpolicy="no-referrer">`
    : `<div class="pd-noimg">${svgIcon(product.icon, 90)}</div>`;
  const thumbs = images.length > 1 ? `<div class="pd-thumbs">${images.map((im, i) =>
    `<button class="pd-thumb ${i === 0 ? 'on' : ''}" data-i="${i}" aria-label="Ver imagen ${esc(im.label.toLowerCase())}"><img src="${esc(im.src)}" alt="" referrerpolicy="no-referrer" onerror="this.style.visibility='hidden'"><span>${im.label}</span></button>`).join('')}</div>` : '';
  return `<div class="pd-gallery">
    <div class="pd-stage" id="pd-stage" title="Pasa el cursor para ampliar · clic para pantalla completa">${main}
      ${images.length ? '<span class="pd-zoomhint">🔍 Ampliar</span>' : ''}</div>${thumbs}</div>`;
}
function setImage(i) {
  imgIdx = i;
  const img = $('pd-main-img'); if (img) img.src = images[i].src;
  document.querySelectorAll('.pd-thumb').forEach((t, k) => t.classList.toggle('on', k === i));
}
function bindZoom() {
  const stage = $('pd-stage'); if (!stage) return;
  $('pd-main-img')?.addEventListener('error', function () {
    this.replaceWith(Object.assign(document.createElement('div'), { className: 'pd-noimg', innerHTML: svgIcon(product.icon, 90) }));
    images = [];
  });
  stage.addEventListener('mousemove', e => {
    const img = $('pd-main-img'); if (!img) return;
    const r = stage.getBoundingClientRect();
    img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    img.classList.add('zoom');
  });
  stage.addEventListener('mouseleave', () => $('pd-main-img')?.classList.remove('zoom'));
  stage.addEventListener('click', () => { if (images.length) openLightbox(imgIdx); });
  document.querySelectorAll('.pd-thumb').forEach(t => t.addEventListener('click', () => setImage(+t.dataset.i)));
}
function openLightbox(i) {
  const lb = $('lightbox'); lb.hidden = false; document.body.style.overflow = 'hidden';
  const show = k => { imgIdx = (k + images.length) % images.length; $('lb-img').src = images[imgIdx].src; };
  show(i);
  $('lb-prev').style.display = $('lb-next').style.display = images.length > 1 ? '' : 'none';
  $('lb-prev').onclick = e => { e.stopPropagation(); show(imgIdx - 1); };
  $('lb-next').onclick = e => { e.stopPropagation(); show(imgIdx + 1); };
  const close = () => { lb.hidden = true; document.body.style.overflow = ''; setImage(imgIdx); document.removeEventListener('keydown', key); };
  const key = e => { if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(imgIdx - 1); if (e.key === 'ArrowRight') show(imgIdx + 1); };
  document.addEventListener('keydown', key);
  $('lb-close').onclick = close; lb.onclick = e => { if (e.target === lb) close(); };
}

/* ---------- Entrega ---------- */
const IC = {
  pin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
  store: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M10 20v-5h4v5"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h12v10H2z"/><path d="M14 9h4l3 3v4h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
};
let draft = { dep: '', dist: '' }, editingLoc = false;
const locLabel = () => [loc.dist, loc.dep].filter(Boolean).join(', ');

function methodList() {
  const free = (product.price || 0) * qty >= FREE_LIMA_FROM;
  const metro = inMetro(), has = !!loc.dep;
  return [
    { id: 'recojo', icon: IC.store, ok: true, title: 'Recojo en tienda', tag: 'Gratis', tagClass: 'free',
      text: 'Av. Aviación 1240, La Victoria.', sub: 'Lun–Vie 9:00–18:00 · Sáb 9:00–13:00' },
    { id: 'delivery', icon: IC.truck, ok: has && metro, title: 'Delivery Lima y Callao', tag: free ? 'Gratis' : 'Según distrito', tagClass: free ? 'free' : '',
      text: free ? 'Tu pedido supera S/ 150: sin costo de envío.' : `Gratis desde S/ ${FREE_LIMA_FROM}. Si no llegas, el costo se confirma por WhatsApp.`, sub: 'Despacho en 24–48 h' },
    { id: 'agencia', icon: IC.box, ok: has && !metro, title: 'Envío por agencia', tag: 'Flete aparte', tagClass: '',
      text: 'Despachamos con la agencia que prefieras (Olva, Shalom, etc.).', sub: 'El flete se cotiza por WhatsApp' }
  ];
}

function deliveryHTML() {
  const methods = methodList();
  if (!methods.some(m => m.id === loc.method && m.ok)) loc.method = loc.dep ? (methods.find(m => m.ok && m.id !== 'recojo') || methods[0]).id : '';
  const locked = !loc.dep || editingLoc;
  const dists = draft.dep === 'Callao' ? DISTRITOS_CALLAO : DISTRITOS_LIMA;
  const overlay = !locked ? '' : `
    <div class="loc-overlay"><div class="loc-card">
      <span class="loc-card-pin">${IC.pin}</span>
      <h4>Selecciona tu ubicación</h4>
      <p>Así te mostramos cómo podemos entregarte este producto.</p>
      <select id="loc-dep" aria-label="Departamento"><option value="">Elige tu departamento…</option>${DEPARTAMENTOS.map(d => `<option ${d === draft.dep ? 'selected' : ''}>${d}</option>`).join('')}</select>
      ${(draft.dep === 'Lima' || draft.dep === 'Callao') ? `<select id="loc-dist" aria-label="Distrito"><option value="">Elige tu distrito…</option>${dists.map(d => `<option ${d === draft.dist ? 'selected' : ''}>${d}</option>`).join('')}</select>` : ''}
      <div class="loc-actions"><button class="btn btn-dark btn-sm" id="loc-apply" ${draft.dep ? '' : 'disabled'}>Aplicar</button>${loc.dep ? '<button class="loc-cancel" id="loc-cancel">Cancelar</button>' : ''}</div>
    </div></div>`;
  return `<div class="pd-box pd-deliv" id="pd-delivery">
    <h3>Métodos de entrega</h3>
    <div class="deliv-loc">
      <span class="deliv-loc-pin">${IC.pin}</span>
      <div><small>Entrega según tu ubicación</small><b>${loc.dep ? esc(locLabel()) : 'No definido'}</b></div>
      ${loc.dep && !editingLoc ? '<button class="loc-change" id="loc-change">Cambiar</button>' : ''}
    </div>
    <div class="deliv-grid ${locked ? 'locked' : ''}">
      ${methods.map(m => `
      <button type="button" class="deliv-tile ${m.id === loc.method ? 'on' : ''} ${m.ok ? '' : 'off'}" data-m="${m.id}" ${m.ok && !locked ? '' : 'disabled'} aria-pressed="${m.id === loc.method}">
        <span class="deliv-check">${IC.check}</span>
        <span class="deliv-ico">${m.icon}</span>
        <b>${m.title}</b>
        <em class="${m.tagClass}">${m.ok || locked ? m.tag : 'No disponible en tu zona'}</em>
        <small>${m.text}</small><small class="sub">${m.sub}</small>
      </button>`).join('')}
      ${overlay}
    </div>
  </div>`;
}
function bindDelivery() {
  const dep = $('loc-dep');
  if (dep) {
    dep.onchange = e => { draft.dep = e.target.value; draft.dist = ''; $('pd-delivery').outerHTML = deliveryHTML(); bindDelivery(); $('loc-dep').focus(); };
    $('loc-dist')?.addEventListener('change', e => { draft.dist = e.target.value; });
    $('loc-apply').onclick = () => { loc.dep = draft.dep; loc.dist = draft.dist; loc.method = ''; editingLoc = false; persistLoc(); refreshBuy(); };
    $('loc-cancel')?.addEventListener('click', () => { editingLoc = false; refreshDelivery(); });
  }
  $('loc-change')?.addEventListener('click', () => { draft = { dep: loc.dep, dist: loc.dist }; editingLoc = true; refreshDelivery(); });
  document.querySelectorAll('.deliv-tile').forEach(t => t.onclick = () => { loc.method = t.dataset.m; persistLoc(); refreshDelivery(); $('pd-wsp').href = `https://wa.me/${WSP}?text=${waMessage()}`; });
}
function refreshDelivery() { $('pd-delivery').outerHTML = deliveryHTML(); bindDelivery(); }

/* ---------- Medios de pago ---------- */
function paymentHTML() {
  const list = (typeof PAYMENT_METHODS !== 'undefined' ? PAYMENT_METHODS : ['yape', 'plin', 'visa', 'transfer']).filter(k => PAY[k]);
  return `<div class="pd-box pd-pay">
    <h3>Te ofrecemos los siguientes métodos de pago</h3>
    <div class="pay-grid">${payLogos(list)}</div>
    <p class="pd-hint">Coordinas el pago con nuestro asesor por WhatsApp al confirmar tu pedido.</p>
  </div>`;
}

/* ---------- Mensaje de WhatsApp ---------- */
function waMessage() {
  const methods = { recojo: 'Recojo en tienda', delivery: 'Delivery Lima/Callao', agencia: 'Envío por agencia' };
  const place = [loc.dist, loc.dep].filter(Boolean).join(', ');
  return encodeURIComponent([
    'Hola ICC Negocios! Quiero comprar:',
    `• ${product.name} — ${product.unit} (${brandName(product)})`,
    `• Cantidad: ${qty}`,
    product.price != null ? `• Precio: ${money(product.price)} c/u · Subtotal ${money(product.price * qty)}` : '• Precio: por cotizar',
    `• Código: ${product.code}`,
    loc.method ? `• Entrega: ${methods[loc.method]}${place ? ' — ' + place : ''}` : '',
    location.href
  ].filter(Boolean).join('\n'));
}

/* ---------- Página ---------- */
function render() {
  const p = product;
  const cat = CATEGORIES.find(c => c.id === p.cat);
  $('pd-crumbs').innerHTML = `<a href="index.html">Inicio</a> › <a href="tienda.html">Tienda</a> › <a href="tienda.html?cat=${p.cat}">${esc(catName(p))}</a> › <span>${esc(p.name)}</span>`;

  const variants = group.map(v => `
    <button class="pd-var ${v.id === p.id ? 'on' : ''}" data-id="${esc(v.id)}">
      <b>${esc(v.unit)}</b><small>${v.price != null ? money(v.price) : 'Cotizar'}</small>
    </button>`).join('');
  const specs = [...p.specs, ['Categoría', catName(p)], ['Unidad de venta', p.unitType]].filter((r, i, a) => a.findIndex(x => x[0] === r[0]) === i);
  const quote = p.price == null;

  $('pd-content').innerHTML = `
  <div class="pd-grid">
    ${galleryHTML()}
    <div class="pd-info">
      <a class="pd-brand" href="tienda.html?brand=${encodeURIComponent(p.brand)}">${esc(brandName(p))}</a>
      <h1>${esc(p.name)}</h1>
      <div class="pd-sku">Código: <span class="mono">${esc(p.code)}</span></div>
      <div class="pd-price">${quote ? '<span class="pd-quote">Precio por cotizar</span>' : `<span class="mono">${money(p.price)}</span><small>por ${esc(p.unit.toLowerCase())}</small>`}</div>

      <div class="pd-label">Presentación: <b>${esc(p.unit)}</b></div>
      <div class="pd-vars">${variants}</div>

      <div class="pd-buy">
        <div class="pd-qty"><button id="q-minus" aria-label="Menos">−</button><input id="q-val" type="number" min="1" value="${qty}" aria-label="Cantidad"><button id="q-plus" aria-label="Más">+</button></div>
        ${quote ? '' : '<button class="btn btn-dark pd-add" id="pd-add">🛒 Agregar al carrito</button>'}
        <a class="btn btn-wsp pd-wsp" id="pd-wsp" target="_blank" rel="noopener" href="https://wa.me/${WSP}?text=${waMessage()}">${quote ? 'Cotizar por WhatsApp' : 'Comprar por WhatsApp'}</a>
      </div>
      <p class="pd-stock">Stock referencial: <a target="_blank" rel="noopener" href="https://wa.me/${WSP}?text=${encodeURIComponent('Hola, ¿tienen stock de ' + p.name + ' (' + p.unit + ')?')}">consultar disponibilidad</a></p>

      ${deliveryHTML()}

      ${paymentHTML()}
    </div>
  </div>

  <section class="pd-tabs">
    <div class="pd-tabbar" role="tablist">
      <button class="on" data-tab="t-desc" role="tab">Descripción</button>
      <button data-tab="t-spec" role="tab">Especificaciones</button>
    </div>
    <div class="pd-tab on" id="t-desc">
      ${String(p.desc).split(/\n+/).map(t => `<p>${esc(t)}</p>`).join('')}
      ${p.datasheet ? `<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${esc(p.datasheet)}">📄 Descargar ficha técnica</a>` : ''}
    </div>
    <div class="pd-tab" id="t-spec"><table class="pd-specs">${specs.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table></div>
  </section>

  <section class="pd-related" id="pd-related"></section>

  <div class="pd-sticky" id="pd-sticky">
    <div class="wrap pd-sticky-in">
      <div class="pd-sticky-thumb">${svgIcon(p.icon, 30)}${p.image ? `<img src="${esc(p.image)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}</div>
      <div class="pd-sticky-name">${esc(p.name)}<small>${esc(p.unit)}${quote ? '' : ' · ' + money(p.price)}</small></div>
      <div class="pd-qty pd-qty-s"><button id="s-minus" aria-label="Menos">−</button><input id="s-val" type="number" min="1" value="${qty}" aria-label="Cantidad"><button id="s-plus" aria-label="Más">+</button></div>
      ${quote ? `<a class="pd-sticky-buy" target="_blank" rel="noopener" href="https://wa.me/${WSP}?text=${waMessage()}">Cotizar</a>` : '<button class="pd-sticky-buy" id="s-buy">Comprar 🛒</button>'}
    </div>
  </div>`;

  document.title = `${p.name} ${p.unit} | ICC Negocios`;
  bindZoom(); bindDelivery(); renderRelated();

  document.querySelectorAll('.pd-var').forEach(b => b.onclick = () => selectVariant(b.dataset.id));
  const setQty = n => { qty = Math.max(1, Math.min(999, n || 1)); $('q-val').value = qty; $('s-val').value = qty; refreshBuy(); };
  $('q-minus').onclick = () => setQty(qty - 1); $('q-plus').onclick = () => setQty(qty + 1);
  $('s-minus').onclick = () => setQty(qty - 1); $('s-plus').onclick = () => setQty(qty + 1);
  $('q-val').onchange = e => setQty(parseInt(e.target.value, 10)); $('s-val').onchange = e => setQty(parseInt(e.target.value, 10));
  const buy = () => { addToCart(p.id, qty, true); showAdded(p, qty); };
  $('pd-add')?.addEventListener('click', buy); $('s-buy')?.addEventListener('click', buy);
  document.querySelectorAll('.pd-tabbar button').forEach(b => b.onclick = () => {
    document.querySelectorAll('.pd-tabbar button, .pd-tab').forEach(x => x.classList.remove('on'));
    b.classList.add('on'); $(b.dataset.tab).classList.add('on');
  });
}
function refreshBuy() { refreshDelivery(); $('pd-wsp').href = `https://wa.me/${WSP}?text=${waMessage()}`; }

/* ---------- Ventana "Producto añadido" ---------- */
function showAdded(p, n) {
  let m = $('added-modal');
  if (!m) { m = document.createElement('div'); m.id = 'added-modal'; m.className = 'ck-modal'; document.body.appendChild(m); }
  const total = Object.values(cart).reduce((a, b) => a + b, 0);
  m.innerHTML = `<div class="ck-modal-card added-card" role="dialog" aria-modal="true" aria-label="Producto añadido">
    <div class="added-head"><span class="added-ok">✓</span><b>Producto añadido con éxito al carrito</b><button class="ck-x" id="added-x" aria-label="Cerrar">×</button></div>
    <div class="added-body">
      <div class="added-img">${svgIcon(p.icon, 48)}${p.image ? `<img src="${esc(p.image)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}<span class="added-badge">${n}</span></div>
      <div><h4>${esc(p.name)}</h4><div class="added-pres"><b>Presentación:</b> ${esc(p.unit)}</div><div class="added-price">${money(p.price * n)}</div></div>
    </div>
    <div class="added-actions"><button class="added-more" id="added-more">🛍 Ver más productos</button><a class="ck-btn" href="carrito.html">Ir a mi carrito (${total})</a></div>
  </div>`;
  m.classList.add('open');
  const close = () => m.classList.remove('open');
  $('added-x').onclick = close; m.onclick = e => { if (e.target === m) close(); };
  $('added-more').onclick = () => { close(); location.href = 'tienda.html'; };
  if (typeof updateCartUI === 'function') updateCartUI();
}

function selectVariant(id) {
  product = group.find(v => v.id === id) || product;
  history.replaceState(null, '', linkTo(product));
  render(); window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderRelated() {
  const seen = new Set([product.group]);
  const rel = PRODUCTS.filter(p => p.group !== product.group && (p.cat === product.cat))
    .sort((a, b) => (b.brand === product.brand) - (a.brand === product.brand))
    .filter(p => !seen.has(p.group) && seen.add(p.group)).slice(0, 4);
  $('pd-related').innerHTML = rel.length ? `<h2>Productos relacionados</h2><div class="pd-rel-grid">${rel.map(r => `
    <a class="pd-rel" href="${linkTo(r)}">
      <div class="pd-rel-img">${svgIcon(r.icon, 44)}${r.image ? `<img src="${esc(r.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}</div>
      <small>${esc(brandName(r))}</small><b>${esc(r.name)}</b>
      <span class="mono">${r.price != null ? money(r.price) : 'Cotizar precio'}</span>
    </a>`).join('')}</div>` : '';
}

document.addEventListener('DOMContentLoaded', async () => {
  document.querySelector('[data-page="tienda.html"]')?.classList.add('active');
  await window.productsReady;
  if (typeof updateCartUI === 'function') updateCartUI();
  const id = new URLSearchParams(location.search).get('id');
  product = PRODUCTS.find(p => p.id === id);
  if (!product) {
    document.title = 'Producto no encontrado | ICC Negocios';
    $('pd-content').innerHTML = `<div class="empty-state"><b>No encontramos este producto.</b><p>Puede que ya no esté en el catálogo.</p><a class="btn btn-dark" href="tienda.html">Ver la tienda</a></div>`;
    return;
  }
  group = PRODUCTS.filter(p => p.group === product.group).sort((a, b) => a.liters - b.liters);
  render();
});
