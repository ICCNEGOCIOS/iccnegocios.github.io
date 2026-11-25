/* ============================================================
   SHARED.JS — utilidades comunes de ficha de producto y compra
   (logos de pago, ubicaciones, llamadas a tu Apps Script)
   Requiere config.js antes que este archivo.
   ============================================================ */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => 'S/ ' + Number(n).toFixed(2);
const WSP = '51933795267';
const LOC_KEY = 'icc_location_v1';

const DEPARTAMENTOS = ['Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca', 'Callao', 'Cusco', 'Huancavelica', 'Huánuco', 'Ica', 'Junín', 'La Libertad', 'Lambayeque', 'Lima', 'Loreto', 'Madre de Dios', 'Moquegua', 'Pasco', 'Piura', 'Puno', 'San Martín', 'Tacna', 'Tumbes', 'Ucayali'];
const DISTRITOS_LIMA = 'Ancón,Ate,Barranco,Breña,Carabayllo,Chaclacayo,Chorrillos,Cieneguilla,Comas,El Agustino,Independencia,Jesús María,La Molina,La Victoria,Lima (Cercado),Lince,Los Olivos,Lurigancho-Chosica,Lurín,Magdalena del Mar,Miraflores,Pachacámac,Pucusana,Pueblo Libre,Puente Piedra,Punta Hermosa,Punta Negra,Rímac,San Bartolo,San Borja,San Isidro,San Juan de Lurigancho,San Juan de Miraflores,San Luis,San Martín de Porres,San Miguel,Santa Anita,Santa María del Mar,Santa Rosa,Santiago de Surco,Surquillo,Villa El Salvador,Villa María del Triunfo'.split(',');
const DISTRITOS_CALLAO = ['Callao', 'Bellavista', 'Carmen de la Legua Reynoso', 'La Perla', 'La Punta', 'Mi Perú', 'Ventanilla'];

function getLoc() {
  let l = { dep: '', dist: '', method: '' };
  try { Object.assign(l, JSON.parse(localStorage.getItem(LOC_KEY) || '{}')); } catch (e) {}
  return l;
}
function saveLoc(l) { try { localStorage.setItem(LOC_KEY, JSON.stringify(l)); } catch (e) {} }

/* ---------- Logos de medios de pago (versiones dibujadas, no los logos oficiales) ---------- */
const PAY = {
  yape: ['<span style="background:#742284;color:#fff;font-weight:800;font-size:15px;letter-spacing:-.02em;font-style:italic">yape</span>', 'Yape'],
  plin: ['<span style="background:#00d1d1;color:#fff;font-weight:800;font-size:15px">plin</span>', 'Plin'],
  visa: ['<span style="background:#1a5fa8;color:#fff;font-weight:900;font-style:italic;font-size:17px">VISA</span>', 'Visa'],
  mastercard: ['<span style="background:#2f3b4f"><svg width="42" height="26" viewBox="0 0 42 26"><circle cx="15" cy="13" r="10" fill="#eb001b"/><circle cx="27" cy="13" r="10" fill="#f79e1b"/><path d="M21 5.3a10 10 0 0 1 0 15.4 10 10 0 0 1 0-15.4z" fill="#ff5f00"/></svg></span>', 'Mastercard'],
  amex: ['<span style="background:#1f72cd;color:#fff;font-weight:800;font-size:10px;line-height:1.05;text-align:center">AMERICAN<br>EXPRESS</span>', 'American Express'],
  diners: ['<span style="background:#0079be"><svg width="30" height="30" viewBox="0 0 28 28"><circle cx="14" cy="14" r="11" fill="#fff"/><path d="M9 14a5 5 0 0 1 4-4.9v9.8A5 5 0 0 1 9 14zm10 0a5 5 0 0 1-4 4.9V9.1a5 5 0 0 1 4 4.9z" fill="#0079be"/></svg></span>', 'Diners Club'],
  bcp: ['<span style="background:#0b4ea2;color:#fff;font-weight:800;font-style:italic;font-size:15px">BCP</span>', 'BCP'],
  bbva: ['<span style="background:#072146;color:#fff;font-weight:800;font-size:14px">BBVA</span>', 'BBVA'],
  interbank: ['<span style="background:#18a85c"><svg width="26" height="26" viewBox="0 0 26 26"><rect x="3" y="3" width="20" height="20" rx="3" fill="none" stroke="#0a2a6b" stroke-width="3"/><rect x="8" y="8" width="10" height="10" rx="1.5" fill="#0a2a6b"/></svg></span>', 'Interbank'],
  scotiabank: ['<span style="background:#ec111a"><svg width="26" height="26" viewBox="0 0 26 26"><circle cx="13" cy="13" r="10" fill="none" stroke="#fff" stroke-width="2.5"/><path d="M16.5 9.2c-1-1.2-5.8-1.1-5.8 1.3 0 3 6 1.5 6 4.4 0 2.6-5.3 2.5-6.4.9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg></span>', 'Scotiabank'],
  transfer: ['<span style="background:#e9f1fb;color:#0b3b6f;font-weight:800;font-size:12px;gap:6px"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 21h18"/></svg>Transferencia</span>', 'Transferencia bancaria']
};
const payLogo = (k, size = '') => PAY[k] ? `<div class="pay-logo ${size}" title="${PAY[k][1]}" role="img" aria-label="${PAY[k][1]}">${PAY[k][0]}</div>` : '';
const payLogos = (keys, size = '') => keys.map(k => payLogo(k, size)).join('');

/* ---------- Llamadas a tu Apps Script (catálogo, pedidos, constancias, DNI/RUC) ---------- */
function apiURL() { return (typeof SHEET_CONFIG !== 'undefined' && SHEET_CONFIG.APPS_SCRIPT_URL) || ''; }
async function apiGet(params, ms = 12000) {
  const base = apiURL(); if (!base) throw new Error('sin_backend');
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(base + '?' + new URLSearchParams(params), { signal: ctl.signal });
    return await res.json();
  } finally { clearTimeout(t); }
}
async function apiPost(payload, ms = 30000) {
  const base = apiURL(); if (!base) throw new Error('sin_backend');
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms);
  try {
    // Sin cabeceras personalizadas: es una petición "simple" y Apps Script la acepta sin bloqueo CORS
    const res = await fetch(base, { method: 'POST', body: JSON.stringify(payload), signal: ctl.signal });
    return await res.json();
  } finally { clearTimeout(t); }
}
