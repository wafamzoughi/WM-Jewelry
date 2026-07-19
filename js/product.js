// ── WM JEWELRY — product.js (page détail) ──

const WA_NUMBER = "21627820895";
let cart = [];
let currentProduct = null;
let selectedQty    = 1;

document.addEventListener("DOMContentLoaded", async () => {
  try { const _sc = localStorage.getItem("wm_cart"); if (_sc) cart = JSON.parse(_sc); } catch(e) {}
  updateCartUI();
  initCart();
  initHeader();

  // Afficher skeleton pendant le chargement
  document.getElementById("productLoading").style.display = "flex";
  await loadProducts();    // charge depuis JSONBin
  document.getElementById("productLoading").style.display = "none";

  loadProduct();
});

function initHeader() {
  window.addEventListener("scroll", () => {
    document.getElementById("header").classList.toggle("scrolled", window.scrollY > 40);
  });
}

function loadProduct() {
  const id = parseInt(new URLSearchParams(window.location.search).get("id"));
  const p  = products.find(x => x.id === id);

  if (!p) {
    document.getElementById("productPage").innerHTML = `
      <div class="product-not-found">
        <div class="notfound-icon">✦</div>
        <h2>Article introuvable</h2>
        <p>Cet article n'existe plus ou a été supprimé.</p>
        <a href="index.html" class="btn-primary">Retour à la boutique</a>
      </div>`;
    return;
  }

  currentProduct = p;
  document.title = `${p.name} — WM Jewelry`;

  const bcCat = document.getElementById("bcCat");
  bcCat.textContent = CATEGORIES[p.cat] || p.cat;
  bcCat.href = `index.html?cat=${p.cat}`;
  document.getElementById("bcName").textContent = p.name;

  renderProduct(p);
  renderRelated(p);
}

function renderProduct(p) {
  const imgHtml = p.image
    ? `<img src="${p.image}" alt="${p.name}" class="pd-main-img"
         onerror="this.outerHTML='<div class=pd-emoji-img>${p.emoji}</div>'">`
    : `<div class="pd-emoji-img">${p.emoji}</div>`;

  const outOfStock = isOutOfStock(p);
  const lowStock    = isLowStock(p);
  const stock       = getStock(p);

  let stockStatusHtml = "";
  if (outOfStock)      stockStatusHtml = `<div class="pd-stock-status pd-stock-out"><span>●</span> Rupture de stock</div>`;
  else if (lowStock)    stockStatusHtml = `<div class="pd-stock-status pd-stock-low"><span>●</span> Plus que ${stock} en stock</div>`;
  else if (stock !== null) stockStatusHtml = `<div class="pd-stock-status pd-stock-ok"><span>●</span> En stock</div>`;

  document.getElementById("productPage").innerHTML = `
    <div class="pd-layout">
      <div class="pd-left">
        <div class="pd-img-main${outOfStock?' pd-img-dimmed':''}">
          ${imgHtml}
          ${outOfStock ? '<span class="pd-badge-out">Rupture de stock</span>' : (p.isNew ? '<span class="pd-badge-new">NOUVEAU</span>' : "")}
          ${p.featured ? '<span class="pd-badge-feat">⭐ Vedette</span>'  : ""}
        </div>
        <div class="pd-thumbs">
          <div class="pd-thumb active">
            ${p.image ? `<img src="${p.image}" alt="${p.name}">` : `<span>${p.emoji}</span>`}
          </div>
        </div>
      </div>

      <div class="pd-right">
        <div class="pd-cat"><a href="index.html?cat=${p.cat}">${CATEGORIES[p.cat] || p.cat}</a></div>
        <h1 class="pd-name">${p.name}</h1>
        <div class="pd-price-row">
          <span class="pd-price">${p.price.toFixed(3)} DT</span>
          ${p.isNew ? '<span class="pd-tag-new">Nouveauté</span>' : ""}
        </div>
        ${stockStatusHtml}
        <div class="pd-divider"></div>
        <div class="pd-desc-block">
          <h3>Description</h3>
          <p class="pd-desc">${p.desc || "Aucune description disponible."}</p>
        </div>
        <div class="pd-features">
          <div class="pd-feature"><span class="pd-feat-icon">✦</span><span>Acier inoxydable 316L — résistant à l'eau</span></div>
          <div class="pd-feature"><span class="pd-feat-icon">✦</span><span>Anti-allergie — sans nickel</span></div>
          <div class="pd-feature"><span class="pd-feat-icon">✦</span><span>Livraison rapide partout en Tunisie</span></div>
          <div class="pd-feature"><span class="pd-feat-icon">✦</span><span>Paiement à la livraison disponible</span></div>
        </div>
        <div class="pd-divider"></div>
        ${outOfStock ? "" : `
        <div class="pd-qty-row">
          <label class="pd-qty-label">Quantité</label>
          <div class="pd-qty-ctrl">
            <button onclick="changeQtyPage(-1)">−</button>
            <span id="qtyDisplay">1</span>
            <button onclick="changeQtyPage(1)">+</button>
          </div>
        </div>`}
        <div class="pd-actions">
          ${outOfStock
            ? `<button class="pd-add-btn pd-add-btn-disabled" disabled>Indisponible — Rupture de stock</button>`
            : `<button class="pd-add-btn" onclick="addToCartPage()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                Ajouter au panier
              </button>
              <button class="pd-wa-btn" onclick="orderDirectly()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.531 5.847L0 24l6.31-1.507A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
                Commander via WhatsApp
              </button>`
          }
        </div>
        <div class="pd-share">
          <span>Partager :</span>
          <button onclick="shareWA()" title="WhatsApp">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.531 5.847L0 24l6.31-1.507A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
          </button>
          <button onclick="copyLink()" title="Copier le lien">🔗</button>
        </div>
      </div>
    </div>`;
}

