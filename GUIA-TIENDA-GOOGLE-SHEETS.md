# Tienda conectada a Google Sheets — guía rápida

## Cómo funciona
`sheets.js` lee las pestañas MOBIL, SHELL, CASTROL, VISTONY y HYUNDAI de tu hoja
"MAESTRO PRECIOS" cada vez que alguien abre la web (guarda la lectura 10 min).
Cambias un precio en la hoja → la web lo muestra en minutos. No hay que subir nada a GitHub.

## Requisito indispensable
En Google Sheets: Compartir → Acceso general → **Cualquier persona con el enlace → Lector**.
(Si la hoja es privada, la web no puede leerla y mostrará el catálogo de respaldo con un aviso.)

## Columnas que lee (mismo orden que ya usas)
CÓDIGO | PRODUCTO | UND MEDIDA | PRECIO (o COSTO en HYUNDAI) | CATEGORÍA | MARCA | IMAGEN

- Precio vacío → la tienda muestra "Cotizar precio".
- Acepta 32.00, 370,00 y 4.070,00.
- Presentaciones del mismo producto se agrupan solas: el nombre debe ser idéntico
  salvo la medida al final (1 L, 4LT, 5 GAL, 55 GAL...).
- Categorías válidas: aceites, caja, industrial, grasas, refrigerantes, urea, aditivos.

## Cambios en la configuración
Todo está en `config.js` → `SHEET_CONFIG`:
- `TABS`: agrega o quita pestañas.
- `PRICE_RULES.HYUNDAI.mult`: hoy `null` (Hyundai no se publica con precio porque su columna es COSTO).
  Pon por ejemplo `1.35` para publicar costo × 1.35.

## Imágenes
La carpeta `assets/products/` está vacía en este paquete. Copia tus imágenes ahí
(o el logo en `assets/logo-icc.jpeg` y marcas en `assets/brands/`).
Si una imagen falta, la tarjeta muestra un ícono en vez de quedar en blanco.
Recomendado: WebP o PNG de 800×800 px, menos de 100 KB cada una.

## Ficha de producto (producto.html)
Al hacer clic en un producto se abre su ficha: galería con zoom, presentaciones,
entrega por ubicación, medios de pago, descripción y especificaciones.

Columnas OPCIONALES que puedes agregar al final de cada pestaña:
- `IMAGEN TRASERA`  → segunda foto (vista trasera). Aparece como miniatura "Trasera".
- `DESCRIPCIÓN`     → texto de la ficha (separa párrafos con Enter dentro de la celda).
- `FICHA TÉCNICA`   → enlace a un PDF; muestra el botón "Descargar ficha técnica".
Si una presentación no tiene imagen, usa la de otra presentación del mismo producto.

## Imágenes desde internet o Drive
En IMAGEN puedes pegar: una ruta local (assets/products/x.png), un enlace https de internet
o un enlace de Google Drive (compartido "cualquiera con el enlace"; la web lo convierte solo).
Para llenarlas automáticamente usa `buscar-imagenes.gs` (Serper.dev, gratis y sin tarjeta; instrucciones al inicio del archivo).

## Flujo de compra (carrito → pedido → pago → constancia → confirmación)
Páginas: `carrito.html`, `pedido.html`, `gracias.html` (lógica en `checkout.js`).
1. Ficha: barra fija "Comprar" → ventana "Producto añadido" → "Ir a mi carrito".
2. Carrito: precio con tarjeta (+1 %) y precio con transferencia/Yape.
3. Pedido: comprobante (boleta/factura) → identificación (DNI/RUC) → entrega → método de pago.
4. Pago: Yape (QR + número), transferencia (tus cuentas) o tarjeta (enlace por WhatsApp).
5. Constancia: el cliente sube su captura; queda en tu Drive ("Constancias ICC").
6. Confirmación con número de pedido y estado.

### Lo que debes configurar
- `config.js` → `CHECKOUT`: número de Yape, cuentas bancarias, costo de delivery, recargo de tarjeta.
- Sube tu QR de Yape como `assets/yape-qr.png`.
- Reemplaza el código de tu Apps Script por `apps-script-tienda.gs` (misma URL, "Nueva versión"):
  registra pedidos en la pestaña "Pedidos", guarda constancias y responde al rastreo.
- Después pega esa misma URL en `TRACKING_API_URL` (config.js) para que "Rastrear Pedido" funcione con los pedidos nuevos.
- Opcional: token de apis.net.pe en `API_TOKEN` del script para validar DNI/RUC.
