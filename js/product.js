// ── WM JEWELRY — product.js (page détail) ──

const WA_NUMBER = "21627820895";
let cart = [];
let currentProduct = null;
let selectedQty    = 1;
let pdImages       = [];  // galerie d'images du produit affiché
let pdImgIndex     = 0;   // index de l'image actuellement affichée en grand

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

  recordView(p.id);
  renderProduct(p);
  renderRelated(p);
  renderReviewsSection(p);
  initImageZoomHover();
}

function renderProduct(p) {
  pdImages   = getImages(p);
  pdImgIndex = 0;
  const hasImg = pdImages.length > 0;
  const imgHtml = hasImg
    ? `<img src="${pdImages[0]}" alt="${p.name}" class="pd-main-img" id="pdMainImg"
         onerror="this.outerHTML='<div class=pd-emoji-img>${p.emoji}</div>'">`
    : `<div class="pd-emoji-img">${p.emoji}</div>`;

  const outOfStock = isOutOfStock(p);
  const lowStock    = isLowStock(p);
  const stock       = getStock(p);

  let stockStatusHtml = "";
  if (outOfStock)      stockStatusHtml = `<div class="pd-stock-status pd-stock-out"><span>●</span> Rupture de stock</div>`;
  else if (lowStock)    stockStatusHtml = `<div class="pd-stock-status pd-stock-low"><span>●</span> Plus que ${stock} en stock</div>`;
  else if (stock !== null) stockStatusHtml = `<div class="pd-stock-status pd-stock-ok"><span>●</span> En stock</div>`;

  const thumbsHtml = hasImg
    ? pdImages.map((img, i) => `
        <div class="pd-thumb${i===0?' active':''}" onclick="switchMainImage(${i})">
          <img src="${img}" alt="${p.name} — photo ${i+1}">
        </div>`).join("")
    : `<div class="pd-thumb active"><span>${p.emoji}</span></div>`;

  document.getElementById("productPage").innerHTML = `
    <div class="pd-layout">
      <div class="pd-left">
        <div class="pd-img-main${outOfStock?' pd-img-dimmed':''}${hasImg?' pd-zoomable':''}" id="pdImgMain" ${hasImg?'onclick="openImageLightbox()"':''}>
          ${imgHtml}
          ${hasImg ? '<span class="pd-zoom-hint">🔍 Cliquer pour zoomer</span>' : ''}
          ${outOfStock ? '<span class="pd-badge-out">Rupture de stock</span>' : (p.isNew ? '<span class="pd-badge-new">NOUVEAU</span>' : "")}
          ${p.featured ? '<span class="pd-badge-feat">⭐ Vedette</span>'  : ""}
        </div>
        <div class="pd-thumbs">
          ${thumbsHtml}
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
        <div class="pd-meta-row">
          ${renderRatingStars(p.id, "lg")}
          <span class="pd-views">👁 ${getViews(p.id)} vue${getViews(p.id)>1?'s':''}</span>
        </div>
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
        ${getMainImage(r)
          ? `<img src="${getMainImage(r)}" alt="${r.name}" loading="lazy"
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

// ── GALERIE — changer l'image principale via une miniature ──
function switchMainImage(i) {
  if (!pdImages[i]) return;
  pdImgIndex = i;
  const img = document.getElementById("pdMainImg");
  if (img) img.src = pdImages[i];
  document.querySelectorAll(".pd-thumb").forEach((el, idx) => el.classList.toggle("active", idx === i));
}

// ── ZOOM IMAGE ──
function initImageZoomHover() {
  const wrap = document.getElementById("pdImgMain");
  const img  = document.getElementById("pdMainImg");
  if (!wrap || !img) return;
  if (!window.matchMedia("(hover: hover)").matches) return; // pas de survol sur mobile/tactile
  wrap.addEventListener("mousemove", e => {
    const rect = wrap.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width)  * 100;
    const y = ((e.clientY - rect.top)  / rect.height) * 100;
    img.style.transformOrigin = `${x}% ${y}%`;
    img.style.transform = "scale(1.8)";
  });
  wrap.addEventListener("mouseleave", () => { img.style.transform = "scale(1)"; });
}

