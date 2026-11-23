/* ============================================================
   TIENDA.JS — catálogo con filtros, búsqueda, orden y paginación
   Estilo Lubrimas: cada producto agrupa sus presentaciones
   (litro, galón, balde, cilindro) y se elige con un clic.
   Requiere: config.js, data.js, sheets.js, cart.js, common.js
   ============================================================ */

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => 'S/ ' + n.toFixed(2);
const SHOW_LIMIT = 6;

const emptyFilter = () => ({ q: '', cat: 'all', brands: new Set(), envases: new Set(), grados: new Set(), apis: new Set(), min: null, max: null });
let F = emptyFilter();
let view = { sort: 'rel', per: 24, page: 1 };
const chosen = {};            // grupo → id de la presentación elegida

/* ---------- Filtrado ---------- */
function matches(p, skip) {
  const q = F.q.trim().toLowerCase();
  if (skip !== 'cat' && F.cat !== 'all' && p.cat !== F.cat) return false;
  if (skip !== 'brands' && F.brands.size && !F.brands.has(p.brand)) return false;
  if (skip !== 'envases' && F.envases.size && !F.envases.has(p.unitType)) return false;
  if (skip !== 'grados' && F.grados.size && !F.grados.has(p.grade)) return false;
  if (skip !== 'apis' && F.apis.size && !F.apis.has(p.api)) return false;
  if (F.min != null || F.max != null) {
    if (p.price == null) return false;
    if (F.min != null && p.price < F.min) return false;
    if (F.max != null && p.price > F.max) return false;
  }
  if (q) {
    // "15w40" debe encontrar "15W-40": se ignoran guiones y puntos al comparar
    const flat = t => t.toLowerCase().replace(/[-.]/g, '');
    const hay = flat(`${p.name} ${p.brand} ${p.code} ${p.unit} ${p.grade || ''} ${p.api || ''}`);
    if (!q.split(/\s+/).every(w => hay.includes(flat(w)))) return false;
  }
  return true;
}
const countWith = (skip, fn) => PRODUCTS.filter(p => matches(p, skip) && fn(p)).length;

function buildGroups(list) {
  const map = new Map();
  list.forEach(p => { if (!map.has(p.group)) map.set(p.group, []); map.get(p.group).push(p); });
  const groups = [...map.entries()].map(([key, items]) => {
    items.sort((a, b) => a.liters - b.liters);
    return { key, items, min: Math.min(...items.map(i => i.price ?? Infinity)) };
  });
  const byName = (a, b) => a.items[0].name.localeCompare(b.items[0].name, 'es', { numeric: true });
  if (view.sort === 'name') groups.sort(byName);
  if (view.sort === 'price-asc') groups.sort((a, b) => (a.min === b.min ? byName(a, b) : a.min - b.min));
  if (view.sort === 'price-desc') groups.sort((a, b) => (a.min === Infinity ? 1 : b.min === Infinity ? -1 : b.min - a.min));
  return groups;
}

/* ---------- Filtros laterales ---------- */
function renderCatFilterList() {
  const rows = [{ id: 'all', name: 'Todos', count: countWith('cat', () => true) },
    ...CATEGORIES.map(c => ({ id: c.id, name: c.name, count: countWith('cat', p => p.cat === c.id) }))]
    .filter(r => r.id === 'all' || r.count > 0 || F.cat === r.id);
  $('cat-filter-list').innerHTML = rows.map(r => `
    <div class="filter-cat-item ${F.cat === r.id ? 'active' : ''}" data-cat="${r.id}">
      <span>${esc(r.name)}</span><span class="filter-cat-count">${r.count}</span>
    </div>`).join('');
}

function renderCheckList(containerId, btnId, blockId, items, set, key) {
  const box = $(containerId), btn = $(btnId), block = $(blockId);
  items = items.filter(i => i.count > 0 || set.has(i.id));
  if (block) block.style.display = items.length ? '' : 'none';
  const open = btn && btn.dataset.expanded === '1';
  box.innerHTML = items.map((it, i) => `
    <label class="filter-check-item ${i >= SHOW_LIMIT && !open ? 'hidden-extra' : ''}">
      <input type="checkbox" data-key="${key}" value="${esc(it.id)}" ${set.has(it.id) ? 'checked' : ''}>
      <span class="fc-name">${esc(it.name)}</span><span class="fc-count">${it.count}</span>
    </label>`).join('');
  if (!btn) return;
  btn.style.display = items.length > SHOW_LIMIT ? 'inline-block' : 'none';
  btn.textContent = open ? '− Mostrar menos' : '+ Mostrar más';
  btn.onclick = () => { btn.dataset.expanded = open ? '0' : '1'; renderSidebar(); };
}

