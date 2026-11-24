/* ============================================================
   SHEETS.JS — la tienda se alimenta de tu Google Sheets
   Requiere config.js (SHEET_CONFIG) y data.js (PRODUCTS, CATEGORIES, BRANDS).
   Flujo: lee cada pestaña → normaliza → llena PRODUCTS.
   Si Google no responde: usa la última lectura guardada y,
   si tampoco hay, el catálogo estático de data.js.
   Otras páginas pueden esperar los datos con:  await productsReady
   ============================================================ */

const CACHE_KEY = 'icc_sheet_cache_v1';

/* ---------- CSV ---------- */
function parseCSV(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); cur = ''; rows.push(row); row = [];
    } else cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(v => v.trim() !== ''));
}
function rowsToObjects(table) {
  // La fila de encabezados es la que contiene "PRODUCTO" (Google a veces agrega filas vacías o la trata como dato)
  const h = table.findIndex(r => r.some(c => c.trim().toUpperCase() === 'PRODUCTO'));
  if (h < 0) return [];
  const keys = table[h].map(k => k.trim().toUpperCase());
  return table.slice(h + 1).map(r => Object.fromEntries(keys.map((k, i) => [k, String(r[i] ?? '').trim()])));
}
const csvToObjects = text => rowsToObjects(parseCSV(text));

