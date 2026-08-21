/* ============================================================
   CHAT.JS — asistente virtual, presente en todas las páginas
   Requiere data.js cargado antes que este archivo.
   ============================================================ */

const WSP_BASE = 'https://wa.me/51933795267?text=';
function wspLink(text) { return WSP_BASE + encodeURIComponent(text); }

/* Enlaces a categoría/marca: si estamos en tienda.html usa el filtro en vivo
   (applyCatFilter/applyBrandFilter, definidos en tienda.js); si no, navega
   a tienda.html con el parámetro correspondiente. */
function chatCatLink(id, label) {
  return `<a href="tienda.html?cat=${id}" onclick="return chatGoCat('${id}')">${label}</a>`;
}
function chatGoCat(id) {
  if (typeof applyCatFilter === 'function') {
    applyCatFilter(id);
    document.getElementById('tienda-top')?.scrollIntoView({ behavior: 'smooth' });
    return false;
  }
  return true;
}
function chatGoBrand(id) {
  if (typeof applyBrandFilter === 'function') {
    applyBrandFilter(id);
    document.getElementById('tienda-top')?.scrollIntoView({ behavior: 'smooth' });
    return false;
  }
  return true;
}

function catListHtml() {
  return CATEGORIES.map(c => chatCatLink(c.id, c.name)).join(' · ');
}
function brandListHtml() {
  return BRANDS.map(b => b.name).join(', ');
}

const CHAT_QUICK_REPLIES = [
  { label: '📦 ¿Qué categorías tienen?', q: '¿Qué categorías de productos tienen?' },
  { label: '🏷️ Marcas', q: '¿Con qué marcas trabajan?' },
  { label: '🚚 Envíos', q: '¿Hacen envíos y cuánto demoran?' },
  { label: '💳 Formas de pago', q: '¿Qué formas de pago aceptan?' },
  { label: '🕒 Horario de atención', q: '¿Cuál es su horario de atención?' },
  { label: '📍 Ubicación', q: '¿Dónde están ubicados?' },
  { label: '🧾 Cotizar', q: '¿Cómo pido una cotización?' },
  { label: '🔎 Rastrear mi pedido', q: '¿Cómo rastreo mi pedido?' },
];

const BOT_AVATAR = `<div class="msg-avatar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="9"/><path d="M9 10a3 3 0 1 1 3 3v1"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg></div>`;

let chatBody, chatQuick, chatBadge, chatWindow, chatOpened = false;

function chatAppend(role, html) {
  const wrap = document.createElement('div');
  wrap.className = 'msg ' + role;
  wrap.innerHTML = (role === 'bot' ? BOT_AVATAR : '') + `<div class="msg-bubble">${html}</div>`;
  chatBody.appendChild(wrap);
  chatBody.scrollTop = chatBody.scrollHeight;
}
function chatTyping(show) {
  let el = document.getElementById('chat-typing-indicator');
  if (show) {
    if (el) return;
    const wrap = document.createElement('div');
    wrap.className = 'msg bot';
    wrap.id = 'chat-typing-indicator';
    wrap.innerHTML = BOT_AVATAR + `<div class="msg-bubble"><div class="typing"><span></span><span></span><span></span></div></div>`;
    chatBody.appendChild(wrap);
    chatBody.scrollTop = chatBody.scrollHeight;
  } else if (el) { el.remove(); }
}
function botReply(html, delay = 650) {
  chatTyping(true);
  setTimeout(() => { chatTyping(false); chatAppend('bot', html); }, delay);
}

function promoSummaryText() {
  if (!ACTIVE_PROMOTIONS || !ACTIVE_PROMOTIONS.length) return 'No hay promociones activas registradas por el momento.';
  return ACTIVE_PROMOTIONS.map(p => `
    <div style="margin-top:10px; margin-bottom:8px;">
      <b>${p.label || 'Promoción vigente'}:</b> ${p.title}<br>
      <span style="color:#5a4700;">${p.terms || 'Consulta disponibilidad por WhatsApp.'}</span>
    </div>
  `).join('');
}

