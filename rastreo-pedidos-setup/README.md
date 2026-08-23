# Sistema de rastreo de pedidos — ICC Negocios

Convierte una Google Sheet en la "base de datos" de pedidos, y conecta
la página `seguimiento.html` de tu sitio para que muestre el estado
real (no una demo).

## Qué hay en esta carpeta

- **`apps-script-rastreo.gs`** — el código que conecta tu hoja con la web.
  Trae las instrucciones de instalación completas en los comentarios
  del inicio del archivo. Es lo único que necesitas copiar/pegar en
  Google Apps Script.
- **`pedidos-plantilla.csv`** — una hoja de ejemplo con las columnas
  correctas y 2 pedidos de muestra, lista para importar a Google Sheets
  (Archivo > Importar > Subir, en Sheets).

## Resumen del flujo (una vez instalado)

1. Un cliente hace un pedido por WhatsApp.
2. Tu equipo agrega una fila en la hoja "Pedidos": código (ej. `ICC-10045`),
   nombre, correo de facturación, y Estado = `Confirmado`.
3. A medida que el pedido avanza, tu equipo solo cambia la columna
   **Estado** (usando la lista desplegable: Confirmado → En preparación
   → En camino → Entregado).
4. El cliente entra a la web, va a "Rastrear pedido", escribe su código
   y correo — y ve el estado real, actualizado al segundo.

## Seguridad

La API solo devuelve información si **código Y correo** coinciden
exactamente con una fila. Nadie puede ver pedidos ajenos probando
códigos al azar.

## Conectar con la web

Después de desplegar el Apps Script (ver instrucciones dentro del
archivo `.gs`), copia la URL que te da Google y pégala en `config.js`,
en la raíz del sitio:

```js
const TRACKING_API_URL = "https://script.google.com/macros/s/TU_ID_AQUI/exec";
```

Guarda, sube los archivos a tu hosting, y listo — el rastreo ya
funciona con datos reales.

## Notas

- Si no configuras `TRACKING_API_URL`, la página de rastreo no se
  rompe: muestra un mensaje amigable invitando a consultar por
  WhatsApp, en vez de un error.
- Si tu equipo prefiere que la columna "Actualizado" se llene sola al
  cambiar el estado, activa el disparador `onEditPedido` — instrucciones
  dentro del archivo `.gs`.
- Si más adelante quieren algo más robusto (más volumen, varios
  usuarios editando a la vez, etc.), pueden migrar a Supabase sin tocar
  el sitio web — solo cambiarían qué hay detrás de `TRACKING_API_URL`.