/* ---------- Normalizadores ---------- */
const noAccent = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Acepta "32.00", "370,00", "4.070,00", "S/ 1,090.90"
function parsePrice(v) {
  let s = String(v || '').replace(/[^\d.,]/g, '');
  if (!s) return null;
  const lastDot = s.lastIndexOf('.'), lastCom = s.lastIndexOf(',');
  if (lastDot > -1 && lastCom > -1) {
    s = lastCom > lastDot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (lastCom > -1) {
    s = /,\d{1,2}$/.test(s) ? s.replace(',', '.') : s.replace(/,/g, '');
  }
  const n = parseFloat(s);
  return n > 0 ? Math.round(n * 100) / 100 : null;
}

const LOWER_WORDS = new Set(['de', 'del', 'para', 'y', 'a', 'con', 'en', 'el', 'la']);
function niceName(s) {
  return s.replace(/[<>"]/g, '').replace(/\s+/g, ' ').trim().split(' ').map(w => {
    const lw = w.toLowerCase();
    if (LOWER_WORDS.has(lw)) return lw;
    if (/\d/.test(w) || w.length <= 3 || /^[A-Z]{2,}\/[A-Z]{2,}/.test(w)) return w;
    return w.charAt(0) + w.slice(1).toLowerCase();
  }).join(' ').replace(/^./, c => c.toUpperCase());
}

const UNIT_LITERS = { LITRO: 1, 'MINI GALÓN': 1, GALÓN: 3.785, MINIBALDE: 10, BALDE: 20, LATA: 18, CILINDRO: 200, IBC: 1000, BOLSA: 4 };
const SIZE_RE = /\s*(\d+(?:[.,]\d+)?)\s*(LT|L|GAL|KG|LB)\s*$/i;

function parseSize(name) {
  const m = name.trim().match(SIZE_RE);
  if (!m) return { base: name.trim(), size: null, liters: null };
  const n = parseFloat(m[1].replace(',', '.')), u = m[2].toUpperCase();
  const label = u === 'GAL' ? `${n} gal` : u === 'KG' ? `${n} kg` : u === 'LB' ? `${n} lb` : `${n} L`;
  const liters = u === 'GAL' ? n * 3.785 : (u === 'LT' || u === 'L') ? n : null;
  return { base: name.trim().replace(SIZE_RE, ''), size: label, liters };
}

function parseGrade(name) {
  const w = name.match(/\b(\d{1,2})W-?(\d{2,3})\b/i);
  if (w) return `${w[1]}W-${w[2]}`;
  const aw = name.match(/\bAW\s?(\d{2,3})\b/i); if (aw) return `AW ${aw[1]}`;
  const iso = name.match(/\bISO VG\s?(\d{2,3})\b|\b(?:NUTO H|DTE 2\d[A-Z ]*?|TELLUS S2 [MV]X)\s(\d{2,3})\b/i);
  if (iso) return `ISO ${iso[1] || iso[2]}`;
  return null;
}
function parseAPI(name) {
  const n = name.replace(/ALPHA SP/gi, '');
  const m = n.match(/\b(C[A-K]-?4|SN[ -]PLUS|S[JLMNPQ]|GL-[45])\b/);
  return m ? m[1].replace(/^(C[A-K])4$/, '$1-4').replace('-PLUS', ' PLUS') : null;
}

const CAT_ALIAS = { transmision: 'caja', transmisiones: 'caja', motor: 'aceites', aceite: 'aceites' };
function normCat(c) {
  const k = noAccent(String(c || '').toLowerCase().trim());
  return CAT_ALIAS[k] || k || 'aceites';
}
const normUnit = u => {
  const k = String(u || '').toUpperCase().trim();
  return UNIT_LITERS[k] ? k : (k || 'UNIDAD');
};
const titleUnit = u => u === 'IBC' ? 'IBC' : u.charAt(0) + u.slice(1).toLowerCase();
// "Galón 1 gal" y "Litro 1 L" son redundantes: se muestra solo la unidad
const REDUNDANT = { 'GALÓN': '1 gal', LITRO: '1 L' };

// Acepta rutas locales, URLs de internet y enlaces de Google Drive (los convierte a enlace directo)
function normImg(u) {
  u = String(u || '').trim().replace(/[<>"]/g, '');
  if (!u) return '';
  const d = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=view&)?id=)([\w-]+)/);
  if (d) return `https://lh3.googleusercontent.com/d/${d[1]}`;
  return u.replace(/^http:\/\//i, 'https://');
}
const pick = (r, ...keys) => { for (const k of keys) if (r[k]) return r[k]; return ''; };

const CAT_ICON = { aceites: 'drop', caja: 'drop', industrial: 'gear', grasas: 'bucket', refrigerantes: 'snow', urea: 'flask', aditivos: 'flask' };

/* ---------- Imagen/descripcion por parecido de nombre (Catálogo_Referencia) ---------- */
const STOP = new Set(['ACEITE', 'DE', 'PARA', 'MOTOR', 'LITRO', 'GALON', 'BALDE', 'CILINDRO', 'PRESENTACION', 'Y']);
const tokens = s => new Set(noAccent(s.toUpperCase()).replace(/CK4/g, 'CK-4').split(/[^A-Z0-9\/\-]+/).filter(t => t.length > 1 && !STOP.has(t)));
function bestRef(p, refs) {
  const t = tokens(p.rawName);
  let best = null, score = 0;
  for (const r of refs) {
    if (r.brand !== p.brand || normUnit(r.unit) !== normUnit(p.unitRaw)) continue;
    const rt = r.tok; let hit = 0;
    t.forEach(x => { if (rt.has(x)) hit++; });
    const s = hit / new Set([...t, ...rt]).size;
    if (s > score) { score = s; best = r; }
  }
  return score >= 0.6 ? best : null;
}

/* ---------- Construcción de PRODUCTS ---------- */
function buildProducts(tabsData, refRows) {
  const rules = SHEET_CONFIG.PRICE_RULES || {};
  const refs = (refRows || []).filter(r => r.IMAGEN).map(r => ({
    brand: (r.MARCA || '').toUpperCase(), unit: r.UNIDAD, image: r.IMAGEN, desc: r['DESCRIPCIÓN'], tok: tokens(r.PRODUCTO || '')
  }));
  const seen = new Set(), out = [];

  Object.entries(tabsData).forEach(([tab, rows]) => {
    const rule = rules[tab] || {};
    rows.forEach((r, i) => {
      const rawName = r.PRODUCTO; if (!rawName) return;
      const brand = (r.MARCA || tab).toUpperCase();
      const code = r['CÓDIGO'] || `${tab}-${i + 1}`;
      let id = `${brand}:${code}`; if (seen.has(id)) id += `#${i}`; seen.add(id);

      const unitRaw = normUnit(r['UND MEDIDA']);
      const { base, size, liters } = parseSize(rawName);
      const cat = normCat(r['CATEGORÍA']);
      let price = parsePrice(r.PRECIO);
      if (price === null && r.COSTO !== undefined) {
        const c = parsePrice(r.COSTO);
        price = (c && rule.mult) ? Math.round(c * rule.mult * 100) / 100 : null;
      }
      const grade = parseGrade(rawName), api = parseAPI(rawName);
      const label = size && size !== REDUNDANT[unitRaw] ? `${titleUnit(unitRaw)} ${size}` : titleUnit(unitRaw);
      const ref = r.IMAGEN ? null : bestRef({ rawName, brand, unitRaw }, refs);
      const name = niceName(base);

      out.push({
        id, code, name, brand, cat, icon: CAT_ICON[cat] || 'drop', price,
        unit: label, unitType: titleUnit(unitRaw), size,
        liters: liters || UNIT_LITERS[unitRaw] || 0,
        group: `${brand}|${noAccent(base.toUpperCase()).replace(/\s+/g, ' ')}`,
        grade, api,
        desc: (pick(r, 'DESCRIPCIÓN', 'DESCRIPCION') || (ref && ref.desc) || '').replace(/[<>]/g, '') || `${name}. Presentación ${label.toLowerCase()}.`,
        datasheet: normImg(pick(r, 'FICHA TÉCNICA', 'FICHA TECNICA', 'FICHA')),
        specs: [['Código', code], grade && ['Grado', grade], api && ['Norma', api], ['Marca', niceName(brand)], ['Presentación', label]].filter(Boolean),
        image: normImg(r.IMAGEN || (ref && ref.image)),
        image2: normImg(pick(r, 'IMAGEN 2', 'IMAGEN2', 'IMAGEN TRASERA', 'IMAGEN_TRASERA'))
      });
    });
  });
  // Si una presentación no tiene imagen, usa la de otra del mismo producto
  const byGroup = {};
  out.forEach(p => { (byGroup[p.group] = byGroup[p.group] || []).push(p); });
  Object.values(byGroup).forEach(items => {
    const img = (items.find(i => i.image) || {}).image, img2 = (items.find(i => i.image2) || {}).image2;
    items.forEach(i => { if (!i.image && img) i.image = img; if (!i.image2 && img2) i.image2 = img2; });
  });
  return out;
}

/* ---------- Descarga ---------- */
window.productsErrors = [];
const why = (src, e) => window.productsErrors.push(`${src}: ${e.message || e}`);

// Estrategia 1 (recomendada si la hoja es privada o el navegador bloquea Google): Apps Script
async function fetchViaAppsScript() {
  const url = SHEET_CONFIG.APPS_SCRIPT_URL;
  if (!url) throw new Error('no configurado');
  const res = await fetch(url + (url.includes('?') ? '&' : '?') + 'action=catalogo');
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const json = await res.json();
  if (!json.tabs) throw new Error(json.error || 'respuesta sin pestañas');
  const tabs = {}; let ref = [];
  Object.entries(json.tabs).forEach(([name, table]) => {
    const rows = rowsToObjects(table);
    if (name === SHEET_CONFIG.REFERENCE_TAB) ref = rows; else tabs[name] = rows;
  });
  return { tabs, ref };
}

// Estrategia 2: lectura directa de la hoja compartida "con el enlace"
function sheetURL(tab) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_CONFIG.SHEET_ID}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(tab)}`;
}
async function fetchTab(tab) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 10000);
  try {
    const res = await fetch(sheetURL(tab), { signal: ctl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} en la pestaña ${tab}` + (res.status === 401 || res.status === 403 ? ' (la hoja no está compartida como "Cualquier persona con el enlace")' : ''));
    const text = await res.text();
    if (/^\s*</.test(text)) throw new Error(`Google devolvió una página web en vez de datos (pestaña ${tab}): la hoja no es pública o el nombre de la pestaña no coincide`);
    return csvToObjects(text);
  } catch (e) {
    if (e.name === 'AbortError') throw new Error(`sin respuesta en 10 s (pestaña ${tab})`);
    if (e.name === 'TypeError') throw new Error(`el navegador bloqueó la conexión con Google (pestaña ${tab}). Si abres el archivo con doble clic (file://), súbelo a GitHub Pages o usa un servidor local`);
    throw e;
  } finally { clearTimeout(t); }
}
async function fetchViaSheetLink() {
  const names = [...SHEET_CONFIG.TABS, SHEET_CONFIG.REFERENCE_TAB].filter(Boolean);
  const results = await Promise.allSettled(names.map(fetchTab));
  const tabs = {}; let ref = [];
  results.forEach((r, i) => {
    if (r.status !== 'fulfilled') { why('Hoja', r.reason); return; }
    if (names[i] === SHEET_CONFIG.REFERENCE_TAB) ref = r.value; else tabs[names[i]] = r.value;
  });
  return { tabs, ref };
}

