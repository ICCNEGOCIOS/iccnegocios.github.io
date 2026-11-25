/* ============================================================
   CHECKOUT.JS — carrito.html · pedido.html · gracias.html
   Flujo: 1) Carrito  2) Pedido (comprobante, identificación,
   entrega, pago) → pago Yape/transferencia/tarjeta → constancia
   3) Confirmación.
   Requiere: config.js, data.js, sheets.js, shared.js, cart.js
   ============================================================ */
const PAGE = document.body.dataset.page;
const CK_KEY = 'icc_checkout_v1', ORDER_KEY = 'icc_last_order_v1';
const round2 = n => Math.round(n * 100) / 100;
const fmtDate = iso => { const d = new Date(iso + 'T12:00:00'); const s = d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }); return s.charAt(0).toUpperCase() + s.slice(1); };
const PAGOS = { wallet: 'Billetera digital (Yape)', transfer: 'Transferencia bancaria', card: 'Tarjeta de crédito o débito' };
const bankKeys = () => (CHECKOUT.BANK_ACCOUNTS || []).map(b => b.bank);
const thumb = (p, s = 40) => svgIcon(p.icon, s) + (p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : '');

/* ---------- Carrito ---------- */
const entries = () => Object.entries(cart).map(([id, qty]) => ({ p: PRODUCTS.find(x => x.id === id), qty })).filter(e => e.p);
const subtotalOf = list => round2(list.reduce((a, e) => a + (e.p.price || 0) * e.qty, 0));
const hasQuote = list => list.some(e => e.p.price == null);

function stepsHTML(n) {
  const ico = ['🛒', '🧾', '✔'], lbl = ['Carrito', 'Pedido', 'Listo'];
  $('ck-steps').innerHTML = [1, 2, 3].map(i => `<span class="ck-step ${i === n ? 'on' : i < n ? 'past' : ''}"><i>${ico[i - 1]}</i>${i <= n ? `<b>${i}º Paso</b>` : `<b class="sr">${lbl[i - 1]}</b>`}</span>${i < 3 ? '<span class="ck-sep">›</span>' : ''}`).join('');
}

function renderCart() {
  stepsHTML(1);
  const list = entries(), sub = subtotalOf(list), fee = round2(sub * CHECKOUT.CARD_FEE_PCT / 100);
  if (!list.length) {
    $('ck-main').innerHTML = `<h1 class="ck-title">🛒 Tu carrito</h1><div class="ck-panel ck-empty"><b>Tu carrito está vacío</b><p>Agrega productos desde la tienda para continuar.</p><a class="ck-btn" href="tienda.html">Ir a la tienda</a></div>`;
    return;
  }
  const quote = hasQuote(list);
  $('ck-main').innerHTML = `<h1 class="ck-title">🛒 Tu carrito</h1>
  <div class="ck-cols">
    <section class="ck-panel ck-list">${list.map(({ p, qty }) => `
      <article class="ck-item">
        <div class="ck-item-img">${thumb(p, 44)}</div>
        <div class="ck-item-body">
          <h3>${esc(p.name)}</h3><small>${esc(p.unit)} · ${esc(p.code)}</small>
          <div class="ck-item-prices"><div><span>P. Unitario</span><b>${p.price != null ? money(p.price) : 'Cotizar'}</b></div><div><span>Subtotal</span><b>${p.price != null ? money(p.price * qty) : '—'}</b></div></div>
          <div class="ck-qty"><button data-q="-1" data-id="${esc(p.id)}" aria-label="Menos">−</button><span>${qty}</span><button data-q="1" data-id="${esc(p.id)}" aria-label="Más">+</button>
            <button class="ck-del" data-del="${esc(p.id)}">Quitar</button></div>
        </div>
      </article>`).join('')}
    </section>
    <aside class="ck-panel ck-sum">
      <h2>Subtotal</h2>
      ${quote ? '<p class="ck-warn">Hay productos por cotizar. Escríbenos por WhatsApp para completar tu pedido.</p>' : `
      <div class="ck-payrow"><div><b class="blue">Pago con Tarjeta</b><div class="ck-logos">${payLogos(['visa', 'mastercard', 'amex', 'diners'], 'xs')}</div></div><strong class="blue">${money(sub + fee)}</strong></div>
      <div class="ck-payrow"><div><b class="red">Transferencia / Yape</b><div class="ck-logos">${payLogos([...bankKeys(), 'yape'], 'xs')}</div></div><strong class="red">${money(sub)}</strong></div>`}
      <a class="ck-btn ck-btn-block ${quote ? 'disabled' : ''}" href="${quote ? '#' : 'pedido.html'}">Finalizar compra</a>
      <a class="ck-link" href="tienda.html">🛍 Ver más productos</a>
    </aside>
  </div>`;
}

/* ---------- Pedido: estado ---------- */
const blank = () => ({ tipo: 'boleta', id: { email: '', tel: '', tdoc: 'DNI', doc: '', nombres: '', apellidos: '', razon: '', dirFiscal: '', ok: false }, ent: { modo: '', dir: '', ref: '', fecha: '', recibe: 'yo', oNombre: '', oTel: '', agencia: '' }, pago: '', done: [false, false, false, false], cur: 0, terms: false });
let S = blank(), editLoc = false, loc = getLoc(), busy = false;
try { const r = JSON.parse(sessionStorage.getItem(CK_KEY) || 'null'); if (r) S = Object.assign(blank(), r); } catch (e) {}
const persist = () => { try { sessionStorage.setItem(CK_KEY, JSON.stringify(S)); } catch (e) {} };
const metro = () => loc.dep === 'Lima' || loc.dep === 'Callao';
const setPath = (path, v) => { const k = path.split('.'); let o = S; while (k.length > 1) o = o[k.shift()]; o[k[0]] = v; persist(); };

