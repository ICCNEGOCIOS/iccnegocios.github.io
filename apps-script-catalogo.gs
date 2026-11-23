/* ============================================================
   CATÁLOGO → WEB (Google Apps Script)
   Entrega las pestañas de MAESTRO PRECIOS a la tienda en JSON.
   Funciona aunque la hoja sea privada y sin bloqueos de navegador.

   INSTALAR (3 minutos):
   1. Abre tu hoja MAESTRO PRECIOS → Extensiones → Apps Script.
   2. Borra lo que haya y pega TODO este archivo. Guarda (💾).
   3. Implementar → Nueva implementación → tipo "Aplicación web".
        Ejecutar como: Yo
        Quién tiene acceso: Cualquier persona
      → Implementar → autoriza los permisos → copia la URL que termina en /exec
   4. Pega esa URL en config.js, en APPS_SCRIPT_URL, y sube el cambio.
   Si luego editas este script: Implementar → Administrar implementaciones
   → editar → Nueva versión (la URL no cambia).
   ============================================================ */
const PESTANAS = ['MOBIL', 'SHELL', 'CASTROL', 'VISTONY', 'HYUNDAI', 'Catálogo_Referencia'];

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const tabs = {};
    PESTANAS.forEach(function (name) {
      const sh = ss.getSheetByName(name);
      if (sh) tabs[name] = sh.getDataRange().getDisplayValues();   // tal como se ve en la hoja
    });
    return json({ tabs: tabs, updated: new Date().toISOString() });
  } catch (err) {
    return json({ error: String(err) });
  }
}
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