function openImageLightbox() {
  if (!pdImages.length) return;
  const multi = pdImages.length > 1;
  let lb = document.getElementById("imgLightbox");
  if (!lb) {
    lb = document.createElement("div");
    lb.id = "imgLightbox";
    lb.className = "img-lightbox";
    lb.innerHTML = `
      <button class="lightbox-close" onclick="closeImageLightbox()" aria-label="Fermer">×</button>
      ${multi ? `<button class="lightbox-nav lightbox-prev" onclick="lightboxNav(-1)" aria-label="Image précédente">‹</button>` : ""}
      <img id="lightboxImg" src="" alt="">
      ${multi ? `<button class="lightbox-nav lightbox-next" onclick="lightboxNav(1)" aria-label="Image suivante">›</button>` : ""}`;
    lb.addEventListener("click", e => { if (e.target === lb) closeImageLightbox(); });
    document.addEventListener("keydown", e => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape")     closeImageLightbox();
      if (e.key === "ArrowLeft")  lightboxNav(-1);
      if (e.key === "ArrowRight") lightboxNav(1);
    });
    document.body.appendChild(lb);
  }
  document.getElementById("lightboxImg").src = pdImages[pdImgIndex];
  requestAnimationFrame(() => lb.classList.add("open"));
  document.body.style.overflow = "hidden";
}
function lightboxNav(delta) {
  if (pdImages.length < 2) return;
  pdImgIndex = (pdImgIndex + delta + pdImages.length) % pdImages.length;
  document.getElementById("lightboxImg").src = pdImages[pdImgIndex];
  switchMainImage(pdImgIndex);
}
function closeImageLightbox() {
  const lb = document.getElementById("imgLightbox");
  if (lb) lb.classList.remove("open");
  document.body.style.overflow = "";
}

// ── AVIS CLIENTS ──
let selectedReviewRating = 5;

function renderReviewsSection(p) {
  const section = document.getElementById("reviewsSection");
  if (!section) return;

  const approved = getProductReviews(p.id, true);
  const avg      = getAverageRating(p.id);

  const summaryHtml = avg !== null
    ? `<div class="reviews-summary">${renderRatingStars(p.id, "lg")}<span class="reviews-summary-text">basé sur ${approved.length} avis</span></div>`
    : `<div class="reviews-summary reviews-summary-empty">Aucun avis pour le moment — soyez le premier à donner votre avis !</div>`;

  const listHtml = approved.length
    ? approved.map(r => `
      <div class="review-card">
        <div class="review-head">
          <span class="review-name">${escapeHtml(r.name)}</span>
          <span class="review-stars">${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</span>
        </div>
        <div class="review-date">${new Date(r.date).toLocaleDateString("fr-FR", {day:"numeric",month:"long",year:"numeric"})}</div>
        ${r.comment ? `<p class="review-comment">${escapeHtml(r.comment)}</p>` : ""}
      </div>`).join("")
    : "";

  section.innerHTML = `
    <div class="reviews-inner">
      <div class="section-header">
        <p class="section-eyebrow">Avis clients</p>
        <h2>Ce qu'ils en pensent</h2>
      </div>
      ${summaryHtml}
      <div class="reviews-list">${listHtml}</div>

      <div class="review-form-box">
        <h3>Laisser un avis</h3>
        <div class="review-star-picker" id="reviewStarPicker">
          ${[1,2,3,4,5].map(n => `<span class="rsp-star" data-n="${n}" onclick="selectReviewRating(${n})">★</span>`).join("")}
        </div>
        <input type="text" id="reviewName" class="review-input" placeholder="Votre nom" maxlength="60">
        <textarea id="reviewComment" class="review-input" rows="3" placeholder="Votre commentaire (optionnel)" maxlength="500"></textarea>
        <button class="review-submit-btn" onclick="submitReview(${p.id})">Envoyer mon avis</button>
        <p class="review-note">Votre avis sera publié après validation par notre équipe.</p>
      </div>
    </div>`;

  selectedReviewRating = 5;
  updateStarPicker();
}

function selectReviewRating(n) {
  selectedReviewRating = n;
  updateStarPicker();
}
function updateStarPicker() {
  document.querySelectorAll("#reviewStarPicker .rsp-star").forEach(el => {
    el.classList.toggle("sel", parseInt(el.dataset.n, 10) <= selectedReviewRating);
  });
}

async function submitReview(productId) {
  const name    = document.getElementById("reviewName").value.trim();
  const comment = document.getElementById("reviewComment").value.trim();
  if (!name) { showNotification("⚠ Merci d'indiquer votre nom"); return; }

  const btn = document.querySelector(".review-submit-btn");
  if (btn) { btn.disabled = true; btn.textContent = "Envoi..."; }

  await addReview({ productId, name, rating: selectedReviewRating, comment });

  if (btn) { btn.disabled = false; btn.textContent = "Envoyer mon avis"; }
  document.getElementById("reviewName").value = "";
  document.getElementById("reviewComment").value = "";
  selectedReviewRating = 5;
  updateStarPicker();
  showNotification("✓ Merci ! Votre avis sera publié après validation.");
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
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