function getBotResponse(rawText) {
  const t = rawText.toLowerCase().trim();

  if (/^(hola|buenas|hey|hi|ola)\b/.test(t)) {
    return `¡Hola! 👋 Soy el asistente virtual de <b>ICC Negocios</b>. Puedo ayudarte con información de productos, marcas, envíos, pagos, cotizaciones y más. ¿Qué necesitas?`;
  }
  if (/(categor[ií]a|qu[eé] productos|qu[eé] venden|l[ií]neas|cat[aá]logo)/.test(t)) {
    return `Trabajamos estas líneas de producto:<br><br>${catListHtml()}<br><br>Haz clic en cualquiera para verla filtrada en la tienda, o dime qué tipo de producto buscas (ej. "aceite 15W40" o "grasa").`;
  }
  if (/marca/.test(t)) {
    return `Trabajamos con las siguientes marcas: <b>${brandListHtml()}</b>.<br><br>Puedes filtrar la tienda por marca haciendo clic en el logo en la sección "Marcas aliadas", o dime cuál te interesa y te muestro sus productos.`;
  }
  for (const b of BRANDS) {
    if (t.includes(b.name.toLowerCase())) {
      const items = PRODUCTS.filter(p => p.brand === b.id).slice(0, 4);
      const list = items.map(p => `• ${p.name} (${p.unit})`).join('<br>');
      return `Estos son algunos productos de <b>${b.name}</b> que manejamos:<br><br>${list}<br><br><a href="tienda.html?brand=${b.id}" onclick="return chatGoBrand('${b.id}')">Ver todos los productos de ${b.name} →</a>`;
    }
  }
  if (/(env[ií]o|delivery|despacho|demora|cu[aá]nto tarda|llega)/.test(t)) {
    return `Hacemos despacho en <b>24 a 48 horas</b> dentro de Lima Metropolitana 🚚. Para provincias coordinamos el envío por encomienda (el flete se cotiza aparte). Los pedidos desde S/150 tienen delivery gratis dentro de Lima. ¿Quieres coordinar un envío? <a href="${wspLink('Hola, quisiera coordinar el envío de mi pedido.')}" target="_blank">Escríbenos por WhatsApp</a>.`;
  }
  if (/(pago|yape|plin|efectivo|tarjeta|transferencia|factura)/.test(t)) {
    return `Aceptamos <b>Yape, Plin, transferencia bancaria, tarjeta y efectivo</b> en tienda. También emitimos <b>factura electrónica</b> para empresas y talleres. ¿Necesitas los datos para transferencia? <a href="${wspLink('Hola, quisiera los datos para hacer una transferencia/Yape/Plin.')}" target="_blank">Pídelos por WhatsApp</a>.`;
  }
  if (/(horario|hora|atienden|abren|cierran)/.test(t)) {
    return `Nuestro horario de atención es:<br><b>Lunes a Viernes:</b> 9:00am – 6:00pm<br><b>Sábados:</b> 9:00am – 1:00pm<br>Domingos y feriados permanecemos cerrados.`;
  }
  if (/(ubicaci[oó]n|direcci[oó]n|d[oó]nde (est[aá]n|queda)|local|tienda f[ií]sica)/.test(t)) {
    return `Estamos en <b>Av. Aviación 1240, La Victoria, Lima – Perú</b> 📍. <a href="https://www.google.com/maps/search/?api=1&query=Av.+Aviaci%C3%B3n+1240+La+Victoria+Lima+Peru" target="_blank">Ver en Google Maps →</a>`;
  }
  if (/(cotiza|presupuesto|precio de|cu[aá]nto cuesta|cu[aá]nto vale)/.test(t)) {
    return `Para cotizar puedes:<br>1️⃣ Ir a la página <a href="cotizar.html">Cotizar</a> y llenar el formulario.<br>2️⃣ Agregar productos al carrito 🛒 y presionar "Finalizar por WhatsApp".<br>3️⃣ O escribirnos directo: <a href="${wspLink('Hola, quisiera solicitar una cotización.')}" target="_blank">Cotizar por WhatsApp</a>.<br>Normalmente respondemos en menos de 24 horas.`;
  }
  if (/(rastre|seguimiento|d[oó]nde est[aá] mi pedido|estado de mi pedido)/.test(t)) {
    return `Puedes revisar el estado de tu pedido en la página <a href="seguimiento.html">Seguimiento de pedido</a> ingresando tu número de pedido y el correo de facturación. Si prefieres, también puedes <a href="${wspLink('Hola, quisiera consultar el estado de mi pedido.')}" target="_blank">consultarlo directo por WhatsApp</a>.`;
  }
  if (/(promo(cio|ci[oó]n|s)|oferta|descuento|mes en curso|vigente|vigentes)/.test(t)) {
    return `Tenemos una promoción activa este mes 🎉<br><br>${promoSummaryText()}<br>La puedes ver en <a href="tienda.html">la tienda</a> o consultar directamente por WhatsApp: <a href="${wspLink('Hola, quisiera conocer la promoción vigente del mes.')}" target="_blank">Consultar promoción</a>.`;
  }
  if (/(taller|mayorista|por mayor|flota|convenio|volumen)/.test(t)) {
    return `Sí, trabajamos con talleres, lubricentros y flotas con <b>precios especiales por volumen</b> y facturación electrónica. Cuéntanos el rubro de tu negocio y te preparamos una propuesta: <a href="${wspLink('Hola, tengo un taller/flota y quisiera conocer sus precios corporativos.')}" target="_blank">Conversar por WhatsApp</a>.`;
  }
  if (/(asesor|humano|persona|hablar con alguien|whatsapp|llamar|tel[eé]fono)/.test(t)) {
    return `Claro, con gusto te comunico con nuestro equipo 📞 <b>933 795 267</b>. <a href="${wspLink('Hola, quisiera hablar con un asesor de ICC Negocios.')}" target="_blank">Escríbenos por WhatsApp</a> y te atendemos directo.`;
  }
  if (/(gracias|genial|perfecto|ok listo)/.test(t)) {
    return `¡De nada! 😊 Si necesitas algo más, aquí estoy. También puedes explorar la <a href="tienda.html">tienda</a> o escribirnos por WhatsApp.`;
  }

  const kwHit = PRODUCTS.filter(p => t.split(/\s+/).some(word => word.length > 2 && p.name.toLowerCase().includes(word)));
  if (kwHit.length) {
    const items = kwHit.slice(0, 4).map(p => `• ${p.name} — ${p.brand} (${p.unit})`).join('<br>');
    return `Encontré esto relacionado en nuestro catálogo:<br><br>${items}<br><br><a href="tienda.html">Ver en la tienda →</a>`;
  }

  return `No estoy seguro de haber entendido bien 🤔 Puedo ayudarte con: categorías de productos, marcas, envíos, pagos, horarios, ubicación, cotizaciones o seguimiento de pedido. Si prefieres, escríbenos directo: <a href="${wspLink('Hola, tengo una consulta: ' + rawText)}" target="_blank">Consultar por WhatsApp</a>.`;
}