const uniq = fn => [...new Set(PRODUCTS.map(fn).filter(Boolean))];
function renderSidebar() {
  renderCatFilterList();
  const brands = BRANDS.filter(b => PRODUCTS.some(p => p.brand === b.id))
    .map(b => ({ id: b.id, name: b.name, count: countWith('brands', p => p.brand === b.id) }));
  renderCheckList('brand-filter-list', 'brand-show-more', 'brand-filter-block', brands, F.brands, 'brands');
  const envases = uniq(p => p.unitType).sort((a, b) => a.localeCompare(b, 'es'))
    .map(u => ({ id: u, name: u, count: countWith('envases', p => p.unitType === u) }));
  renderCheckList('envase-filter-list', 'envase-show-more', 'envase-filter-block', envases, F.envases, 'envases');
  const grados = uniq(p => p.grade).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))
    .map(g => ({ id: g, name: g, count: countWith('grados', p => p.grade === g) }));
  renderCheckList('grado-filter-list', 'grado-show-more', 'grado-filter-block', grados, F.grados, 'grados');
  const apis = uniq(p => p.api).sort()
    .map(a => ({ id: a, name: a, count: countWith('apis', p => p.api === a) }));
  renderCheckList('api-filter-list', 'api-show-more', 'api-filter-block', apis, F.apis, 'apis');
}

function activeChips() {
  const chips = [];
  if (F.q) chips.push([`“${F.q}”`, () => { F.q = ''; $('search-input').value = ''; }]);
  if (F.cat !== 'all') { const c = CATEGORIES.find(c => c.id === F.cat); chips.push([c ? c.name : F.cat, () => F.cat = 'all']); }
  F.brands.forEach(id => chips.push([(BRANDS.find(b => b.id === id) || { name: id }).name, () => F.brands.delete(id)]));
  F.envases.forEach(id => chips.push([id, () => F.envases.delete(id)]));
  F.grados.forEach(id => chips.push([id, () => F.grados.delete(id)]));
  F.apis.forEach(id => chips.push([id, () => F.apis.delete(id)]));
  if (F.min != null || F.max != null) chips.push([`S/ ${F.min ?? 0} – ${F.max ?? '∞'}`, () => { F.min = F.max = null; $('price-min').value = $('price-max').value = ''; }]);
  return chips;
}
function renderActiveFilterChips() {
  const chips = activeChips();
  const box = $('active-filters');
  box.innerHTML = chips.map((c, i) => `<span class="active-filter-chip">${esc(c[0])}<button data-i="${i}" aria-label="Quitar filtro">×</button></span>`).join('');
  box.querySelectorAll('button').forEach(b => b.onclick = () => { chips[b.dataset.i][1](); refresh(); });
  const pill = $('mobile-filter-count');
  if (pill) { pill.style.display = chips.length ? 'flex' : 'none'; pill.textContent = chips.length; }
  document.querySelectorAll('.brand-chip').forEach(c => c.classList.toggle('active', F.brands.has(c.dataset.brand)));
}

