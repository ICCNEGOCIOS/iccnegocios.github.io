"""
quitar_fondo.py
----------------
Recorre las carpetas de imágenes del proyecto (assets/products, assets/brands,
assets/promos, etc.) y genera una copia de cada imagen con el fondo eliminado
(transparente), lista para usar en la web.

CÓMO USARLO
1. Copia este archivo dentro de la carpeta raíz de tu proyecto web
   (la que contiene la carpeta "assets").
2. Instala las dependencias (una sola vez):
       pip install rembg onnxruntime pillow --break-system-packages
   (si no usas Linux/Debian, puedes omitir --break-system-packages)
3. Ejecuta:
       python quitar_fondo.py
4. Las imágenes procesadas se guardan en una carpeta nueva "assets_sin_fondo/"
   con la MISMA estructura de subcarpetas que "assets/", así que después
   solo tienes que reemplazar la carpeta "assets" por "assets_sin_fondo"
   (o renombrarla) para que la web use las imágenes ya limpias.

NOTA IMPORTANTE
- Funciona mejor con fotos de productos que tengan un fondo relativamente
  liso (blanco, gris, etc.), que es el caso típico de fotos de catálogo.
- Los logos de marca (assets/brands) casi siempre ya tienen fondo transparente
  o blanco simple; igual se procesan por si acaso, pero revisa el resultado.
- La primera vez que corras el script, descargará un modelo de IA (~170MB),
  así que necesita conexión a internet la primera vez. Luego queda en caché
  y las siguientes ejecuciones son más rápidas.
"""

import os
from pathlib import Path
from rembg import remove
from PIL import Image

# Carpeta raíz donde están tus imágenes (ajusta si es necesario)
CARPETA_ORIGEN = Path("assets")

# Carpeta donde se guardarán las imágenes ya procesadas
CARPETA_DESTINO = Path("assets_sin_fondo")

# Extensiones de imagen que se van a procesar
EXTENSIONES_VALIDAS = {".png", ".jpg", ".jpeg", ".webp"}


def procesar_imagen(ruta_entrada: Path, ruta_salida: Path):
    """Quita el fondo de una imagen y la guarda como PNG con transparencia."""
    ruta_salida.parent.mkdir(parents=True, exist_ok=True)
    try:
        with open(ruta_entrada, "rb") as f:
            datos_entrada = f.read()

        datos_salida = remove(datos_entrada)

        # Guardamos siempre como .png para conservar la transparencia
        ruta_salida_png = ruta_salida.with_suffix(".png")
        with open(ruta_salida_png, "wb") as f:
            f.write(datos_salida)

        print(f"✔ {ruta_entrada}  →  {ruta_salida_png}")
    except Exception as e:
        print(f"✘ Error procesando {ruta_entrada}: {e}")


def main():
    if not CARPETA_ORIGEN.exists():
        print(f"No encontré la carpeta '{CARPETA_ORIGEN}'. "
              f"Asegúrate de correr este script desde la raíz del proyecto "
              f"(donde está la carpeta 'assets').")
        return

    imagenes = [
        p for p in CARPETA_ORIGEN.rglob("*")
        if p.suffix.lower() in EXTENSIONES_VALIDAS
    ]

    if not imagenes:
        print("No encontré imágenes para procesar dentro de 'assets/'.")
        return

    print(f"Encontré {len(imagenes)} imágenes. Procesando...\n")

    for ruta in imagenes:
        ruta_relativa = ruta.relative_to(CARPETA_ORIGEN)
        ruta_salida = CARPETA_DESTINO / ruta_relativa
        procesar_imagen(ruta, ruta_salida)

    print(f"\nListo. Revisa la carpeta '{CARPETA_DESTINO}/'.")
    print("Cuando confirmes que las imágenes se ven bien, reemplaza tu carpeta")
    print("'assets' por 'assets_sin_fondo' (o renómbrala) para que la web las use.")


if __name__ == "__main__":
    main()
