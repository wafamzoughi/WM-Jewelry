// ── WM JEWELRY — main.js ──

const WA_NUMBER = "21627820895";
let cart = [];
try { const _sc = localStorage.getItem("wm_cart"); if (_sc) cart = JSON.parse(_sc); } catch(e) {}
let currentFilter = "all";
let currentSort   = "default";

// ── INIT : attend que les produits soient chargés ──
document.addEventListener("DOMContentLoaded", async () => {
  showSkeleton();          // affiche un squelette pendant le chargement
  await loadProducts();    // attend JSONBin
  hideSkeleton();
  renderCategories();
  renderFilterBar();
  renderProducts();
  updateCartUI();
  initHeader();
  initCart();
  checkCatParam();
});

// ── SKELETON LOADER ──
function showSkeleton() {
  const grid = document.getElementById("productsGrid");
  if (grid) grid.innerHTML = Array(6).fill(`
    <div class="product-card skeleton-card">
      <div class="skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line medium"></div>
      </div>
    </div>`).join("");

  const catGrid = document.getElementById("catGrid");
  if (catGrid) catGrid.innerHTML = Array(4).fill(`<div class="cat-card skeleton-cat"></div>`).join("");
}
function hideSkeleton() {}

// ── HEADER SCROLL ──
function initHeader() {
  window.addEventListener("scroll", () => {
    document.getElementById("header").classList.toggle("scrolled", window.scrollY > 40);
  });
}

// ── CATEGORIES ──
function renderCategories() {
  const usedCats = [...new Set(products.map(p => p.cat))];
  const grid = document.getElementById("catGrid");
  if (!grid) return;
  grid.innerHTML = usedCats.map(cat => `
    <div class="cat-card" onclick="scrollToProductsAndFilter('${cat}')">
      <div class="cat-img-wrap">
        <img src="${CAT_IMAGES[cat] || ''}" alt="${CATEGORIES[cat] || cat}"
          onerror="this.parentNode.innerHTML='<div class=cat-img-fallback>${CAT_ICONS[cat]||"✦"}</div>'">
        <div class="cat-overlay">
          <div class="cat-name">${CATEGORIES[cat] || cat}</div>
          <div class="cat-count">${products.filter(p => p.cat === cat).length} articles</div>
        </div>
      </div>
    </div>
  `).join("");
}

// ── FILTER BAR ──
function renderFilterBar() {
  const bar = document.getElementById("filterBar");
  if (!bar) return;
  const usedCats = [...new Set(products.map(p => p.cat))];
  bar.innerHTML =
    `<button class="filter-btn ${currentFilter === "all" ? "active" : ""}" onclick="filterProducts('all')">Tout voir</button>` +
    usedCats.map(cat => `
      <button class="filter-btn ${currentFilter === cat ? "active" : ""}" onclick="filterProducts('${cat}')">
        ${CAT_ICONS[cat] || ""} ${CATEGORIES[cat] || cat}
      </button>
    `).join("");
}

