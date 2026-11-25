/* ============================================================
   CONFIG.JS — configuración del sitio
   ============================================================
   Pega aquí la URL de tu Apps Script una vez que lo despliegues
   (ver instrucciones en rastreo-pedidos-setup/apps-script-rastreo.gs).

   Se ve algo así:
   "https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXXXXXXXXX/exec"

   Mientras esté vacío, la página de "Rastrear pedido" mostrará
   un mensaje amigable invitando a consultar por WhatsApp, en vez
   de mostrar un error.
   ============================================================ */

const TRACKING_API_URL = "https://script.google.com/macros/s/AKfycbySfm9h9vh2RaQDelJQQcb_eGe0PhoxknCaX2JfzZO142loMtRFTddPecHxJvtETF-Q7g/exec";


/* ============================================================
   TIENDA ← GOOGLE SHEETS
   ------------------------------------------------------------
   SHEET_ID: el ID está en la URL de tu hoja:
   https://docs.google.com/spreadsheets/d/  <ESTE_ID>  /edit
   La hoja debe estar compartida como "Cualquier persona con el
   enlace → Lector" para que la web pueda leerla.
   ============================================================ */
const SHEET_CONFIG = {
  SHEET_ID: "1XiRWHVIK47Nu4Evz9uyBqqoqWdGwb9fr1PjNokf62-4",

  // Pestañas que alimentan la tienda (nombre EXACTO de la pestaña)
  TABS: ["MOBIL", "SHELL", "CASTROL", "VISTONY", "HYUNDAI"],

  // Pestaña opcional con imágenes/descripciones de referencia
  REFERENCE_TAB: "Catálogo_Referencia",

  // Reglas por pestaña cuando NO traen precio de venta.
  // HYUNDAI trae "COSTO": multiplicador null = no se publica, se muestra "Cotizar".
  // Ejemplo: HYUNDAI: { mult: 1.35 }  → precio web = costo × 1.35
  PRICE_RULES: {
    HYUNDAI: { mult: null }
  },

  // Opcional pero MUY recomendado: URL del Apps Script del catálogo (ver apps-script-catalogo.gs).
  // Funciona aunque la hoja sea privada y evita bloqueos del navegador.
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyMnW8NbcgLlldomL9mOMnrPE8tWfpq0ZoBp2erxgO6FrFDnDH_Kr5sAPqALN2cb8xW/exec",

  CACHE_MINUTES: 10   // la web guarda la última lectura para abrir rápido
};


/* ============================================================
   MEDIOS DE PAGO (ficha de producto)
   Deja solo los que aceptas de verdad. Para agregar uno, quita las // de su línea.
   Opciones: yape, plin, visa, mastercard, amex, diners, bcp, bbva, interbank, scotiabank, transfer
   ============================================================ */
const PAYMENT_METHODS = [
  'yape',
  'plin',
  'visa',
  // 'mastercard',
  // 'amex',
  // 'diners',
  // 'bcp',
  // 'bbva',
  // 'interbank',
  // 'scotiabank',
  'transfer'
];


/* ============================================================
   COMPRA / CHECKOUT — todo lo que puedes ajustar sin tocar código
   ============================================================ */
const CHECKOUT = {
  // Recargo por pagar con tarjeta (porcentaje sobre productos + envío)
  CARD_FEE_PCT: 1,

  // Yape: número y la imagen de tu código QR (guárdala en assets/yape-qr.png)
  YAPE_NUMBER: "962223354",
  YAPE_QR: "assets/yape-qr.png",
  PLIN_NUMBER: "",            // opcional: si también recibes por Plin, escribe el número

  // Cuentas para transferencia. Completa number/cci/holder; las que dejes
  // sin número NO se muestran. Quita o agrega bancos (bcp, interbank, scotiabank, bbva).
  BANK_ACCOUNTS: [
    { bank: "bcp",       name: "BCP",       type: "Cuenta corriente soles", number: "", cci: "", holder: "" },
    { bank: "interbank", name: "Interbank", type: "Cuenta corriente soles", number: "", cci: "", holder: "" }
  ],

  // Delivery en Lima y Callao: gratis desde FREE_FROM. Si pides menos,
  // DELIVERY_FEE_LIMA es el costo (número). null = "por coordinar por WhatsApp".
  FREE_FROM: 150,
  DELIVERY_FEE_LIMA: null,

  STORE: {
    name: "ICC Negocios – La Victoria",
    address: "Av. Aviación 1240, La Victoria, Lima – Perú",
    hours: "Lun–Vie 9:00 a.m. – 6:00 p.m. · Sáb 9:00 a.m. – 1:00 p.m."
  },
  AGENCIAS: ["Olva Courier", "Shalom", "Cruz del Sur", "Otra (la indico en las referencias)"]
};