function shipOf(sub) {
  const m = S.ent.modo;
  if (m === 'recojo') return { fee: 0, label: 'Gratis' };
  if (m === 'delivery') {
    if (sub >= CHECKOUT.FREE_FROM) return { fee: 0, label: 'Gratis' };
    if (CHECKOUT.DELIVERY_FEE_LIMA != null) return { fee: CHECKOUT.DELIVERY_FEE_LIMA, label: money(CHECKOUT.DELIVERY_FEE_LIMA) };
    return { fee: 0, label: 'Por coordinar', tbd: true };
  }
  if (m === 'agencia') return { fee: 0, label: 'Flete aparte (pago en destino)', tbd: true };
  return { fee: 0, label: '—' };
}
function totalsOf(list) {
  const sub = subtotalOf(list), sh = shipOf(sub);
  const fee = S.pago === 'card' ? round2((sub + sh.fee) * CHECKOUT.CARD_FEE_PCT / 100) : 0;
  return { sub, sh, fee, total: round2(sub + sh.fee + fee) };
}

/* ---------- Pedido: fechas ---------- */
function dateOptions(recojo) {
  const out = [], now = new Date(); let d = new Date(now);
  const okToday = recojo && now.getDay() !== 0 && now.getHours() < (now.getDay() === 6 ? 11 : 16);
  if (!okToday) d.setDate(d.getDate() + 1);
  while (out.length < 6) { if (d.getDay() !== 0) out.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); }
  return out;
}
const dateSelect = recojo => { const opts = dateOptions(recojo); if (!opts.includes(S.ent.fecha)) { S.ent.fecha = opts[0]; persist(); } return `<label class="ck-field"><span>${recojo ? 'Fecha de recojo' : 'Fecha de entrega'}</span><select data-f="ent.fecha">${opts.map(o => `<option value="${o}" ${o === S.ent.fecha ? 'selected' : ''}>${fmtDate(o)}</option>`).join('')}</select></label>`; };

/* ---------- Pedido: secciones ---------- */
const field = (path, label, val, attrs = '') => `<label class="ck-field"><span>${label}</span><input data-f="${path}" value="${esc(val)}" ${attrs}></label>`;
const IC_PIN = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>';

