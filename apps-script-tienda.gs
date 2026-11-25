/* ============================================================
   ICC NEGOCIOS — BACKEND ÚNICO (Google Apps Script)
   Reemplaza al script del catálogo: mantiene la MISMA URL /exec.
   Hace 5 cosas desde tu hoja MAESTRO PRECIOS:
     1. Catálogo  → entrega las pestañas de productos a la tienda
     2. Pedidos   → registra cada compra en la pestaña "Pedidos"
     3. Constancia→ guarda la captura de pago en tu Google Drive
     4. DNI / RUC → valida y autocompleta nombres (opcional, con token)
     5. Rastreo   → responde a la página "Rastrear Pedido"

   INSTALAR / ACTUALIZAR:
   1. En tu hoja: Extensiones → Apps Script. Borra el código y pega TODO esto. Guarda.
   2. Implementar → Administrar implementaciones → ✏ editar tu implementación
      → Versión: "Nueva versión" → Implementar. (La URL NO cambia.)
      Si te pide permisos (Drive, Gmail, Hojas), acéptalos.
   3. En config.js, pega la MISMA URL en TRACKING_API_URL (rastreo de pedidos).
   4. Para validar DNI/RUC: crea una cuenta gratis en apis.net.pe (o decolecta.com),
      copia tu token y pégalo en API_TOKEN abajo. Sin token todo sigue funcionando:
      el cliente completa sus datos a mano.
   ============================================================ */
const PESTANAS_CATALOGO = ['MOBIL', 'SHELL', 'CASTROL', 'VISTONY', 'HYUNDAI', 'Catálogo_Referencia'];
const HOJA_PEDIDOS = 'Pedidos';
const CARPETA_CONSTANCIAS = 'Constancias ICC';
const ETAPAS = ['Confirmado', 'En preparación', 'En camino', 'Entregado'];

// Validación de documentos (opcional). Revisa la documentación de tu proveedor si cambias de servicio.
const API_TOKEN = '';
const URL_DNI = 'https://api.apis.net.pe/v2/reniec/dni?numero=';
const URL_RUC = 'https://api.apis.net.pe/v2/sunat/ruc?numero=';

const COLUMNAS = ['Codigo', 'Nombre', 'Correo', 'Estado', 'Actualizado', 'Telefono', 'Comprobante', 'Tipo doc', 'N doc',
  'Razon social', 'Direccion fiscal', 'Metodo de pago', 'Subtotal', 'Recargo', 'Envio', 'Total', 'Entrega', 'Ubicacion',
  'Direccion de entrega', 'Referencia', 'Fecha de entrega', 'Recibe', 'Productos', 'Constancia', 'Creado'];

/* ---------------- Rutas ---------------- */
function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.action === 'dni' || p.action === 'ruc') return json(consultarDocumento(p.action, String(p.num || '')));
    if (p.codigo) return json(rastrear(p.codigo, p.correo));
    return json(catalogo());
  } catch (err) { return json({ error: String(err) }); }
}

function doPost(e) {
  try {
    const d = JSON.parse((e.postData && e.postData.contents) || '{}');
    if (d.action === 'pedido') return json(crearPedido(d));
    if (d.action === 'constancia') return json(guardarConstancia(d));
    return json({ ok: false, error: 'accion_desconocida' });
  } catch (err) { return json({ ok: false, error: String(err) }); }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------------- 1. Catálogo ---------------- */
function catalogo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet(), tabs = {};
  PESTANAS_CATALOGO.forEach(function (n) {
    const sh = ss.getSheetByName(n);
    if (sh) tabs[n] = sh.getDataRange().getDisplayValues();
  });
  return { tabs: tabs, updated: new Date().toISOString() };
}

/* ---------------- 2. Pedidos ---------------- */
function hojaPedidos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(HOJA_PEDIDOS);
  if (!sh) {
    sh = ss.insertSheet(HOJA_PEDIDOS);
    sh.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS]).setFontWeight('bold').setBackground('#07213f').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.getRange('D2:D').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(ETAPAS, true).build());
  }
  return sh;
}