function applyProducts(list) {
  PRODUCTS.length = 0;
  PRODUCTS.push(...list);
  // Categorías nuevas que aparezcan en la hoja y no estén en data.js
  list.forEach(p => {
    if (!CATEGORIES.some(c => c.id === p.cat))
      CATEGORIES.push({ id: p.cat, name: niceName(p.cat), desc: '', icon: CAT_ICON[p.cat] || 'drop' });
  });
  // Marcas nuevas sin ficha en BRANDS
  list.forEach(p => {
    if (!BRANDS.some(b => b.id === p.brand))
      BRANDS.push({ id: p.brand, name: niceName(p.brand), tag: '', color: '#0b3b6f', color2: '#159de0', file: '' });
  });
}

// Catálogo estático de data.js (respaldo): se completan los campos que usa la tienda nueva
PRODUCTS.forEach(p => {
  const unit = (p.unit || '').toUpperCase();
  p.code = p.code || p.id; p.image2 = p.image2 || ''; p.group = p.group || p.id;
  p.unitType = p.unitType || titleUnit(unit.split(' ')[0] || 'UNIDAD');
  p.liters = p.liters ?? (UNIT_LITERS[unit] || 0);
  const g = (p.specs || []).find(([k]) => /grado/i.test(k));
  p.grade = p.grade ?? (g ? g[1] : null); p.api = p.api ?? null;
});

