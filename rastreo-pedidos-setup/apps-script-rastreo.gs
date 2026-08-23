/**
 * ============================================================
 * ICC NEGOCIOS — API de Rastreo de Pedidos (Google Apps Script)
 * ============================================================
 *
 * QUÉ HACE:
 * Convierte una hoja de Google Sheets en una pequeña API que tu
 * página web (seguimiento.html) consulta para mostrar el estado
 * real de un pedido.
 *
 * SEGURIDAD:
 * Solo devuelve datos si el CÓDIGO DE PEDIDO y el CORREO
 * coinciden exactamente con una fila. Así nadie puede "adivinar"
 * códigos y ver pedidos de otros clientes.
 *
 * ============================================================
 * CÓMO INSTALARLO (una sola vez)
 * ============================================================
 * 1. Crea una hoja de cálculo nueva en Google Sheets.
 * 2. Renombra la primera pestaña (hoja) a exactamente: Pedidos
 * 3. En la fila 1, escribe estos encabezados, uno por columna:
 *      A: Codigo      B: Nombre      C: Correo de facturación
 *      D: Estado       E: Actualizado
 *    (El nombre de la columna C debe incluir la palabra "Correo" en
 *    algún lugar — el script la reconoce aunque agregues más texto,
 *    así que "Correo de facturación" funciona perfecto y es más
 *    claro para tu equipo, porque es el mismo texto que ve el
 *    cliente en el formulario de la web.)
 * 4. (Opcional pero recomendado) Selecciona la columna D (Estado)
 *    y ve a Datos > Validación de datos > Lista de elementos, y
 *    agrega exactamente estas 4 opciones (con esas tildes):
 *      Confirmado
 *      En preparación
 *      En camino
 *      Entregado
 *    Esto evita errores de tipeo que rompan el rastreo.
 * 5. Ve a Extensiones > Apps Script. Se abrirá un editor de código.
 * 6. Borra todo el contenido de "Code.gs" y pega TODO este archivo.
 * 7. Haz clic en "Guardar" (ícono de disquete).
 * 8. Haz clic en "Implementar" (Deploy) > "Nueva implementación".
 * 9. En "Tipo", elige "Aplicación web".
 * 10. Configura:
 *       Ejecutar como: Yo (tu cuenta)
 *       Quién tiene acceso: Cualquier usuario
 * 11. Haz clic en "Implementar". Google pedirá autorización la
 *     primera vez — acepta los permisos (es tu propia hoja).
 * 12. Copia la "URL de la aplicación web" que te entrega. Se ve así:
 *       https://script.google.com/macros/s/AKfycb.../exec
 * 13. Pega esa URL en el archivo config.js del sitio web, en la
 *     línea: const TRACKING_API_URL = "PEGAR_AQUI_TU_URL";
 *
 * ============================================================
 * CÓMO LO USA TU EQUIPO EN EL DÍA A DÍA
 * ============================================================
 * - Cuando confirman un pedido por WhatsApp, agregan una fila
 *   nueva en la hoja "Pedidos" con Estado = "Confirmado".
 * - A medida que el pedido avanza, solo cambian el valor de la
 *   columna "Estado" (usando la lista desplegable). Nada más.
 * - La columna "Actualizado" pueden dejarla en blanco — se
 *   actualiza sola si usas la función onEdit incluida abajo
 *   (opcional, ver nota al final).
 *
 * ============================================================
 * SI QUIERES CAMBIAR ALGO
 * ============================================================
 * - Si renombras la pestaña, cambia SHEET_NAME abajo.
 * - Si agregas más estados, actualiza STAGES abajo Y la lista de
 *   validación en la hoja, EN EL MISMO ORDEN.
 */

const SHEET_NAME = 'Pedidos';
const STAGES = ['Confirmado', 'En preparación', 'En camino', 'Entregado'];

function doGet(e) {
  const codigo = normalize_(e.parameter.codigo);
  const correo = normalize_(e.parameter.correo, true);

  const output = { found: false };

  if (codigo && correo) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    if (sheet) {
      const data = sheet.getDataRange().getValues();
      const headers = data[0].map(h => String(h).trim().toLowerCase());

      const idxCodigo = findCol_(headers, 'codigo');
      const idxNombre = findCol_(headers, 'nombre');
      const idxCorreo = findCol_(headers, 'correo');
      const idxEstado = findCol_(headers, 'estado');
      const idxFecha = findCol_(headers, 'actualiz');

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const rowCodigo = normalize_(row[idxCodigo]);
        const rowCorreo = normalize_(row[idxCorreo], true);

        if (rowCodigo === codigo && rowCorreo === correo) {
          const estado = String(row[idxEstado] || '').trim();
          const stageIndex = STAGES.indexOf(estado);

          output.found = true;
          output.codigo = String(row[idxCodigo] || '').trim();
          output.nombre = idxNombre >= 0 ? String(row[idxNombre] || '').trim() : '';
          output.estado = estado;
          output.stageIndex = stageIndex >= 0 ? stageIndex : 0;
          output.stages = STAGES;
          output.actualizado = formatFecha_(idxFecha >= 0 ? row[idxFecha] : null);
          break;
        }
      }
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function findCol_(headers, keyword) {
  return headers.findIndex(h => h.indexOf(keyword) !== -1);
}

function normalize_(value, isEmail) {
  let v = String(value || '').trim();
  return isEmail ? v.toLowerCase() : v.toUpperCase();
}

function formatFecha_(value) {
  if (!value) return '';
  try {
    const d = (value instanceof Date) ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  } catch (err) {
    return '';
  }
}

/**
 * OPCIONAL: si quieres que la columna "Actualizado" se llene sola
 * cada vez que alguien cambia el "Estado" de una fila, puedes
 * activar un disparador (trigger) para esta función:
 *   Apps Script > reloj (Activadores) > Agregar activador >
 *   Función: onEditPedido | Evento: Al editar
 */
function onEditPedido(e) {
  const sheet = e.range.getSheet();
  if (sheet.getName() !== SHEET_NAME) return;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map(h => String(h).trim().toLowerCase());
  const idxEstado = findCol_(headers, 'estado') + 1;
  const idxFecha = findCol_(headers, 'actualiz') + 1;

  if (idxEstado && idxFecha && e.range.getColumn() === idxEstado && e.range.getRow() > 1) {
    sheet.getRange(e.range.getRow(), idxFecha).setValue(new Date());
  }
}