function secTipo() {
  return { sum: `<b>Tipo de comprobante</b> ${S.tipo === 'factura' ? 'Factura' : 'Boleta'}`,
    form: `<p>¿Qué tipo de comprobante desea?</p>
    <div class="ck-radios"><label><input type="radio" name="tipo" value="boleta" ${S.tipo === 'boleta' ? 'checked' : ''}> Boleta</label><label><input type="radio" name="tipo" value="factura" ${S.tipo === 'factura' ? 'checked' : ''}> Factura</label></div>
    <button class="ck-btn" data-next="0">Continuar ➜</button>` };
}
function secIdent() {
  const i = S.id, fac = S.tipo === 'factura';
  const docBlock = fac ? `
      ${field('id.doc', 'RUC *', i.doc, 'inputmode="numeric" maxlength="11" id="f-doc" autocomplete="off"')}
      <div class="ck-hint" id="doc-msg">${i.ok ? '✓ Verificado en SUNAT' : 'Ingresa tu RUC de 11 dígitos y completaremos los datos.'}</div>
      ${field('id.razon', 'Razón social *', i.razon, `id="f-razon" ${i.ok ? 'readonly' : ''}`)}
      ${field('id.dirFiscal', 'Dirección fiscal *', i.dirFiscal, `id="f-dir" ${i.ok ? 'readonly' : ''}`)}` : `
      <div class="ck-row2">
        <label class="ck-field"><span>Tipo de documento *</span><select data-f="id.tdoc" id="f-tdoc">${['DNI', 'CE', 'Pasaporte'].map(t => `<option ${t === i.tdoc ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        ${field('id.doc', 'N° de documento *', i.doc, `inputmode="${i.tdoc === 'DNI' ? 'numeric' : 'text'}" maxlength="${i.tdoc === 'DNI' ? 8 : 12}" id="f-doc" autocomplete="off"`)}
      </div>
      <div class="ck-hint" id="doc-msg">${i.ok ? '✓ Verificado en RENIEC' : (i.tdoc === 'DNI' ? 'Ingresa tu DNI de 8 dígitos y completaremos tus nombres.' : '')}</div>
      <div class="ck-row2">${field('id.nombres', 'Nombres *', i.nombres, `id="f-nom" ${i.ok ? 'readonly' : ''}`)}${field('id.apellidos', 'Apellidos *', i.apellidos, `id="f-ape" ${i.ok ? 'readonly' : ''}`)}</div>`;
  return { sum: fac ? `<b>${esc(i.razon)}</b> · RUC ${esc(i.doc)}<br>${esc(i.email)} · ${esc(i.tel)}` : `<b>${esc(i.nombres)} ${esc(i.apellidos)}</b> · ${esc(i.tdoc)} ${esc(i.doc)}<br>${esc(i.email)} · ${esc(i.tel)}`,
    form: `${field('id.email', 'Correo electrónico *', i.email, 'type="email" autocomplete="email"')}
      ${field('id.tel', 'Teléfono / WhatsApp *', i.tel, 'type="tel" inputmode="numeric" maxlength="9" autocomplete="tel"')}
      ${docBlock}
      <div class="ck-err" id="err-1"></div>
      <button class="ck-btn" data-next="1">Continuar ➜</button>` };
}
function secEntrega() {
  const e = S.ent, st = CHECKOUT.STORE;
  const place = [loc.dist, loc.dep].filter(Boolean).join(', ');
  const modes = metro() ? [['delivery', '🚚 Envío / Delivery'], ['recojo', '🏪 Recojo en Tienda']] : [['agencia', '📦 Envío por agencia'], ['recojo', '🏪 Recojo en Tienda']];
  if (loc.dep && !modes.some(m => m[0] === e.modo)) { e.modo = modes[0][0]; persist(); }
  const dists = loc.dep === 'Callao' ? DISTRITOS_CALLAO : DISTRITOS_LIMA;
  const locBox = (!loc.dep || editLoc) ? `
    <div class="ck-locform"><label class="ck-field"><span>Departamento</span><select id="l-dep"><option value="">Elige…</option>${DEPARTAMENTOS.map(d => `<option ${d === loc.dep ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
    ${metro() ? `<label class="ck-field"><span>Distrito</span><select id="l-dist"><option value="">Elige…</option>${dists.map(d => `<option ${d === loc.dist ? 'selected' : ''}>${d}</option>`).join('')}</select></label>` : ''}
    <button class="ck-btn ck-btn-sm" id="l-ok" ${loc.dep ? '' : 'disabled'}>Aplicar</button></div>` : '';
  const who = `<div class="ck-who"><p>¿Quién recibirá el pedido?</p><div class="ck-radios"><label><input type="radio" name="recibe" value="yo" ${e.recibe === 'yo' ? 'checked' : ''}> Yo</label><label><input type="radio" name="recibe" value="otro" ${e.recibe === 'otro' ? 'checked' : ''}> Otra persona</label></div>
    ${e.recibe === 'otro' ? `<div class="ck-row2">${field('ent.oNombre', 'Nombre de quien recibe *', e.oNombre)}${field('ent.oTel', 'Teléfono *', e.oTel, 'type="tel" maxlength="9"')}</div>` : ''}</div>`;
  let panel = '';
  if (loc.dep && !editLoc) {
    if (e.modo === 'delivery') {
      const fs = shipOf(subtotalOf(entries()));
      panel = `${field('ent.dir', 'Dirección *', e.dir, 'autocomplete="street-address" placeholder="Calle, número, urbanización"')}${field('ent.ref', 'Referencia', e.ref, 'placeholder="Frente a…, portón…"')}
        <div class="ck-opt on"><span class="ck-opt-ico">🚚</span><div><b>Delivery programado</b><small>Despacho en 24–48 h hábiles a partir de la fecha elegida.</small></div><em class="${fs.fee === 0 && !fs.tbd ? 'free' : ''}">${fs.label}</em></div>${dateSelect(false)}`;
    } else if (e.modo === 'agencia') {
      panel = `<label class="ck-field"><span>Agencia de preferencia *</span><select data-f="ent.agencia"><option value="">Elige…</option>${CHECKOUT.AGENCIAS.map(a => `<option ${a === e.agencia ? 'selected' : ''}>${esc(a)}</option>`).join('')}</select></label>
        ${field('ent.dir', 'Dirección o sucursal de destino *', e.dir, 'placeholder="Ciudad, dirección o sucursal de la agencia"')}${field('ent.ref', 'Referencia', e.ref)}
        <div class="ck-opt on"><span class="ck-opt-ico">📦</span><div><b>Envío por agencia</b><small>El flete se coordina por WhatsApp y se paga en destino.</small></div><em>Flete aparte</em></div>${dateSelect(false)}`;
    } else {
      panel = `<p class="ck-sub">Retiro disponible en la siguiente tienda:</p>
        <div class="ck-opt on"><span class="ck-opt-ico dark">🏪</span><div><b>${esc(st.name)}</b><small>${esc(st.address)}</small></div><em class="free">¡Gratis!</em></div>${dateSelect(true)}`;
    }
  }
  const note = e.modo === 'recojo' ? `Recojos en nuestra tienda: ${esc(st.hours)}` : e.modo ? 'Te confirmaremos la entrega por WhatsApp una vez validado el pago.' : 'Te mostraremos los métodos de entrega disponibles para ti…';
  return { sum: `<b>${e.modo === 'recojo' ? 'Recojo en tienda' : e.modo === 'agencia' ? 'Envío por agencia' : 'Delivery'}</b> · ${esc(place)}${e.modo !== 'recojo' ? `<br>${esc(e.dir)}` : ''}<br>${fmtDate(e.fecha)}`,
    form: `<div class="ck-loc"><span class="ck-loc-ico">${IC_PIN}</span><div><small>Tu ubicación</small><b>${esc(place) || 'Selecciona tu ubicación'}</b>${loc.dep && !editLoc ? '<button class="ck-edit-s" id="l-change">✎ Cambiar</button>' : ''}</div></div>
      ${locBox}
      ${loc.dep && !editLoc ? `<div class="ck-divider"><span>Métodos de entrega según tu ubicación</span></div>
      <div class="ck-tabs">${modes.map(m => `<button class="${e.modo === m[0] ? 'on' : ''}" data-mode="${m[0]}">${m[1]}</button>`).join('')}</div>${panel}${who}` : ''}
      <div class="ck-err" id="err-2"></div>
      <div class="ck-note">ⓘ ${note}</div>
      <button class="ck-btn" data-next="2" ${loc.dep && !editLoc ? '' : 'disabled'}>Continuar ➜</button>` };
}
function secPago() {
  const opts = [['wallet', 'Billetera digital', 'Yape / QR', ['yape', ...(CHECKOUT.PLIN_NUMBER ? ['plin'] : [])]], ['transfer', 'Transferencia bancaria', 'Banca móvil o web', bankKeys()], ['card', 'Tarjeta de crédito o débito', `+${CHECKOUT.CARD_FEE_PCT}% por pago con tarjeta`, ['visa', 'mastercard', 'amex', 'diners']]];
  return { sum: `<b>${PAGOS[S.pago] || ''}</b>`,
    form: opts.map(o => `<button class="ck-pay ${S.pago === o[0] ? 'on' : ''}" data-pay="${o[0]}"><span><b>${o[1]}</b><small>${o[2]}</small></span><span class="ck-logos">${payLogos(o[3], 'xs')}</span></button>`).join('') };
}

const SECS = [['Facturación', secTipo], ['Identificación', secIdent], ['Datos para la Entrega', secEntrega], ['Elige un método de pago', secPago]];
function renderSections() {
  $('ck-sections').innerHTML = SECS.map(([title, fn], i) => {
    const open = S.cur === i, done = S.done[i], locked = !open && !done;
    const c = (open || done) ? fn() : null;
    return `<section class="ck-card ${open ? 'open' : ''} ${locked ? 'locked' : ''}" data-i="${i}">
      <h3><span class="ck-bar"></span>${title}</h3>
      ${done && !open ? `<button class="ck-edit" data-edit="${i}">✎ Editar</button><div class="ck-summary">${c.sum}</div>` : open ? c.form : ''}
    </section>`;
  }).join('');
  bindDocLookup();
}
function renderSummary() {
  const list = entries(), t = totalsOf(list), all = S.done.every(Boolean);
  $('ck-sum').innerHTML = `<h2>Resumen de la Compra</h2>
    ${list.map(({ p, qty }) => `<div class="ck-mini"><div class="ck-mini-img">${thumb(p, 26)}<span class="added-badge">${qty}</span></div><div><b>${esc(p.name)}</b><small>${esc(p.unit)}</small></div><strong>${money((p.price || 0) * qty)}</strong></div>`).join('')}
    <div class="ck-line"><span>Subtotal</span><b>${money(t.sub)}</b></div>
    ${S.pago === 'card' ? `<div class="ck-line"><span>Recargo por tarjeta (${CHECKOUT.CARD_FEE_PCT}%)</span><b>${money(t.fee)}</b></div>` : ''}
    <div class="ck-line"><span>${S.ent.modo === 'recojo' ? 'Retiro en tienda' : 'Envío'}</span><b class="${t.sh.fee === 0 && !t.sh.tbd && S.ent.modo ? 'free' : ''}">${t.sh.label}</b></div>
    <div class="ck-total"><div><b>Total a Pagar</b><div class="ck-logos">${S.pago === 'card' ? payLogos(['visa', 'mastercard', 'amex', 'diners'], 'xs') : payLogos([...bankKeys(), 'yape'], 'xs')}</div></div><strong>${all ? money(t.total) : '--'}</strong></div>
    ${t.sh.tbd ? '<p class="ck-hint">El costo de envío se coordina por WhatsApp y no está incluido en el total.</p>' : ''}
    <label class="ck-terms"><input type="checkbox" id="ck-terms" ${S.terms ? 'checked' : ''}><span>He leído y estoy de acuerdo con los <b>términos y condiciones</b> de la web.</span></label>
    <button class="ck-btn ck-btn-block" id="ck-submit" ${all && S.terms && !busy ? '' : 'disabled'}>${busy ? 'Procesando…' : 'Realizar el Pedido'}</button>`;
}

/* ---------- Pedido: validaciones y DNI/RUC ---------- */
function validate(i) {
  const e = S.ent, d = S.id, fac = S.tipo === 'factura';
  if (i === 1) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return 'Ingresa un correo válido.';
    if (!/^\d{9}$/.test(d.tel)) return 'Ingresa un teléfono de 9 dígitos.';
    if (fac) { if (!/^(10|15|17|20)\d{9}$/.test(d.doc)) return 'Ingresa un RUC válido de 11 dígitos.'; if (!d.razon.trim() || !d.dirFiscal.trim()) return 'Completa la razón social y la dirección fiscal.'; }
    else { if (d.tdoc === 'DNI' && !/^\d{8}$/.test(d.doc)) return 'El DNI debe tener 8 dígitos.'; if (d.tdoc !== 'DNI' && d.doc.trim().length < 6) return 'Ingresa tu número de documento.'; if (!d.nombres.trim() || !d.apellidos.trim()) return 'Completa tus nombres y apellidos.'; }
  }
  if (i === 2) {
    if (!loc.dep) return 'Selecciona tu ubicación.';
    if (metro() && !loc.dist) return 'Selecciona tu distrito.';
    if (e.modo !== 'recojo' && e.dir.trim().length < 6) return 'Ingresa una dirección completa.';
    if (e.modo === 'agencia' && !e.agencia) return 'Elige la agencia de envío.';
    if (e.recibe === 'otro' && (!e.oNombre.trim() || !/^\d{9}$/.test(e.oTel))) return 'Completa el nombre y teléfono (9 dígitos) de quien recibe.';
  }
  return '';
}
let lookupT;
function bindDocLookup() {
  const el = $('f-doc'); if (!el) return;
  el.addEventListener('input', () => {
    S.id.ok = false; clearTimeout(lookupT);
    const fac = S.tipo === 'factura', need = fac ? 11 : (S.id.tdoc === 'DNI' ? 8 : 0);
    if (need && el.value.length === need) lookupT = setTimeout(() => verifyDoc(fac ? 'ruc' : 'dni', el.value), 200);
  });
}
async function verifyDoc(kind, num) {
  const msg = $('doc-msg'); if (!msg) return;
  msg.className = 'ck-hint'; msg.textContent = 'Verificando…';
  try {
    const r = await apiGet({ action: kind, num });
    if (!r || !r.ok) throw new Error((r && r.error) || 'sin datos');
    if (kind === 'dni') { S.id.nombres = r.nombres || ''; S.id.apellidos = r.apellidos || ''; $('f-nom').value = S.id.nombres; $('f-ape').value = S.id.apellidos; ['f-nom', 'f-ape'].forEach(x => $(x).readOnly = true); }
    else { S.id.razon = r.razon || ''; S.id.dirFiscal = r.direccion || ''; $('f-razon').value = S.id.razon; $('f-dir').value = S.id.dirFiscal; ['f-razon', 'f-dir'].forEach(x => { $(x).readOnly = true; }); }
    S.id.ok = true; persist(); msg.className = 'ck-hint ok'; msg.textContent = kind === 'dni' ? '✓ Verificado en RENIEC' : '✓ Verificado en SUNAT';
  } catch (e) {
    S.id.ok = false; persist(); msg.className = 'ck-hint warn';
    msg.textContent = 'No pudimos verificar el documento automáticamente. Completa tus datos manualmente.';
    ['f-nom', 'f-ape', 'f-razon', 'f-dir'].forEach(x => { if ($(x)) $(x).readOnly = false; });
  }
}

/* ---------- Pedido: eventos ---------- */
const advance = () => { S.cur = S.done.findIndex(d => !d); persist(); renderSections(); renderSummary(); document.querySelector('.ck-card.open')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
function bindPedido() {
  const root = $('ck-main');
  root.addEventListener('input', e => {
    const f = e.target.dataset.f; if (!f) return;
    let v = e.target.value;
    const digits = ['id.tel', 'ent.oTel'].includes(f) || (f === 'id.doc' && (S.tipo === 'factura' || S.id.tdoc === 'DNI'));
    if (digits) { v = v.replace(/\D/g, ''); e.target.value = v; }
    setPath(f, v);
  });
  root.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.f === 'id.tdoc') { S.id.ok = false; S.id.doc = ''; S.id.nombres = S.id.apellidos = ''; persist(); renderSections(); }
    if (t.name === 'tipo') { S.tipo = t.value; S.id.ok = false; S.id.doc = ''; S.id.tdoc = 'DNI'; S.id.nombres = S.id.apellidos = S.id.razon = S.id.dirFiscal = ''; S.done[1] = false; persist(); }
    if (t.name === 'recibe') { S.ent.recibe = t.value; persist(); renderSections(); }
    if (t.id === 'ck-terms') { S.terms = t.checked; persist(); renderSummary(); }
    if (t.id === 'l-dep') { loc.dep = t.value; loc.dist = ''; editLoc = true; renderSections(); }
    if (t.id === 'l-dist') { loc.dist = t.value; }
  });
  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.edit != null) { S.cur = +b.dataset.edit; persist(); renderSections(); }
    if (b.dataset.next != null) {
      const i = +b.dataset.next, err = validate(i);
      if (err) { const box = $('err-' + i); if (box) box.textContent = err; return; }
      S.done[i] = true; advance();
    }
    if (b.dataset.mode) { S.ent.modo = b.dataset.mode; persist(); renderSections(); renderSummary(); }
    if (b.dataset.pay) { S.pago = b.dataset.pay; S.done[3] = true; persist(); renderSections(); renderSummary(); }
    if (b.id === 'l-change') { editLoc = true; renderSections(); }
    if (b.id === 'l-ok') { if (metro() && !loc.dist) { const x = $('err-2'); if (x) x.textContent = 'Selecciona tu distrito.'; return; } editLoc = false; saveLoc(loc); S.ent.modo = ''; S.done[2] = false; renderSections(); renderSummary(); }
    if (b.id === 'ck-submit') submitOrder();
  });
}