function handleUserMessage(text) {
  if (!text || !text.trim()) return;
  chatAppend('user', text.replace(/</g, '&lt;'));
  const chatInput = document.getElementById('chat-input');
  if (chatInput) chatInput.value = '';
  const reply = getBotResponse(text);
  botReply(reply);
}

function openChat() {
  chatWindow.classList.add('open');
  if (chatBadge) chatBadge.style.display = 'none';
  if (!chatOpened) {
    chatOpened = true;
    botReply(`¡Hola! 👋 Soy el <b>Asistente ICC</b>. Puedo ayudarte a encontrar productos, ver marcas, conocer envíos, pagos, horarios o hacer una cotización. ¿En qué te ayudo?`, 500);
  }
}
function closeChat() { chatWindow.classList.remove('open'); }

document.addEventListener('DOMContentLoaded', () => {
  const chatFloat = document.getElementById('chat-toggle');
  chatWindow = document.getElementById('chat-window');
  const chatClose = document.getElementById('chat-close');
  chatBody = document.getElementById('chat-body');
  chatQuick = document.getElementById('chat-quick');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  chatBadge = document.getElementById('chat-badge');

  if (!chatFloat || !chatWindow) return; // chat no está presente en esta página

  chatQuick.innerHTML = CHAT_QUICK_REPLIES.map(r => `<button type="button" class="chat-chip" data-q="${r.q.replace(/"/g, '&quot;')}">${r.label}</button>`).join('');
  chatQuick.addEventListener('click', e => {
    const btn = e.target.closest('.chat-chip');
    if (btn) handleUserMessage(btn.dataset.q);
  });

  chatForm.addEventListener('submit', e => {
    e.preventDefault();
    handleUserMessage(chatInput.value);
  });

  chatFloat.addEventListener('click', () => { chatWindow.classList.contains('open') ? closeChat() : openChat(); });
  chatClose.addEventListener('click', closeChat);
});
