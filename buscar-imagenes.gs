/* ============================================================
   BUSCAR IMÁGENES AUTOMÁTICAMENTE (Google Sheets)
   Llena la columna IMAGEN de cada pestaña con un enlace de internet.
   Una búsqueda por producto (las presentaciones del mismo producto comparten imagen).

   PREPARACIÓN (una sola vez, ~5 minutos, gratis hasta 100 búsquedas/día):
   1. API key:  console.cloud.google.com → habilita "Custom Search API"
                → Credenciales → Crear clave de API.
   2. Buscador: programmablesearchengine.google.com → Agregar → "Buscar en toda la web"
                → activa "Búsqueda de imágenes" → copia el "ID del motor de búsqueda".
   3. En esta hoja: Extensiones → Apps Script → pega este archivo (en el mismo
      proyecto del catálogo está bien, como archivo nuevo) → pega tus 2 datos abajo → Guardar.
   4. Recarga la hoja → menú "🖼️ Imágenes" → "Buscar imágenes faltantes".
      Si se acaba la cuota del día, vuelve a ejecutarlo mañana: continúa donde quedó.

   Después REVISA los enlaces: la búsqueda toma el primer resultado válido y a veces
   no es el producto exacto. Reemplaza a mano los que no te gusten.
   ============================================================ */
const API_KEY = 'PEGA_AQUI_TU_API_KEY';
const CX      = 'PEGA_AQUI_TU_ID_DE_BUSCADOR';
const HOJAS   = ['MOBIL', 'SHELL', 'CASTROL', 'VISTONY', 'HYUNDAI'];

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🖼️ Imágenes')
    .addItem('Buscar imágenes faltantes', 'buscarImagenes')
    .addToUi();
}

function buscarImagenes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const cache = {};            // producto base → url (evita repetir búsquedas)
  let consultas = 0, llenadas = 0, agotado = false;

  for (const nombre of HOJAS) {
    const sh = ss.getSheetByName(nombre); if (!sh) continue;
    const datos = sh.getDataRange().getValues();
    const head = datos[0].map(h => String(h).trim().toUpperCase());
    const iProd = head.indexOf('PRODUCTO'), iMarca = head.indexOf('MARCA');
    let iImg = head.indexOf('IMAGEN');
    if (iImg < 0) { iImg = head.length; sh.getRange(1, iImg + 1).setValue('IMAGEN'); }

    for (let r = 1; r < datos.length && !agotado; r++) {
      if (datos[r][iImg] || !datos[r][iProd]) continue;
      const base = String(datos[r][iProd]).replace(/\s+\d+([.,]\d+)?\s*(LT|L|GAL|KG|LB)\s*$/i, '').replace(/\s+/g, ' ').trim();
      const marca = iMarca >= 0 ? datos[r][iMarca] : nombre;
      const clave = marca + '|' + base;
      if (!(clave in cache)) {
        const res = buscar(base + ' ' + marca + ' envase producto');
        if (res === 'CUOTA') { agotado = true; break; }
        cache[clave] = res; consultas++;
      }
      if (cache[clave]) { sh.getRange(r + 1, iImg + 1).setValue(cache[clave]); llenadas++; }
    }
  }
  SpreadsheetApp.getUi().alert(
    `Listo.\nBúsquedas realizadas: ${consultas}\nCeldas llenadas: ${llenadas}` +
    (agotado ? '\n\nSe agotó la cuota diaria de Google. Ejecuta de nuevo mañana.' : ''));
}

function buscar(q) {
  const url = 'https://www.googleapis.com/customsearch/v1?searchType=image&num=5&imgSize=large&safe=active'
    + '&key=' + API_KEY + '&cx=' + CX + '&q=' + encodeURIComponent(q);
  const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (resp.getResponseCode() === 429) return 'CUOTA';
  if (resp.getResponseCode() !== 200) throw new Error(resp.getContentText());
  const items = (JSON.parse(resp.getContentText()).items || []);
  const ok = items.find(i => /^https:\/\//.test(i.link) && /\.(png|jpe?g|webp)(\?|$)/i.test(i.link) && (i.image || {}).width >= 400);
  return ok ? ok.link : '';
}