/* ---------- Pedido: crear y pagar ---------- */
function buildOrder() {
  const list = entries(), t = totalsOf(list), i = S.id, e = S.ent;
  return {
    action: 'pedido', hp: '',
    items: list.map(({ p, qty }) => ({ id: p.id, code: p.code, name: p.name, brand: p.brand, unit: p.unit, qty, price: p.price })),
    subtotal: t.sub, recargo: t.fee, envio: t.sh.fee, envioTxt: t.sh.label, total: t.total, pagoKey: S.pago, pago: PAGOS[S.pago],
    comprobante: S.tipo === 'factura' ? 'Factura' : 'Boleta',
    cliente: { email: i.email, tel: i.tel, tdoc: S.tipo === 'factura' ? 'RUC' : i.tdoc, doc: i.doc, nombres: i.nombres, apellidos: i.apellidos, razon: i.razon, dirFiscal: i.dirFiscal, nombre: S.tipo === 'factura' ? i.razon : `${i.nombres} ${i.apellidos}`.trim() },
    entrega: { modo: e.modo, dep: loc.dep, dist: loc.dist, dir: e.dir, ref: e.ref, fecha: e.fecha, recibe: e.recibe === 'otro' ? `${e.oNombre} (${e.oTel})` : 'El titular', agencia: e.agencia },
    creado: new Date().toISOString()
  };
}
const orderMsg = o => encodeURIComponent([`Hola ICC Negocios! Realicé el pedido ${o.codigo}.`, `Titular: ${o.cliente.nombre}`, ...o.items.map(i => `• ${i.qty} x ${i.name} (${i.unit})`), `Total: ${money(o.total)} — ${o.pago}`, `Entrega: ${{ recojo: 'Recojo en tienda', delivery: 'Delivery', agencia: 'Agencia' }[o.entrega.modo]} — ${[o.entrega.dist, o.entrega.dep].filter(Boolean).join(', ')}`].join('\n'));
const saveOrder = o => { try { localStorage.setItem(ORDER_KEY, JSON.stringify(o)); } catch (e) {} };