function renderRelated(p) {
  const related = products.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 4);
  if (!related.length) return;
  document.getElementById("relatedSection").style.display = "block";
  document.getElementById("relatedGrid").innerHTML = related.map(r => `
    <div class="related-card${isOutOfStock(r)?' is-out-of-stock':''}" onclick="window.location.href='product.html?id=${r.id}'">
      <div class="related-img">
        ${r.image
          ? `<img src="${r.image}" alt="${r.name}" loading="lazy"
               onerror="this.outerHTML='<span>${r.emoji}</span>'">`
          : `<span>${r.emoji}</span>`}
        ${isOutOfStock(r) ? '<span class="related-badge-out">Rupture</span>' : ""}
      </div>
      <div class="related-info">
        <div class="related-name">${r.name}</div>
        <div class="related-price">${r.price.toFixed(3)} DT</div>
      </div>
    </div>`).join("");
}

function changeQtyPage(delta) {
  selectedQty = Math.max(1, selectedQty + delta);
  document.getElementById("qtyDisplay").textContent = selectedQty;
}

function addToCartPage() {
  const p = currentProduct;
  if (!p) return;
  if (isOutOfStock(p)) { showNotification(`⚠ ${p.name} est en rupture de stock`); return; }
  const stock = getStock(p);
  const existing = cart.find(c => c.id === p.id);
  const nextQty = (existing ? existing.qty : 0) + selectedQty;
  if (stock !== null && nextQty > stock) { showNotification(`⚠ Stock maximum atteint (${stock})`); return; }
  if (existing) existing.qty += selectedQty;
  else cart.push({ id: p.id, name: p.name, price: p.price, qty: selectedQty });
  localStorage.setItem("wm_cart", JSON.stringify(cart));
  updateCartUI();
  showNotification(`✓ ${p.name} × ${selectedQty} ajouté au panier`);
  openCart();
}

function orderDirectly() {
  const p = currentProduct;
  if (!p) return;
  if (isOutOfStock(p)) { showNotification(`⚠ ${p.name} est en rupture de stock`); return; }
  const msg = `🛍 Bonjour WM Jewelry!\n\nJe souhaite commander:\n• ${p.name} × ${selectedQty} = ${(p.price * selectedQty).toFixed(3)} DT\n\nMerci!`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
}

function shareWA() {
  window.open(`https://wa.me/?text=${encodeURIComponent("✨ " + currentProduct?.name + "\n" + window.location.href)}`, "_blank");
}
function copyLink() {
  navigator.clipboard.writeText(window.location.href).then(() => showNotification("✓ Lien copié !"));
}

function initCart() {
  document.getElementById("cartBtn")?.addEventListener("click", e => { e.preventDefault(); openCart(); });
  document.getElementById("cartOverlay")?.addEventListener("click", closeCart);
}
function openCart() {
  document.getElementById("cartSidebar").classList.add("open");
  document.getElementById("cartOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeCart() {
  document.getElementById("cartSidebar").classList.remove("open");
  document.getElementById("cartOverlay").classList.remove("open");
  document.body.style.overflow = "";
}
function updateCartUI() {
  const count = cart.reduce((s, c) => s + c.qty, 0);
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  document.getElementById("cartCount").textContent = count;
  const items  = document.getElementById("cartItems");
  const footer = document.getElementById("cartFooter");
  if (!cart.length) { items.innerHTML = '<p class="cart-empty">Votre panier est vide</p>'; footer.style.display = "none"; return; }
  items.innerHTML = cart.map(c => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${c.name}</div>
        <div class="cart-item-qty-row">
          <button class="qty-btn" onclick="changeQty(${c.id},-1)">−</button>
          <span class="qty-val">${c.qty}</span>
          <button class="qty-btn" onclick="changeQty(${c.id},1)">+</button>
        </div>
      </div>
      <div class="cart-item-right">
        <div class="cart-item-price">${(c.price * c.qty).toFixed(3)} DT</div>
        <button class="cart-item-rm" onclick="removeFromCart(${c.id})">×</button>
      </div>
    </div>`).join("");
  footer.style.display = "block";
  document.getElementById("cartTotal").textContent = total.toFixed(3) + " DT";
}
function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  localStorage.setItem("wm_cart", JSON.stringify(cart));
  updateCartUI();
}
function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  localStorage.setItem("wm_cart", JSON.stringify(cart));
  updateCartUI();
}
function order() {
  if (!cart.length) return;
  const lines = cart.map(c => `• ${c.name} x${c.qty} = ${(c.price * c.qty).toFixed(3)} DT`).join("\n");
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`🛍 Bonjour WM Jewelry!\n\nJe souhaite commander:\n${lines}\n\n💰 Total: ${total.toFixed(3)} DT\n\nMerci!`)}`, "_blank");
}
function showNotification(msg) {
  const n = document.getElementById("notification");
  n.textContent = msg; n.classList.add("show");
  setTimeout(() => n.classList.remove("show"), 3000);
}