/* ---------- Grilla ---------- */
function cardHTML(g) {
  const p = g.items.find(i => i.id === chosen[g.key]) || g.items.find(i => i.price != null) || g.items[0];
  chosen[g.key] = p.id;
  const chips = g.items.length > 1
    ? `<div class="var-chips" role="group" aria-label="Presentación">${g.items.map(v =>
        `<button class="var-chip ${v.id === p.id ? 'on' : ''}" data-g="${esc(g.key)}" data-v="${esc(v.id)}">${esc(v.unit)}</button>`).join('')}</div>`
    : `<div class="card-meta">${esc(p.unit)}</div>`;
  const wsp = `https://wa.me/51933795267?text=${encodeURIComponent(`Hola, quisiera cotizar: ${p.name} (${p.unit}) — ${p.brand}`)}`;
  return `
  <article class="card" data-open="${esc(p.id)}">
    <div class="card-media">
      <div class="prod-image-slot">${svgIcon(p.icon, 60)}${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.remove()">` : ''}</div>
      <div class="view-hint">Ver ficha técnica</div>
    </div>
    <div class="card-body">
      <div class="card-brand">${esc((BRANDS.find(b => b.id === p.brand) || { name: p.brand }).name)}</div>
      <h3 class="card-title">${esc(p.name)}</h3>
      ${chips}
      <div class="card-price">${p.price != null ? `<span class="price-now mono">${money(p.price)}</span>` : `<span class="price-now mono price-quote">Cotizar precio</span>`}</div>
      <div class="card-actions">
        <button class="add-btn" data-add="${esc(p.id)}">🛒 Agregar</button>
        <a class="quote-btn" title="Cotizar por WhatsApp" target="_blank" rel="noopener" href="${wsp}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.85.5 3.58 1.36 5.07L2 22l5.2-1.44a9.87 9.87 0 0 0 4.84 1.24h.01c5.46 0 9.9-4.45 9.9-9.9 0-2.65-1.03-5.13-2.9-7C17.17 3.02 14.7 2 12.04 2z"/></svg>
        </a>
      </div>
    </div>
  </article>`;
}

function renderProducts() {
  const list = PRODUCTS.filter(p => matches(p));
  const groups = buildGroups(list);
  const per = view.per === 0 ? Math.max(groups.length, 1) : view.per;
  const pages = Math.max(1, Math.ceil(groups.length / per));
  view.page = Math.min(view.page, pages);
  const slice = groups.slice((view.page - 1) * per, view.page * per);

  $('result-count').textContent = groups.length
    ? `${groups.length} producto${groups.length === 1 ? '' : 's'} · ${list.length} presentaciones`
    : 'Sin resultados';

  $('prod-grid').innerHTML = slice.length ? slice.map(cardHTML).join('') : `
    <div class="empty-state">
      <b>No encontramos productos con estos filtros.</b>
      <p>Quita algún filtro o <a href="cotizar.html">pide tu cotización</a>: si no lo ves aquí, probablemente lo tenemos.</p>
      <button class="btn btn-ghost btn-sm" id="empty-clear">Limpiar filtros</button>
    </div>`;
  renderPagination(pages);
}

function renderPagination(pages) {
  const box = $('pagination');
  if (pages <= 1) { box.innerHTML = ''; return; }
  const nums = [...new Set([1, pages, view.page - 1, view.page, view.page + 1])].filter(n => n >= 1 && n <= pages).sort((a, b) => a - b);
  let html = view.page > 1 ? `<button data-page="${view.page - 1}" aria-label="Anterior">‹</button>` : '';
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) html += '<span class="pg-gap">…</span>';
    html += `<button data-page="${n}" class="${n === view.page ? 'on' : ''}" ${n === view.page ? 'aria-current="page"' : ''}>${n}</button>`;
  });
  if (view.page < pages) html += `<button data-page="${view.page + 1}" aria-label="Siguiente">›</button>`;
  box.innerHTML = html;
}

/* ---------- URL compartible (?cat=aceites&brand=MOBIL&q=15w40) ---------- */
function syncURL() {
  const u = new URLSearchParams();
  if (F.q) u.set('q', F.q);
  if (F.cat !== 'all') u.set('cat', F.cat);
  if (F.brands.size) u.set('brand', [...F.brands].join(','));
  if (view.sort !== 'rel') u.set('sort', view.sort);
  if (view.per !== 24) u.set('per', view.per);
  if (view.page > 1) u.set('page', view.page);
  const qs = u.toString();
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}

function refresh(keepPage) {
  if (!keepPage) view.page = 1;
  renderSidebar(); renderActiveFilterChips(); renderProducts(); syncURL();
}

/* Expuestas para common.js / chat.js */
function applyCatFilter(id) { F.cat = id; refresh(); }
function applyBrandFilter(id) { F.brands = new Set([id]); refresh(); }

function clearAll() {
  F = emptyFilter(); view.page = 1;
  ['search-input', 'price-min', 'price-max'].forEach(id => { $(id).value = ''; });
  refresh();
}

/* ---------- Eventos ---------- */
function bindEvents() {
  $('cat-filter-list').addEventListener('click', e => {
    const it = e.target.closest('.filter-cat-item'); if (it) applyCatFilter(it.dataset.cat);
  });
  $('filters-sidebar').addEventListener('change', e => {
    const cb = e.target.closest('input[data-key]'); if (!cb) return;
    const set = F[cb.dataset.key];
    if (cb.checked) set.add(cb.value); else set.delete(cb.value);
    refresh();
  });
  let t;
  $('search-input').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { F.q = e.target.value; refresh(); }, 220); });
  $('sort-select').addEventListener('change', e => { view.sort = e.target.value; refresh(); });
  $('per-select').addEventListener('change', e => { view.per = +e.target.value; refresh(); });

  const applyPrice = () => {
    const mn = parseFloat($('price-min').value), mx = parseFloat($('price-max').value);
    F.min = isNaN(mn) ? null : mn; F.max = isNaN(mx) ? null : mx; refresh();
  };
  $('price-apply').addEventListener('click', applyPrice);
  ['price-min', 'price-max'].forEach(id => $(id).addEventListener('keydown', e => { if (e.key === 'Enter') applyPrice(); }));

  $('prod-grid').addEventListener('click', e => {
    const chip = e.target.closest('.var-chip');
    if (chip) { chosen[chip.dataset.g] = chip.dataset.v; renderProducts(); return; }
    const add = e.target.closest('[data-add]');
    if (add) { addToCart(add.dataset.add); return; }
    if (e.target.closest('.quote-btn')) return;
    if (e.target.closest('#empty-clear')) { clearAll(); return; }
    const card = e.target.closest('.card[data-open]');
    if (card) openProductModal(card.dataset.open);
  });
  $('pagination').addEventListener('click', e => {
    const b = e.target.closest('[data-page]'); if (!b) return;
    view.page = +b.dataset.page; renderProducts(); syncURL();
    $('tienda-top').scrollIntoView({ behavior: 'smooth' });
  });
  $('clear-filters-btn')?.addEventListener('click', clearAll);

  const side = $('filters-sidebar'), ov = $('filters-overlay');
  const toggle = on => { side.classList.toggle('open', on); ov.classList.toggle('open', on); };
  $('mobile-filter-toggle')?.addEventListener('click', () => toggle(true));
  $('filters-sidebar-close')?.addEventListener('click', () => toggle(false));
  ov?.addEventListener('click', () => toggle(false));
}

/* ---------- Inicio: esperar a Google Sheets ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  $('prod-grid').innerHTML = Array.from({ length: 8 }, () =>
    '<div class="card skeleton"><div class="card-media"></div><div class="card-body"><i></i><i></i><i></i></div></div>').join('');
  bindEvents();
  await window.productsReady;
  if (typeof updateCartUI === 'function') updateCartUI();   // el carrito ya conoce los productos reales

  const params = new URLSearchParams(location.search);
  F.q = params.get('q') || '';
  F.cat = params.get('cat') || 'all';
  (params.get('brand') || '').split(',').filter(Boolean).forEach(b => F.brands.add(b.toUpperCase()));
  view.sort = params.get('sort') || 'rel';
  view.per = params.has('per') ? +params.get('per') : 24;
  view.page = +params.get('page') || 1;
  $('search-input').value = F.q; $('sort-select').value = view.sort; $('per-select').value = String(view.per);

  const note = $('data-notice');
  if (note && window.productsSource === 'static') {
    note.hidden = false;
    note.textContent = 'No pudimos actualizar los precios en este momento. Los productos mostrados pueden no estar al día: confirma por WhatsApp.';
    const why = (window.productsErrors || [])[0];
    if (why) { const s = document.createElement('small'); s.style.cssText = 'display:block;margin-top:6px;opacity:.8'; s.textContent = 'Detalle técnico: ' + why; note.appendChild(s); }
    console.warn('[tienda] Motivos del fallo al leer Google Sheets:', window.productsErrors);
  }
  refresh(true);
});