async function submitOrder() {
  if (busy) return; busy = true; renderSummary();
  const order = buildOrder();
  try {
    const r = await apiPost(order);
    if (!r || !r.ok) throw new Error((r && r.error) || 'no_registrado');
    order.codigo = r.codigo; order.registrado = true;
  } catch (e) {
    order.codigo = 'ICC-W' + Date.now().toString().slice(-6); order.registrado = false;   // sin conexión con el sistema: se completa por WhatsApp
  }
  saveOrder(order); busy = false; renderSummary(); payFlow(order);
}

const openModal = html => { const m = $('ck-modal'); m.innerHTML = `<div class="ck-modal-card" role="dialog" aria-modal="true">${html}</div>`; m.classList.add('open'); };
const closeModal = () => $('ck-modal').classList.remove('open');
const spaced = n => String(n).replace(/(\d{3})(?=\d)/g, '$1 ');

function payFlow(o) {
  if (o.pagoKey === 'wallet') {
    openModal(`<h2>Ya casi terminas!</h2><p class="mc">Ahora envía</p><div class="mc amt">${money(o.total)}</div><p class="mc">escaneando el siguiente código QR<br>o yapea al:</p>
      <div class="num-pill">${spaced(CHECKOUT.YAPE_NUMBER)}</div>
      ${CHECKOUT.PLIN_NUMBER ? `<p class="mc small">Plin: <b>${spaced(CHECKOUT.PLIN_NUMBER)}</b></p>` : ''}
      <div class="qr-box"><img src="${esc(CHECKOUT.YAPE_QR)}" alt="Código QR de Yape" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'qr-missing',textContent:'Escanea con Yape o yapea al número de arriba'}))"></div>
      <div class="ck-logos center">${payLogos(['yape', ...(CHECKOUT.PLIN_NUMBER ? ['plin'] : [])], 'xs')}</div>
      <p class="mc small">Realiza una <b>captura de pantalla</b> en el momento del pago y haz clic en “Continuar”.</p>
      <button class="ck-btn ck-btn-block" id="m-next">Continuar</button>`);
    $('m-next').onclick = () => uploadModal(o);
  } else if (o.pagoKey === 'transfer') {
    const accs = (CHECKOUT.BANK_ACCOUNTS || []).filter(a => a.number || a.cci);
    openModal(`<h2>Transferencia bancaria</h2><p class="mc">Transfiere <b class="amt-s">${money(o.total)}</b> a una de nuestras cuentas:</p>
      ${accs.length ? accs.map(a => `<div class="acc"><div class="acc-h">${payLogo(a.bank, 'xs')}<b>${esc(a.name)}</b><small>${esc(a.type || '')}</small></div>
        ${a.number ? `<div class="acc-r"><span>N° de cuenta</span><b>${esc(a.number)}</b><button class="cp" data-copy="${esc(a.number)}">Copiar</button></div>` : ''}
        ${a.cci ? `<div class="acc-r"><span>CCI</span><b>${esc(a.cci)}</b><button class="cp" data-copy="${esc(a.cci)}">Copiar</button></div>` : ''}
        ${a.holder ? `<div class="acc-r"><span>Titular</span><b>${esc(a.holder)}</b></div>` : ''}</div>`).join('') : `<p class="ck-warn">Te enviaremos los datos de la cuenta por WhatsApp.</p><a class="ck-btn ck-btn-block" target="_blank" rel="noopener" href="https://wa.me/${WSP}?text=${orderMsg(o)}">Pedir datos por WhatsApp</a>`}
      <p class="mc small">Guarda la <b>captura o constancia</b> de tu operación y haz clic en “Continuar”.</p>
      <button class="ck-btn ck-btn-block" id="m-next">Continuar</button>`);
    $('ck-modal').querySelectorAll('[data-copy]').forEach(b => b.onclick = () => { navigator.clipboard?.writeText(b.dataset.copy); b.textContent = '¡Copiado!'; });
    $('m-next').onclick = () => uploadModal(o);
  } else {
    openModal(`<h2>Pago con tarjeta</h2><p class="mc">Total a pagar con tarjeta</p><div class="mc amt">${money(o.total)}</div>
      <div class="ck-logos center">${payLogos(['visa', 'mastercard', 'amex', 'diners'], 'xs')}</div>
      <p class="mc small">Un asesor te enviará por WhatsApp el <b>enlace de pago seguro</b> para completar tu compra.</p>
      <a class="ck-btn ck-btn-block" id="m-wa" target="_blank" rel="noopener" href="https://wa.me/${WSP}?text=${orderMsg(o)}">Continuar por WhatsApp</a>`);
    $('m-wa').onclick = () => setTimeout(() => finish(o), 400);
  }
}

