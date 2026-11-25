/* ============================================================
   BUSCAR IMÁGENES AUTOMÁTICAMENTE — versión SIN TARJETA (Serper.dev)
   Llena la columna IMAGEN de cada pestaña con un enlace de internet
   y anota en FUENTE IMAGEN de qué sitio salió, para que la revises.

   PREPARACIÓN (una sola vez, 3 minutos, gratis, SIN tarjeta):
   1. Entra a https://serper.dev/signup y crea tu cuenta (2,500 búsquedas gratis).
   2. Copia tu API key desde https://serper.dev/api-keys y pégala abajo.
   3. En tu hoja: Extensiones → Apps Script → archivo nuevo → pega TODO esto → Guardar.
   4. Recarga la hoja → menú "🖼️ Imágenes" → "Buscar imágenes faltantes"
      (la primera vez Google pide autorizar permisos: Revisar permisos → Permitir).

   Hace UNA búsqueda por producto (las presentaciones del mismo producto comparten
   imagen), así que tu catálogo gasta unos cientos de las 2,500 búsquedas.
   Solo rellena celdas vacías: nunca pisa una imagen que ya pusiste.
   No pegues tu API key en lugares públicos (ni en GitHub).
   ============================================================ */
const SERPER_KEY = 'PEGA_AQUI_TU_API_KEY_DE_SERPER';
const HOJAS = ['MOBIL', 'SHELL', 'CASTROL', 'VISTONY', 'HYUNDAI'];

// Sitios que suelen traer marca de agua o bloquean el uso de sus fotos
const EVITAR = /(shutterstock|alamy|istockphoto|gettyimages|dreamstime|depositphotos|123rf|pinterest|facebook|instagram|fbcdn|tiktok|ebay)\./i;

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🖼️ Imágenes')
    .addItem('Buscar imágenes faltantes', 'buscarImagenes')
    .addToUi();
}

function buscarImagenes() {
  if (SERPER_KEY.indexOf('PEGA_AQUI') === 0) {
    SpreadsheetApp.getUi().alert('Falta pegar tu API key de Serper al inicio del script.'); return;
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const cache = {};
  let consultas = 0, llenadas = 0, sinResultado = 0, error = '';

  for (const nombre of HOJAS) {
    const sh = ss.getSheetByName(nombre); if (!sh || error) continue;
    const datos = sh.getDataRange().getValues();
    const head = datos[0].map(h => String(h).trim().toUpperCase());
    const iProd = head.indexOf('PRODUCTO'), iMarca = head.indexOf('MARCA');
    if (iProd < 0) continue;
    let iImg = head.indexOf('IMAGEN');
    if (iImg < 0) { iImg = head.length; sh.getRange(1, iImg + 1).setValue('IMAGEN'); head.push('IMAGEN'); }
    let iSrc = head.indexOf('FUENTE IMAGEN');
    if (iSrc < 0) { iSrc = head.length; sh.getRange(1, iSrc + 1).setValue('FUENTE IMAGEN'); }

    for (let r = 1; r < datos.length; r++) {
      if (datos[r][iImg] || !datos[r][iProd]) continue;
      const base = nombreBase(datos[r][iProd]);
      const marca = iMarca >= 0 ? datos[r][iMarca] : nombre;
      const clave = marca + '|' + base;
      if (!(clave in cache)) {
        try { cache[clave] = buscar(`${marca} ${base}`); consultas++; }
        catch (e) { error = e.message; break; }
        Utilities.sleep(250);
      }
      const hit = cache[clave];
      if (hit) { sh.getRange(r + 1, iImg + 1).setValue(hit.url); sh.getRange(r + 1, iSrc + 1).setValue(hit.fuente); llenadas++; }
      else sinResultado++;
    }
  }
  SpreadsheetApp.getUi().alert(
    `Listo.\nBúsquedas realizadas: ${consultas}\nCeldas con imagen nueva: ${llenadas}\nProductos sin resultado útil: ${sinResultado}` +
    (error ? `\n\nSe detuvo por un error:\n${error}` : '') +
    '\n\nRevisa la columna FUENTE IMAGEN y reemplaza a mano las que no sean el producto exacto.');
}

// Quita la medida del final: "… 15W-40 CK4 5 GAL" → "… 15W-40 CK4"
function nombreBase(nombre) {
  return String(nombre).replace(/\s+\d+([.,]\d+)?\s*(LT|L|GAL|KG|LB)\s*$/i, '').replace(/\s+/g, ' ').trim();
}

function buscar(q) {
  const resp = UrlFetchApp.fetch('https://google.serper.dev/images', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { 'X-API-KEY': SERPER_KEY },
    payload: JSON.stringify({ q: q + ' envase', gl: 'pe', hl: 'es', num: 10 })
  });
  const code = resp.getResponseCode();
  if (code === 401 || code === 403) throw new Error('API key inválida o sin créditos (' + code + ').');
  if (code !== 200) throw new Error('Serper respondió ' + code + ': ' + resp.getContentText().slice(0, 120));
  return elegir((JSON.parse(resp.getContentText()).images) || []);
}

// Primera imagen grande, https, de proporción razonable y fuera de bancos de fotos
function elegir(images) {
  for (const im of images) {
    const url = im.imageUrl || '';
    const w = im.imageWidth || 0, h = im.imageHeight || 0;
    if (!/^https:\/\//i.test(url) || !/\.(png|jpe?g|webp)(\?|$)/i.test(url)) continue;
    if (EVITAR.test(url) || EVITAR.test(im.source || '') || EVITAR.test(im.link || '')) continue;
    if (w && h && (w < 400 || h < 400 || w / h > 1.8 || h / w > 1.8)) continue;
    return { url: url, fuente: im.domain || im.source || im.link || '' };
  }
  return null;
}