function limpiar(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max || 200); }

function crearPedido(d) {
  if (d.hp) return { ok: false, error: 'rechazado' };                       // trampa para bots
  const c = d.cliente || {}, en = d.entrega || {};
  if (!Array.isArray(d.items) || !d.items.length || d.items.length > 60) return { ok: false, error: 'sin_productos' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(c.email || ''))) return { ok: false, error: 'correo_invalido' };

  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = hojaPedidos();
    const col = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 1).getValues();
    let max = 10000;
    col.forEach(function (r) { const m = String(r[0]).match(/^ICC-(\d+)$/); if (m) max = Math.max(max, parseInt(m[1], 10)); });
    const codigo = 'ICC-' + (max + 1);

    const productos = d.items.map(function (i) { return Number(i.qty) + ' x ' + limpiar(i.name, 120) + ' (' + limpiar(i.unit, 30) + ') [' + limpiar(i.code, 30) + '] @ ' + (i.price == null ? 'cotizar' : Number(i.price).toFixed(2)); }).join('\n');
    const ubic = [limpiar(en.dist, 60), limpiar(en.dep, 40)].filter(String).join(', ');
    const fila = [codigo, limpiar(c.nombre, 120), limpiar(c.email, 120).toLowerCase(), 'Confirmado', new Date(), limpiar(c.tel, 20),
      limpiar(d.comprobante, 20), limpiar(c.tdoc, 12), limpiar(c.doc, 20), limpiar(c.razon, 150), limpiar(c.dirFiscal, 200),
      limpiar(d.pago, 60), Number(d.subtotal) || 0, Number(d.recargo) || 0, limpiar(d.envioTxt, 60), Number(d.total) || 0,
      limpiar(en.modo, 20), ubic, limpiar(en.dir, 200), limpiar(en.ref, 200), limpiar(en.fecha, 12), limpiar(en.recibe, 120), productos, '', new Date()];
    sh.appendRow(fila);

    try {
      MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Nuevo pedido ' + codigo + ' — S/ ' + Number(d.total).toFixed(2),
        'Cliente: ' + fila[1] + '\nTeléfono: ' + fila[5] + '\nPago: ' + fila[11] + '\nEntrega: ' + fila[16] + ' — ' + ubic + '\n\n' + productos +
        '\n\nTotal: S/ ' + Number(d.total).toFixed(2) + '\nRevisa la hoja "Pedidos" y la constancia de pago.');
    } catch (mailErr) { /* si falla el correo, el pedido igual queda registrado */ }
    return { ok: true, codigo: codigo };
  } finally { lock.releaseLock(); }
}

