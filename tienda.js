/* ============================================================
   TIENDA.JS — lógica exclusiva de tienda.html
   (filtros de categoría/marca/envase/grado, grilla de productos)
   Requiere data.js, cart.js cargados antes que este archivo.
   ============================================================ */

function getSpec(p, key) {
  const hit = p.specs.find(([k]) => k.toLowerCase() === key.toLowerCase());
  return hit ? hit[1] : null;
}
function getGrado(p) { return getSpec(p, 'Grado'); }
function countBy(matchFn) { return PRODUCTS.filter(matchFn).length; }

const ENVASES = [...new Set(PRODUCTS.map(p => p.unit))].sort((a, b) => a.localeCompare(b, 'es'));
const GRADOS = [...new Set(PRODUCTS.map(getGrado).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
const BRANDS_WITH_PRODUCTS = BRANDS.filter(b => PRODUCTS.some(p => p.brand === b.id));
const SHOW_LIMIT = 6;

let currentFilter = { cat: 'all', brands: new Set(), envases: new Set(), grados: new Set() };

/* ----- Categorías (selección única) ----- */
function renderCatFilterList() {
  const catFilterList = document.getElementById('cat-filter-list');
  const rows = [{ id: 'all', name: 'Todos', count: PRODUCTS.length }, ...CATEGORIES.map(c => ({
    id: c.id, name: c.name, count: countBy(p => p.cat === c.id)
  }))].filter(r => r.id === 'all' || r.count > 0);

  catFilterList.innerHTML = rows.map(r => `
    <div class="filter-cat-item ${currentFilter.cat === r.id ? 'active' : ''}" data-cat="${r.id}">
      <span>${r.name}</span>
      <span class="filter-cat-count">${r.count}</span>
    </div>
  `).join('');
}

/* ----- Listas de checkboxes genéricas (marca / envase / grado) ----- */
function renderCheckList(containerId, showMoreBtnId, items, selectedSet, onToggle) {
  const container = document.getElementById(containerId);
  const btn = document.getElementById(showMoreBtnId);
  container.innerHTML = items.map((item, i) => `
    <div class="filter-check-item ${i >= SHOW_LIMIT ? 'hidden-extra' : ''}" data-idx="${i}">
      <input type="checkbox" id="${containerId}-${i}" ${selectedSet.has(item.id) ? 'checked' : ''}>
      <label for="${containerId}-${i}">${item.name}</label>
      <span class="fc-count">${item.count}</span>
    </div>
  `).join('');

  container.querySelectorAll('.filter-check-item').forEach((row, i) => {
    const cb = row.querySelector('input');
    const toggle = () => {
      const id = items[i].id;
      if (selectedSet.has(id)) selectedSet.delete(id); else selectedSet.add(id);
      onToggle();
    };
    cb.addEventListener('change', toggle);
    row.querySelector('label').addEventListener('click', e => { e.preventDefault(); cb.checked = !cb.checked; toggle(); });
  });

  if (!btn) return;
  if (items.length <= SHOW_LIMIT) {
    btn.style.display = 'none';
    return;
  }
  btn.style.display = 'inline-block';
  btn.textContent = '+ Mostrar más';
  btn.onclick = () => {
    const isExpanded = btn.dataset.expanded === '1';
    if (!isExpanded) {
      container.querySelectorAll('.hidden-extra').forEach(el => el.classList.remove('hidden-extra'));
      btn.textContent = '− Mostrar menos';
      btn.dataset.expanded = '1';
    } else {
      container.querySelectorAll('.filter-check-item').forEach((row, i) => {
        if (i >= SHOW_LIMIT) row.classList.add('hidden-extra');
      });
      btn.textContent = '+ Mostrar más';
      btn.dataset.expanded = '0';
    }
  };
}

function renderBrandFilterList() {
  const items = BRANDS_WITH_PRODUCTS.map(b => ({ id: b.id, name: b.name, count: countBy(p => p.brand === b.id) }));
  renderCheckList('brand-filter-list', 'brand-show-more', items, currentFilter.brands, () => { renderProducts(); syncAllFilterUI(); });
}
function renderEnvaseFilterList() {
  const items = ENVASES.map(u => ({ id: u, name: u, count: countBy(p => p.unit === u) }));
  renderCheckList('envase-filter-list', 'envase-show-more', items, currentFilter.envases, () => { renderProducts(); syncAllFilterUI(); });
}
function renderGradoFilterList() {
  const items = GRADOS.map(g => ({ id: g, name: g, count: countBy(p => getGrado(p) === g) }));
  renderCheckList('grado-filter-list', 'grado-show-more', items, currentFilter.grados, () => { renderProducts(); syncAllFilterUI(); });
  const block = document.getElementById('grado-filter-block');
  if (block) block.style.display = items.length ? '' : 'none';
}

function syncAllFilterUI() {
  renderCatFilterList();
  renderActiveFilterChips();
  updateMobileFilterCount();
  document.querySelectorAll('.brand-chip').forEach(c => c.classList.toggle('active', currentFilter.brands.has(c.dataset.brand)));
}

/* ----- Chips de filtros activos ----- */
function renderActiveFilterChips() {
  const activeFiltersEl = document.getElementById('active-filters');
  const chips = [];
  if (currentFilter.cat !== 'all') {
    const c = CATEGORIES.find(c => c.id === currentFilter.cat);
    if (c) chips.push({ label: c.name, onRemove: () => setFilter({ cat: 'all' }) });
  }
  currentFilter.brands.forEach(id => {
    const b = BRANDS.find(b => b.id === id);
    chips.push({ label: b ? b.name : id, onRemove: () => { currentFilter.brands.delete(id); renderProducts(); renderBrandFilterList(); syncAllFilterUI(); } });
  });
  currentFilter.envases.forEach(id => {
    chips.push({ label: id, onRemove: () => { currentFilter.envases.delete(id); renderProducts(); renderEnvaseFilterList(); syncAllFilterUI(); } });
  });
  currentFilter.grados.forEach(id => {
    chips.push({ label: id, onRemove: () => { currentFilter.grados.delete(id); renderProducts(); renderGradoFilterList(); syncAllFilterUI(); } });
  });

  activeFiltersEl.innerHTML = chips.map((c, i) => `
    <span class="active-filter-chip" data-i="${i}">${c.label}<button aria-label="Quitar filtro">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button></span>
  `).join('');
  activeFiltersEl.querySelectorAll('.active-filter-chip button').forEach((btn, i) => {
    btn.addEventListener('click', () => chips[i].onRemove());
  });
}

function activeFilterCount() {
  return (currentFilter.cat !== 'all' ? 1 : 0) + currentFilter.brands.size + currentFilter.envases.size + currentFilter.grados.size;
}
function updateMobileFilterCount() {
  const n = activeFilterCount();
  const pill = document.getElementById('mobile-filter-count');
  if (!pill) return;
  pill.style.display = n > 0 ? 'flex' : 'none';
  pill.textContent = n;
}

function setFilter(partial) {
  currentFilter = { ...currentFilter, ...partial };
  renderProducts();
  syncAllFilterUI();
}

// Funciones expuestas para common.js / chat.js (enlaces de categoría y marca)
function applyCatFilter(catId) { setFilter({ cat: catId }); }
function applyBrandFilter(brandId) {
  currentFilter.brands = new Set([brandId]);
  renderBrandFilterList();
  renderProducts();
  syncAllFilterUI();
}

/* ----- Grilla de productos ----- */
function renderProducts() {
  const prodGrid = document.getElementById('prod-grid');
  let list = PRODUCTS;
  if (currentFilter.cat !== 'all') list = list.filter(p => p.cat === currentFilter.cat);
  if (currentFilter.brands.size) list = list.filter(p => currentFilter.brands.has(p.brand));
  if (currentFilter.envases.size) list = list.filter(p => currentFilter.envases.has(p.unit));
  if (currentFilter.grados.size) list = list.filter(p => {
    const g = getGrado(p);
    return g && currentFilter.grados.has(g);
  });

  if (list.length === 0) {
    prodGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px 20px; color:var(--texto-suave);">
      No encontramos productos con esta combinación de filtros. Prueba con otra categoría o marca, o <a href="cotizar.html" style="color:var(--azul); font-weight:700;">cotiza directamente</a>.
    </div>`;
    return;
  }

  prodGrid.innerHTML = list.map(p => `
    <div class="card" onclick="openProductModal('${p.id}')">
      <div class="card-media">
        ${p.tag === 'oferta' ? '<span class="badge oferta">OFERTA</span>' : (p.tag === 'nuevo' ? '<span class="badge nuevo">NUEVO</span>' : '')}
        <div class="prod-image-slot" ${p.image ? `style="background-image:url('${p.image}')"` : ''}>
          ${p.image ? '' : svgIcon(p.icon, 60)}
        </div>
        <div class="view-hint"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Ver ficha técnica</div>
      </div>
      <div class="card-body">
        <div class="card-brand">${p.brand}</div>
        <div class="card-title">${p.name}</div>
        <div class="card-meta">${p.unit}</div>
        <div class="card-price">
          ${p.price !== null ? `
            <span class="price-now mono">S/ ${p.price.toFixed(2)}</span>
            ${p.old ? `<span class="price-old mono">S/ ${p.old.toFixed(2)}</span>` : ''}
          ` : `<span class="price-now mono" style="font-size:14.5px;">Cotizar precio</span>`}
        </div>
        <div class="card-actions">
          <button class="add-btn" onclick="event.stopPropagation(); addToCart('${p.id}')">🛒 Agregar</button>
          <a class="quote-btn" title="Cotizar por WhatsApp" target="_blank" onclick="event.stopPropagation()"
             href="https://wa.me/51933795267?text=${encodeURIComponent('Hola, quisiera cotizar: ' + p.name + ' (' + p.brand + ')')}">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.85.5 3.58 1.36 5.07L2 22l5.2-1.44a9.87 9.87 0 0 0 4.84 1.24h.01c5.46 0 9.9-4.45 9.9-9.9 0-2.65-1.03-5.13-2.9-7C17.17 3.02 14.7 2 12.04 2z"/></svg>
          </a>
        </div>
      </div>
    </div>
  `).join('');
}

/* ----- Drawer de filtros en móvil ----- */
function initFiltersDrawer() {
  const filtersSidebar = document.getElementById('filters-sidebar');
  const filtersOverlay = document.getElementById('filters-overlay');
  function openFiltersDrawer() { filtersSidebar.classList.add('open'); filtersOverlay.classList.add('open'); }
  function closeFiltersDrawer() { filtersSidebar.classList.remove('open'); filtersOverlay.classList.remove('open'); }
  document.getElementById('mobile-filter-toggle')?.addEventListener('click', openFiltersDrawer);
  document.getElementById('filters-sidebar-close')?.addEventListener('click', closeFiltersDrawer);
  filtersOverlay?.addEventListener('click', closeFiltersDrawer);
}

/* ----- Inicialización ----- */
document.addEventListener('DOMContentLoaded', () => {
  // Leer filtros iniciales desde la URL: tienda.html?cat=aceites o ?brand=MOBIL
  const params = new URLSearchParams(window.location.search);
  const initialCat = params.get('cat');
  const initialBrand = params.get('brand');
  if (initialCat) currentFilter.cat = initialCat;
  if (initialBrand) currentFilter.brands.add(initialBrand);

  renderActivePromos();
  renderCatFilterList();
  renderBrandFilterList();
  renderEnvaseFilterList();
  renderGradoFilterList();
  renderProducts();
  renderActiveFilterChips();
  updateMobileFilterCount();
  initFiltersDrawer();

  document.getElementById('clear-filters-btn')?.addEventListener('click', () => {
    currentFilter = { cat: 'all', brands: new Set(), envases: new Set(), grados: new Set() };
    renderProducts();
    renderCatFilterList();
    renderBrandFilterList();
    renderEnvaseFilterList();
    renderGradoFilterList();
    syncAllFilterUI();
  });

  document.getElementById('cat-filter-list')?.addEventListener('click', e => {
    const item = e.target.closest('.filter-cat-item');
    if (item) setFilter({ cat: item.dataset.cat });
  });
});