// ── PRODUCTS GRID ──
function renderProducts() {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;
  let filtered = currentFilter === "all" ? [...products] : products.filter(p => p.cat === currentFilter);
  filtered = sortProducts(filtered);

  if (!filtered.length) {
    grid.innerHTML = `<div class="no-products"><div class="no-products-icon">✦</div><p>Aucun article dans cette catégorie.</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const outOfStock = isOutOfStock(p);
    const lowStock    = isLowStock(p);
    const stock       = getStock(p);
    return `
    <div class="product-card${outOfStock?' is-out-of-stock':''}" onclick="window.location.href='product.html?id=${p.id}'">
      <div class="product-img-wrap">
        ${p.image
          ? `<img class="product-real-img" src="${p.image}" alt="${p.name}" loading="lazy"
               onerror="this.outerHTML='<div class=product-emoji-img>${p.emoji}</div>'">`
          : `<div class="product-emoji-img">${p.emoji}</div>`
        }
        ${outOfStock  ? '<span class="badge-outofstock">Rupture de stock</span>' : ""}
        ${!outOfStock && p.isNew     ? '<span class="badge-new">NOUVEAU</span>'  : ""}
        ${p.featured  ? '<span class="badge-featured">⭐</span>'  : ""}
        <button class="wishlist-btn" onclick="toggleWishlist(event,this)" title="Favoris">♡</button>
      </div>
      <div class="product-body">
        <div class="product-cat">${CATEGORIES[p.cat] || p.cat}</div>
        <h3 class="product-name">${p.name}</h3>
        ${renderRatingStars(p.id)}
        ${!outOfStock && lowStock ? `<div class="product-stock-note">Plus que ${stock} en stock</div>` : ""}
        <div class="product-footer">
          <span class="product-price">${p.price.toFixed(3)} DT</span>
          ${outOfStock
            ? `<button class="add-btn add-btn-disabled" disabled onclick="event.stopPropagation()">Indisponible</button>`
            : `<button class="add-btn" onclick="event.stopPropagation();addToCart(${p.id})">+ Panier</button>`
          }
        </div>
      </div>
    </div>
  `;
  }).join("");
}

// ── TRI ──
function sortProducts(list) {
  switch (currentSort) {
    case "price-asc":  return list.sort((a, b) => a.price - b.price);
    case "price-desc": return list.sort((a, b) => b.price - a.price);
    case "name-asc":   return list.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    case "rating-desc": {
      const rate = p => getAverageRating(p.id) ?? -1;
      return list.sort((a, b) => rate(b) - rate(a));
    }
    case "popular":    return list.sort((a, b) => getViews(b.id) - getViews(a.id));
    default:           return list;
  }
}
function setSortOrder(value) {
  currentSort = value;
  renderProducts();
}

function filterProducts(cat) {
  currentFilter = cat;
  renderFilterBar();
  renderProducts();
  const url = new URL(window.location);
  if (cat === "all") url.searchParams.delete("cat");
  else url.searchParams.set("cat", cat);
  history.pushState({}, "", url);
}

function scrollToProductsAndFilter(cat) {
  filterProducts(cat);
  setTimeout(() => document.getElementById("nouveautes")?.scrollIntoView({ behavior: "smooth" }), 80);
}

function checkCatParam() {
  const cat = new URLSearchParams(window.location.search).get("cat");
  if (cat && CATEGORIES[cat]) { currentFilter = cat; renderFilterBar(); renderProducts(); }
}

// ── WISHLIST ──
function toggleWishlist(e, btn) {
  e.stopPropagation();
  const active = btn.textContent === "♥";
  btn.textContent = active ? "♡" : "♥";
  btn.style.color = active ? "" : "#c0392b";
  showNotification(active ? "Retiré des favoris" : "✓ Ajouté aux favoris");
}

// ── CART ──
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

function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  if (isOutOfStock(p)) { showNotification(`⚠ ${p.name} est en rupture de stock`); return; }
  const existing = cart.find(c => c.id === id);
  const stock = getStock(p);
  if (existing) {
    if (stock !== null && existing.qty + 1 > stock) { showNotification(`⚠ Stock maximum atteint (${stock})`); return; }
    existing.qty++;
  } else cart.push({ id, name: p.name, price: p.price, qty: 1 });
  localStorage.setItem("wm_cart", JSON.stringify(cart));
  updateCartUI();
  showNotification(`✓ ${p.name} ajouté au panier`);
}
function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  localStorage.setItem("wm_cart", JSON.stringify(cart));
  updateCartUI();
}
function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  localStorage.setItem("wm_cart", JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI() {
  const count = cart.reduce((s, c) => s + c.qty, 0);
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  document.getElementById("cartCount").textContent = count;
  const items  = document.getElementById("cartItems");
  const footer = document.getElementById("cartFooter");
  if (!cart.length) {
    items.innerHTML = '<p class="cart-empty">Votre panier est vide</p>';
    footer.style.display = "none";
    return;
  }
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

function order() {
  if (!cart.length) return;
  const lines = cart.map(c => `• ${c.name} x${c.qty} = ${(c.price * c.qty).toFixed(3)} DT`).join("\n");
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const msg = `🛍 Bonjour WM Jewelry!\n\nJe souhaite commander:\n${lines}\n\n💰 Total: ${total.toFixed(3)} DT\n\nMerci!`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
}

// ── CONTACT FORM ──
function submitForm(e) {
  e.preventDefault();
  const inputs = e.target.querySelectorAll("input, textarea");
  const waMsg = `Bonjour WM Jewelry!\n\nNom: ${inputs[0].value}\nTél: ${inputs[1].value}\n\n${inputs[2].value}`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMsg)}`, "_blank");
  showNotification("✓ Message envoyé via WhatsApp!");
  e.target.reset();
}

// ── NOTIFICATION ──
function showNotification(msg) {
  const n = document.getElementById("notification");
  n.textContent = msg;
  n.classList.add("show");
  setTimeout(() => n.classList.remove("show"), 3000);
}