/* ---------------- 3. Constancia de pago ---------------- */
function guardarConstancia(d) {
  const codigo = limpiar(d.codigo, 20).toUpperCase(), correo = limpiar(d.correo, 120).toLowerCase();
  if (!d.data || String(d.data).length > 14000000) return { ok: false, error: 'archivo_invalido' };
  const sh = hojaPedidos(), datos = sh.getDataRange().getValues();
  const h = datos[0].map(function (x) { return String(x).trim().toLowerCase(); });
  const iCod = h.indexOf('codigo'), iMail = h.indexOf('correo'), iCons = h.indexOf('constancia');
  for (let r = 1; r < datos.length; r++) {
    if (String(datos[r][iCod]).toUpperCase() === codigo && String(datos[r][iMail]).toLowerCase() === correo) {
      const it = DriveApp.getFoldersByName(CARPETA_CONSTANCIAS);
      const carpeta = it.hasNext() ? it.next() : DriveApp.createFolder(CARPETA_CONSTANCIAS);
      const nombre = codigo + '_' + limpiar(d.filename, 60).replace(/[^\w.\-]/g, '_');
      const blob = Utilities.newBlob(Utilities.base64Decode(d.data), limpiar(d.mime, 40) || 'image/jpeg', nombre);
      const url = carpeta.createFile(blob).getUrl();
      sh.getRange(r + 1, iCons + 1).setValue(url);
      try { MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Constancia recibida — ' + codigo, 'El cliente subió su constancia:\n' + url); } catch (e) {}
      return { ok: true };
    }
  }
  return { ok: false, error: 'pedido_no_encontrado' };
}

/* ---------------- 4. DNI / RUC (opcional) ---------------- */
function consultarDocumento(tipo, num) {
  if (!API_TOKEN) return { ok: false, error: 'sin_token' };
  if (tipo === 'dni' && !/^\d{8}$/.test(num)) return { ok: false, error: 'dni_invalido' };
  if (tipo === 'ruc' && !/^\d{11}$/.test(num)) return { ok: false, error: 'ruc_invalido' };
  const resp = UrlFetchApp.fetch((tipo === 'dni' ? URL_DNI : URL_RUC) + num, {
    muteHttpExceptions: true, headers: { Authorization: 'Bearer ' + API_TOKEN, Referer: 'https://apis.net.pe/' } });
  if (resp.getResponseCode() !== 200) return { ok: false, error: 'consulta_' + resp.getResponseCode() };
  const r = JSON.parse(resp.getContentText());
  if (tipo === 'dni') {
    const nombres = r.nombres || r.first_name || '';
    const ape = r.apellidos || [r.apellidoPaterno || r.first_last_name, r.apellidoMaterno || r.second_last_name].filter(String).join(' ');
    return nombres ? { ok: true, nombres: nombres, apellidos: ape } : { ok: false, error: 'sin_datos' };
  }
  const razon = r.razonSocial || r.razon_social || r.nombre || '';
  return razon ? { ok: true, razon: razon, direccion: [r.direccion, r.distrito, r.provincia, r.departamento].filter(String).join(', ') } : { ok: false, error: 'sin_datos' };
}

/* ---------------- 5. Rastreo ---------------- */
function rastrear(codigo, correo) {
  codigo = String(codigo || '').trim().toUpperCase(); correo = String(correo || '').trim().toLowerCase();
  const out = { found: false };
  if (!codigo || !correo) return out;
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_PEDIDOS); if (!sh) return out;
  const datos = sh.getDataRange().getValues();
  const h = datos[0].map(function (x) { return String(x).trim().toLowerCase(); });
  const f = function (k) { return h.findIndex(function (x) { return x.indexOf(k) !== -1; }); };
  const iCod = f('codigo'), iNom = f('nombre'), iMail = f('correo'), iEst = f('estado'), iAct = f('actualiz');
  for (let r = 1; r < datos.length; r++) {
    if (String(datos[r][iCod]).trim().toUpperCase() === codigo && String(datos[r][iMail]).trim().toLowerCase() === correo) {
      const estado = String(datos[r][iEst] || '').trim(), idx = ETAPAS.indexOf(estado), v = datos[r][iAct];
      out.found = true; out.codigo = String(datos[r][iCod]).trim(); out.nombre = String(datos[r][iNom] || '').trim();
      out.estado = estado; out.stageIndex = idx >= 0 ? idx : 0; out.stages = ETAPAS;
      out.actualizado = v instanceof Date ? Utilities.formatDate(v, Session.getScriptTimeZone(), 'dd/MM/yyyy') : '';
      break;
    }
  }
  return out;
}

/* Al cambiar el Estado a mano, se actualiza la fecha (funciona solo, no requiere activar nada) */
function onEdit(e) {
  const sh = e.range.getSheet(); if (sh.getName() !== HOJA_PEDIDOS || e.range.getRow() < 2) return;
  const h = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function (x) { return String(x).trim().toLowerCase(); });
  if (e.range.getColumn() === h.indexOf('estado') + 1) sh.getRange(e.range.getRow(), h.indexOf('actualizado') + 1).setValue(new Date());
}
