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