function uploadModal(o) {
  openModal(`<h2>Último paso!</h2><div class="drop"><p>Adjunta la captura de pantalla de la operación realizada.<br><b>Peso máximo de la imagen 10 MB.</b></p>
    <input type="file" id="m-file" accept="image/*,application/pdf" hidden>
    <button class="ck-btn ck-btn-ghost" id="m-pick">📎 Cargar Constancia</button><div class="drop-file" id="m-name"></div></div>
    <div class="ck-err" id="m-err"></div>
    <button class="ck-btn ck-btn-block" id="m-send" disabled>Enviar constancia</button>
    <a class="ck-link" id="m-later" href="#">La enviaré después por WhatsApp</a>`);
  const inp = $('m-file'); let file = null;
  $('m-pick').onclick = () => inp.click();
  inp.onchange = () => { file = inp.files[0]; $('m-err').textContent = ''; if (!file) return; if (file.size > 10 * 1024 * 1024) { $('m-err').textContent = 'El archivo supera los 10 MB.'; file = null; return; } $('m-name').textContent = '✔ ' + file.name; $('m-send').disabled = false; };
  $('m-later').onclick = e => { e.preventDefault(); finish(o); };
  $('m-send').onclick = async () => {
    const btn = $('m-send'); btn.disabled = true; btn.textContent = 'Enviando…';
    try {
      if (!o.registrado) throw new Error('offline');
      const data = await fileToData(file);
      const r = await apiPost({ action: 'constancia', codigo: o.codigo, correo: o.cliente.email, filename: file.name, mime: data.mime, data: data.b64 });
      if (!r || !r.ok) throw new Error((r && r.error) || 'fallo');
      o.constancia = true; finish(o);
    } catch (e) {
      $('m-err').innerHTML = o.registrado ? 'No pudimos enviar la constancia. Inténtalo de nuevo o envíala por WhatsApp.' : 'Tu pedido no pudo registrarse en línea. Envíalo por WhatsApp para completarlo.';
      btn.disabled = false; btn.textContent = 'Reintentar';
      if (!o.registrado) $('m-err').insertAdjacentHTML('beforeend', ` <a target="_blank" rel="noopener" href="https://wa.me/${WSP}?text=${orderMsg(o)}">Abrir WhatsApp</a>`);
    }
  };
}
function fileToData(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    if (file.type.startsWith('image/')) {
      fr.onload = () => { const img = new Image(); img.onload = () => { const k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res({ mime: 'image/jpeg', b64: c.toDataURL('image/jpeg', 0.82).split(',')[1] }); }; img.onerror = rej; img.src = fr.result; };
    } else { if (file.size > 6 * 1024 * 1024) return rej(new Error('pdf_grande')); fr.onload = () => res({ mime: file.type, b64: String(fr.result).split(',')[1] }); }
    fr.onerror = rej; fr.readAsDataURL(file);
  });
}
function finish(o) {
  saveOrder(o); try { sessionStorage.removeItem(CK_KEY); } catch (e) {}
  location.href = 'gracias.html?o=' + encodeURIComponent(o.codigo);
}