window.productsSource = 'static';   // 'sheet' | 'cache' | 'static'
window.productsReady = (async () => {
  const ttl = (SHEET_CONFIG.CACHE_MINUTES || 10) * 60000;
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (e) {}

  if (cached && Date.now() - cached.t < ttl) {
    applyProducts(cached.list); window.productsSource = 'cache'; return;
  }
  try {
    let data = null;
    for (const [label, fn] of [['Apps Script', fetchViaAppsScript], ['Hoja', fetchViaSheetLink]]) {
      if (data) break;
      try {
        const d = await fn();
        if (Object.values(d.tabs).some(r => r.length)) data = d;
        else if (label !== 'Apps Script' || SHEET_CONFIG.APPS_SCRIPT_URL) why(label, 'no devolvió filas con la columna PRODUCTO');
      } catch (e) { if (e.message !== 'no configurado') why(label, e); }
    }
    if (!data) throw new Error(window.productsErrors[0] || 'sin datos');
    const list = buildProducts(data.tabs, data.ref);
    if (!list.length) throw new Error('La hoja no devolvió productos');
    applyProducts(list); window.productsSource = 'sheet';
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), list })); } catch (e) {}
  } catch (err) {
    console.warn('[sheets.js] No se pudo leer Google Sheets:', err.message);
    if (cached) { applyProducts(cached.list); window.productsSource = 'cache'; }
    // si no hay caché, PRODUCTS conserva el catálogo estático de data.js
  }
})();
