/* ============================================================
   CART.JS — carrito de compras, persistente entre páginas
   (usa localStorage para que sobreviva la navegación entre .html)
   Requiere data.js cargado antes que este archivo.
   ============================================================ */

const CART_STORAGE_KEY = 'icc_cart_v1';

let cart = {}; // { productId: qty }

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    cart = raw ? JSON.parse(raw) : {};
  } catch (e) {
    cart = {};
  }
}
function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (e) { /* almacenamiento no disponible, se ignora */ }
}

function addToCart(id) {
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  updateCartUI();
  showToast(product.name + ' agregado al carrito');
}
function changeQty(id, delta) {
  if (!cart[id]) return;
  cart[id] += delta;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
  updateCartUI();
}
function removeItem(id) {
  delete cart[id];
  saveCart();
  updateCartUI();
}
function clearCart() {
  cart = {};
  saveCart();
  updateCartUI();
}

function updateCartUI() {
  const cartCountEl = document.getElementById('cart-count');
  const body = document.getElementById('drawer-body');
  const foot = document.getElementById('drawer-foot');
  if (!cartCountEl || !body || !foot) return; // el carrito no está presente en esta página

  const entries = Object.entries(cart)
    .map(([id, qty]) => ({ product: PRODUCTS.find(p => p.id === id), qty }))
    .filter(e => e.product);

  const count = entries.reduce((s, e) => s + e.qty, 0);
  cartCountEl.textContent = count;

  if (entries.length === 0) {
    body.innerHTML = `<div class="drawer-empty">
      <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
      <p>Tu carrito está vacío.<br>Explora la tienda y agrega productos.</p>
    </div>`;
    foot.style.display = 'none';
    return;
  }
  foot.style.display = 'flex';
  body.innerHTML = entries.map(({ product, qty }) => `
    <div class="cart-item">
      <div class="cart-item-icon">${svgIcon(product.icon, 26)}</div>
      <div>
        <div class="cart-item-name">${product.name}</div>
        <div class="cart-item-meta">${product.brand} · ${product.unit}</div>
        <div class="qty-row">
          <button class="qty-btn" onclick="changeQty('${product.id}',-1)">−</button>
          <span class="mono" style="font-size:13px; font-weight:700;">${qty}</span>
          <button class="qty-btn" onclick="changeQty('${product.id}',1)">+</button>
        </div>
      </div>
      <div>
        <div class="cart-item-price">${product.price !== null ? 'S/ ' + (product.price * qty).toFixed(2) : 'A cotizar'}</div>
        <div class="remove-btn" onclick="removeItem('${product.id}')" style="cursor:pointer; text-align:right;">Quitar</div>
      </div>
    </div>
  `).join('');

  const pricedItems = entries.filter(({ product }) => product.price !== null);
  const quoteItems = entries.filter(({ product }) => product.price === null);
  const total = pricedItems.reduce((s, { product, qty }) => s + product.price * qty, 0);
  const totalEl = document.getElementById('cart-total');
  if (totalEl) totalEl.textContent = 'S/ ' + total.toFixed(2) + (quoteItems.length ? ' + a cotizar' : '');

  const msgLines = entries.map(({ product, qty }) => `• ${qty}x ${product.name} (${product.brand}, ${product.unit}) — ${product.price !== null ? 'S/ ' + (product.price * qty).toFixed(2) : 'precio a confirmar'}`);
  const fullMsg = `Hola ICC Negocios, quiero coordinar este pedido:%0A%0A${msgLines.join('%0A')}%0A%0ASubtotal con precio fijo: S/ ${total.toFixed(2)}${quoteItems.length ? '%0A(Hay ' + quoteItems.length + ' producto(s) pendiente(s) de cotizar)' : ''}`;
  const checkoutBtn = document.getElementById('checkout-wsp');
  if (checkoutBtn) checkoutBtn.href = `https://wa.me/51933795267?text=${fullMsg}`;
}

/* ---------------- DRAWER TOGGLE ---------------- */
function openDrawer() {
  document.getElementById('drawer')?.classList.add('open');
  document.getElementById('overlay')?.classList.add('open');
}
function closeDrawer() {
  document.getElementById('drawer')?.classList.remove('open');
  document.getElementById('overlay')?.classList.remove('open');
}

/* ---------------- TOAST ---------------- */
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  document.getElementById('toast-msg').textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  updateCartUI();

  document.getElementById('cart-toggle')?.addEventListener('click', openDrawer);
  document.getElementById('drawer-close')?.addEventListener('click', closeDrawer);
  document.getElementById('overlay')?.addEventListener('click', closeDrawer);
  document.getElementById('clear-cart')?.addEventListener('click', clearCart);
});

// Si el carrito se modifica en otra pestaña/página, mantener sincronizado
window.addEventListener('storage', e => {
  if (e.key === CART_STORAGE_KEY) {
    loadCart();
    updateCartUI();
  }
});