function renderPedido() {
  stepsHTML(2);
  if (!entries().length || hasQuote(entries())) { location.replace('carrito.html'); return; }
  $('ck-main').innerHTML = `<h1 class="ck-title">🛒 Tu Pedido</h1><div class="ck-cols ck-cols-p"><div id="ck-sections"></div><aside class="ck-panel ck-sum" id="ck-sum"></aside></div>`;
  if (S.done.every(Boolean)) S.cur = -1; else if (S.cur === -1) S.cur = S.done.findIndex(d => !d);
  renderSections(); renderSummary(); bindPedido();
}

/* ---------- Gracias ---------- */
function renderGracias() {
  stepsHTML(3);
  let o = null; try { o = JSON.parse(localStorage.getItem(ORDER_KEY) || 'null'); } catch (e) {}
  const q = new URLSearchParams(location.search).get('o');
  if (!o || (q && o.codigo !== q)) { $('ck-main').innerHTML = `<div class="ck-panel ck-empty"><b>No encontramos este pedido en este dispositivo.</b><p>Si ya compraste, consulta su estado con tu código y correo.</p><a class="ck-btn" href="seguimiento.html">Rastrear mi pedido</a></div>`; return; }
  clearCart();
  const c = o.cliente, en = o.entrega, f = new Date(o.creado);
  const modo = { recojo: 'Recojo en tienda', delivery: 'Delivery', agencia: 'Envío por agencia' }[en.modo];
  const lugar = en.modo === 'recojo' ? `${CHECKOUT.STORE.name}<br><small>${esc(CHECKOUT.STORE.address)}</small>` : `${esc(en.dir)}<br><small>${esc([en.dist, en.dep].filter(Boolean).join(', '))}${en.ref ? ' · ' + esc(en.ref) : ''}</small>`;
  const pend = o.pagoKey !== 'card' && !o.constancia;
  $('ck-main').innerHTML = `<div class="ok-wrap">
    <section class="ok-main"><div class="ok-check">✓</div><p>¡Muchas Gracias!</p><h1>TU PEDIDO HA SIDO RECIBIDO</h1>
      <p class="ok-sub">${o.registrado ? 'Un asesor validará tu pago y te contactará por WhatsApp.' : 'Falta un paso: envía tu pedido por WhatsApp para que lo registremos.'}</p>
      ${(pend || !o.registrado) ? `<a class="ck-btn ok-wa" target="_blank" rel="noopener" href="https://wa.me/${WSP}?text=${orderMsg(o)}">${o.registrado ? 'Enviar constancia por WhatsApp' : 'Enviar pedido por WhatsApp'}</a>` : ''}
      <div class="ok-track"><p>Tu Pedido <span class="ok-code">${esc(o.codigo)}</span>, realizado el día <b>${f.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}</b>, tiene el siguiente estado:</p>
        <div class="ok-steps">${['Pedido Recibido', 'Preparando', 'En proceso de Envío', 'Completado'].map((s, i) => `<div class="${i === 0 ? 'on' : ''}"><i>${['📥', '📦', '🚚', '✔'][i]}</i><b>${s}</b>${i === 0 ? `<small>${f.toLocaleDateString('es-PE')}</small>` : ''}</div>`).join('')}</div>
        <p class="ok-est">🗓 Fecha estimada de ${en.modo === 'recojo' ? 'recojo' : 'entrega'}: <b>${en.fecha ? fmtDate(en.fecha) : '—'}</b></p></div>
      <div class="ok-actions"><a class="ck-btn" href="seguimiento.html">Rastrear mi pedido</a><a class="ck-btn ck-btn-ghost" href="tienda.html">Seguir comprando</a></div>
    </section>
    <aside class="ok-side">
      <div class="ok-blk"><small>DETALLES DEL PEDIDO</small><h2># ${esc(o.codigo)}</h2></div>
      <div class="ok-blk"><h4>👤 TITULAR DEL PEDIDO</h4><b>${esc(c.nombre)}</b><small>${esc(c.tdoc)}: ${esc(c.doc)}<br>+51 ${esc(c.tel)}<br>${esc(c.email)}</small><small>${esc(o.comprobante)}</small></div>
      <div class="ok-blk"><h4>$ MÉTODO DE PAGO</h4><div class="ok-pay">${payLogos(o.pagoKey === 'card' ? ['visa'] : o.pagoKey === 'wallet' ? ['yape'] : bankKeys().slice(0, 1), 'xs')}<span>${esc(o.pago)}<small>${o.pagoKey === 'card' ? 'Enlace de pago por WhatsApp' : o.constancia ? 'Constancia recibida' : 'Constancia pendiente'}</small></span></div></div>
      <div class="ok-blk"><h4>📍 ENVÍO / ENTREGA</h4><b>${modo}</b><small>${lugar}</small><small>${en.fecha ? fmtDate(en.fecha) : ''}</small><small>Recibe: ${esc(en.recibe)}</small></div>
      <div class="ok-blk"><h4>🛍 ITEMS</h4>${o.items.map(i => `<div class="ok-item"><span>${i.qty} × ${esc(i.name)} <small>${esc(i.unit)}</small></span><b>${money((i.price || 0) * i.qty)}</b></div>`).join('')}</div>
      <div class="ok-sums"><div><span>Subtotal</span><b>${money(o.subtotal)}</b></div>${o.recargo ? `<div><span>Recargo tarjeta</span><b>${money(o.recargo)}</b></div>` : ''}<div><span>Envío</span><b>${esc(o.envioTxt)}</b></div></div>
      <div class="ok-total"><span>Total</span><b>${money(o.total)}</b></div>
    </aside></div>`;
}

/* ---------- Inicio ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  await window.productsReady;
  loadCart();
  if (PAGE === 'carrito') {
    renderCart();
    $('ck-main').addEventListener('click', e => {
      const q = e.target.closest('[data-q]'), d = e.target.closest('[data-del]');
      if (q) { changeQty(q.dataset.id, +q.dataset.q); renderCart(); }
      if (d) { removeItem(d.dataset.del); renderCart(); }
    });
  }
  if (PAGE === 'pedido') renderPedido();
  if (PAGE === 'gracias') renderGracias();
});
