// ── WM JEWELRY — dashboard.js ──

// ── CLOUDINARY CONFIG (images) ──
const CLOUDINARY_CLOUD_NAME    = "nl0vbeqm";
const CLOUDINARY_UPLOAD_PRESET = "wm_jewelry_products"; // preset "Unsigned" dans Cloudinary
const CLOUDINARY_UPLOAD_URL    = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const EMOJIS = ["💍","📿","⌚","💎","🪙","🌸","⭐","🦋","🌙","🔮","✨","🎀","💄","👑","🌺","🍀","🪷","💐","🌟","🏅"];
let editingId           = null;
let selectedEmoji       = "💍";
let selectedImageBase64 = null;
let selectedImageUrl    = null;
let isUploadingImage    = false;

// ── INIT ──
document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth()) return;

  showAdminLoader(true);
  await loadProducts(); // charge depuis JSONBin
  showAdminLoader(false);

  buildEmojiGrid();
  populateCatFilter();
  renderDashboard();
  initLivePreview();
  initImageUpload();

  // Vérifier config JSONBin
  checkJsonBinConfig();
});

function showAdminLoader(show) {
  let loader = document.getElementById("adminLoader");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "adminLoader";
    loader.style.cssText = `position:fixed;inset:0;background:rgba(250,247,240,0.9);z-index:999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;font-family:Outfit,sans-serif;color:#6B6355`;
    loader.innerHTML = `<div style="width:36px;height:36px;border:2px solid #EDE8DF;border-top-color:#B8902A;border-radius:50%;animation:spin .8s linear infinite"></div><style>@keyframes spin{to{transform:rotate(360deg)}}</style><span>Chargement des produits...</span>`;
    document.body.appendChild(loader);
  }
  loader.style.display = show ? "flex" : "none";
}

function checkJsonBinConfig() {
  // Lire la config depuis products.js
  if (typeof JSONBIN_BIN_ID === "undefined" || JSONBIN_BIN_ID === "VOTRE_BIN_ID_ICI") {
    showBanner("warning",
      "⚠️ <strong>JSONBin non configuré</strong> — Les produits ne seront pas partagés entre appareils. " +
      "<a href='https://jsonbin.io' target='_blank' style='color:#FFD700'>Créer un Bin gratuit →</a>"
    );
  }
}

function showBanner(type, html) {
  const colors = { warning: "#7C5E18", error: "#7C1C1C", success: "#166534" };
  const b = document.createElement("div");
  b.style.cssText = `position:fixed;top:0;left:0;right:0;z-index:9999;background:${colors[type]||colors.warning};color:white;padding:10px 16px;font-size:13px;display:flex;align-items:center;gap:12px`;
  b.innerHTML = `<span>${html}</span><button onclick="this.parentNode.remove()" style="background:none;border:none;color:white;font-size:20px;cursor:pointer;margin-left:auto">×</button>`;
  document.body.prepend(b);
}

// ── SECTIONS ──
function showSection(name) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  document.getElementById(`sec-${name}`).classList.add("active");
  const map = {dashboard:"Tableau de bord",products:"Articles",add:"Ajouter / Modifier",categories:"Catégories"};
  document.getElementById("topbarTitle").textContent = map[name] || name;
  document.querySelectorAll(".nav-item")[["dashboard","products","add","categories"].indexOf(name)]?.classList.add("active");
  if (name === "dashboard")  renderDashboard();
  if (name === "products")   renderProductsTable();
  if (name === "categories") renderCatList();
  if (name === "add" && !editingId) { clearForm(); document.getElementById("formTitle").textContent = "➕ Nouvel Article"; }
}

// ── DASHBOARD ──
function renderDashboard() {
  const withImg    = products.filter(p => p.image).length;
  const outOfStock = products.filter(p => isOutOfStock(p)).length;
  const lowStock    = products.filter(p => isLowStock(p)).length;
  document.getElementById("statsGrid").innerHTML = `
    <div class="stat-card"><div class="stat-icon">💎</div><div class="stat-num">${products.length}</div><div class="stat-label">Total articles</div></div>
    <div class="stat-card"><div class="stat-icon">🖼️</div><div class="stat-num">${withImg}</div><div class="stat-label">Avec photo</div></div>
    <div class="stat-card"><div class="stat-icon">🆕</div><div class="stat-num">${products.filter(p=>p.isNew).length}</div><div class="stat-label">Nouveautés</div></div>
    <div class="stat-card"><div class="stat-icon">⭐</div><div class="stat-num">${products.filter(p=>p.featured).length}</div><div class="stat-label">Vedettes</div></div>
    <div class="stat-card${outOfStock?' stat-card-danger':''}"><div class="stat-icon">🚫</div><div class="stat-num">${outOfStock}</div><div class="stat-label">Rupture de stock</div></div>
    <div class="stat-card${lowStock?' stat-card-warning':''}"><div class="stat-icon">⚠️</div><div class="stat-num">${lowStock}</div><div class="stat-label">Stock faible</div></div>
    <div class="stat-card"><div class="stat-icon">🗂️</div><div class="stat-num">${[...new Set(products.map(p=>p.cat))].length}</div><div class="stat-label">Catégories</div></div>
  `;
  document.getElementById("recentProducts").innerHTML = [...products].reverse().slice(0,6).map(p => `
    <div class="recent-item">
      <div class="recent-thumb">${p.image?`<img src="${p.image}" alt="${p.name}" onerror="this.outerHTML='<span>${p.emoji}</span>'">`:`<span>${p.emoji}</span>`}</div>
      <div class="recent-info"><div class="recent-name">${p.name}</div><div class="recent-cat">${CATEGORIES[p.cat]||p.cat}</div></div>
      <div class="recent-price">${p.price.toFixed(3)} DT</div>
    </div>`).join("");
  renderCatChart();
}

function renderCatChart() {
  const usedCats = [...new Set(products.map(p => p.cat))];
  const max = Math.max(...usedCats.map(c => products.filter(p=>p.cat===c).length), 1);
  document.getElementById("catChart").innerHTML = usedCats.map(cat => {
    const count = products.filter(p => p.cat === cat).length;
    return `<div class="cat-bar-item">
      <div class="cat-bar-label">${CAT_ICONS[cat]||""} ${CATEGORIES[cat]||cat}</div>
      <div class="cat-bar-track"><div class="cat-bar-fill" style="width:${Math.round(count/max*100)}%"></div></div>
      <div class="cat-bar-count">${count}</div>
    </div>`;
  }).join("") || `<div class="no-data"><p>Aucune donnée</p></div>`;
}

// ── PRODUCTS TABLE ──
function renderProductsTable() {
  const search    = (document.getElementById("searchInput")?.value||"").toLowerCase();
  const filterCat = document.getElementById("filterCat")?.value||"";
  const filtered  = products.filter(p =>
    (!search    || p.name.toLowerCase().includes(search) || (p.desc||"").toLowerCase().includes(search)) &&
    (!filterCat || p.cat === filterCat)
  );
  const tbody = document.getElementById("productsTableBody");
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="no-data"><div class="no-data-icon">🔍</div><p>Aucun article trouvé</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = filtered.map(p => {
    const stock = getStock(p);
    return `
    <tr>
      <td>
        <div class="td-name">
          <div class="td-thumb">
            ${p.image
              ? `<img src="${p.image}" alt="${p.name}" onerror="this.style.display='none';this.nextSibling.style.display='flex'">
                 <span class="td-emoji-fallback" style="display:none">${p.emoji}</span>`
              : `<span class="td-emoji-fallback">${p.emoji}</span>`
            }
          </div>
          <div class="td-info">
            <div class="name">${p.name}
              ${p.isNew    ? '<span class="badge badge-new">NOUVEAU</span>' : ""}
              ${p.featured ? '<span class="badge badge-feat">⭐</span>'     : ""}
              ${!p.image   ? '<span class="badge" style="background:#FEF3C7;color:#92400E">Sans photo</span>' : ""}
              ${isOutOfStock(p) ? '<span class="badge badge-outofstock">Rupture</span>' : ""}
              ${isLowStock(p)   ? '<span class="badge badge-lowstock">Stock faible</span>' : ""}
            </div>
            <div class="desc">${p.desc||"—"}</div>
          </div>
        </div>
      </td>
      <td><span class="cat-pill">${CATEGORIES[p.cat]||p.cat}</span></td>
      <td class="price-cell">${p.price.toFixed(3)} DT</td>
      <td>
        <div class="stock-cell">
          <button class="stock-step" onclick="adjustStock(${p.id},-1)" title="Retirer 1">−</button>
          <span class="stock-val ${stock===null?"":isOutOfStock(p)?"stock-zero":isLowStock(p)?"stock-low":"stock-ok"}"
                onclick="editStock(${p.id})" title="Cliquer pour saisir une valeur">${stock===null?"—":stock}</span>
          <button class="stock-step" onclick="adjustStock(${p.id},1)" title="Ajouter 1">+</button>
        </div>
      </td>
      <td>${p.featured?'<span class="cat-pill">Vedette</span>':"<span style='color:var(--gray);font-size:12px'>Normal</span>"}</td>
      <td>
        <div class="actions">
          <button class="btn-edit" onclick="editProduct(${p.id})">✏ Modifier</button>
          <button class="btn-del"  onclick="deleteProduct(${p.id})">✕ Supprimer</button>
        </div>
      </td>
    </tr>`;
  }).join("");
}

// ── AJUSTEMENT RAPIDE DU STOCK (depuis la liste) ──
async function adjustStock(id, delta) {
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return;
  const current = getStock(products[idx]);
  const base = current === null ? 0 : current;
  const next = Math.max(0, base + delta);
  products[idx] = { ...products[idx], stock: next };
  renderProductsTable(); renderDashboard();
  const ok = await saveProducts(products);
  if (!ok) toast("⚠ Stock mis à jour localement — JSONBin non configuré", "error");
}

function editStock(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const current = getStock(p);
  const input = prompt(`Nouvelle quantité en stock pour "${p.name}" :`, current===null?0:current);
  if (input === null) return;
  const val = parseInt(input, 10);
  if (isNaN(val) || val < 0) { toast("⚠ Valeur de stock invalide", "error"); return; }
  const idx = products.findIndex(x => x.id === id);
  products[idx] = { ...products[idx], stock: val };
  renderProductsTable(); renderDashboard();
  saveProducts(products).then(ok => {
    if (ok) toast("✓ Stock mis à jour");
    else    toast("⚠ Stock mis à jour localement — JSONBin non configuré", "error");
  });
}

function populateCatFilter() {
  const sel = document.getElementById("filterCat");
  if (!sel) return;
  sel.innerHTML = `<option value="">Toutes catégories</option>` +
    [...new Set(products.map(p=>p.cat))].map(c=>`<option value="${c}">${CATEGORIES[c]||c}</option>`).join("");
}

// ── IMAGE UPLOAD vers CLOUDINARY ──
function initImageUpload() {
  const dropZone  = document.getElementById("dropZone");
  const fileInput = document.getElementById("fImage");
  if (!dropZone||!fileInput) return;
  dropZone.addEventListener("click", ()=>fileInput.click());
  dropZone.addEventListener("dragover",  e=>{e.preventDefault();dropZone.classList.add("drag-over");});
  dropZone.addEventListener("dragleave", ()=>dropZone.classList.remove("drag-over"));
  dropZone.addEventListener("drop", e=>{e.preventDefault();dropZone.classList.remove("drag-over");const f=e.dataTransfer.files[0];if(f)processImageFile(f);});
  fileInput.addEventListener("change", ()=>{const f=fileInput.files[0];if(f)processImageFile(f);});
}

function processImageFile(file) {
  if (!file.type.startsWith("image/")) { toast("⚠ Image uniquement (JPG, PNG, WEBP)", "error"); return; }
  if (file.size > 10*1024*1024)        { toast("⚠ Image trop lourde (max 10 Mo)",    "error"); return; }

  const reader = new FileReader();
  reader.onload = e => {
    resizeImage(e.target.result, 1200, 1200, compressed => {
      selectedImageBase64 = compressed;
      selectedImageUrl    = null;
      isUploadingImage    = true;
      showImagePreview(compressed, true);
      updatePreview();
      uploadToCloudinary(file);
    });
  };
  reader.readAsDataURL(file);
}

function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  fd.append("folder", "wm-jewelry");

  fetch(CLOUDINARY_UPLOAD_URL, { method:"POST", body:fd })
    .then(r => r.json())
    .then(data => {
      if (!data.secure_url) throw new Error(data.error?.message || "Pas d'URL");
      selectedImageUrl    = data.secure_url;
      isUploadingImage    = false;
      showImagePreview(data.secure_url, false);
      updatePreview();
      toast("✓ Image uploadée sur Cloudinary !");
    })
    .catch(err => {
      console.error("❌ Cloudinary:", err);
      isUploadingImage = false;
      // Fallback : garder le base64 (fonctionnera mais plus lourd)
      selectedImageUrl = selectedImageBase64;
      showImagePreview(selectedImageBase64, false);
      toast("⚠ Cloudinary indisponible — image sauvegardée en base64", "error");
    });
}

function resizeImage(src, maxW, maxH, cb) {
  const img = new Image();
  img.onload = () => {
    let w=img.width, h=img.height;
    if(w>maxW||h>maxH){const r=Math.min(maxW/w,maxH/h);w=Math.round(w*r);h=Math.round(h*r);}
    const c=document.createElement("canvas"); c.width=w; c.height=h;
    c.getContext("2d").drawImage(img,0,0,w,h);
    cb(c.toDataURL("image/jpeg",0.85));
  };
  img.src=src;
}

function showImagePreview(src, uploading) {
  document.getElementById("dropZone").innerHTML = `
    <div class="img-preview-wrap">
      <img src="${src}" alt="Aperçu" class="img-preview-thumb">
      <div class="img-preview-actions">
        <span class="img-preview-ok">
          ${uploading
            ? `<span style="color:#B45309">⏳ Upload en cours...</span>`
            : `<span style="color:#166534">✓ Image prête</span>`}
        </span>
        ${uploading
          ? `<div style="width:100%;height:3px;background:#EDE8DF;border-radius:2px;margin-top:6px;overflow:hidden"><div style="height:100%;background:#B8902A;border-radius:2px;animation:progress 1.5s ease-in-out infinite"></div></div><style>@keyframes progress{0%{width:0}100%{width:100%}}</style>`
          : `<button type="button" class="img-remove-btn" onclick="removeImage(event)">✕ Changer</button>`}
      </div>
    </div>`;
}

function removeImage(e) {
  e.stopPropagation();
  selectedImageBase64=null; selectedImageUrl=null; isUploadingImage=false;
  document.getElementById("fImage").value="";
  resetDropZone(); updatePreview();
}

function resetDropZone() {
  document.getElementById("dropZone").innerHTML=`
    <div class="drop-inner">
      <div class="drop-icon">🖼️</div>
      <div class="drop-text">Glissez une image ici<br><span>ou cliquez pour choisir</span></div>
      <div class="drop-hint">JPG, PNG, WEBP — max 10 Mo</div>
    </div>`;
}

// ── EMOJI ──
function buildEmojiGrid() {
  const grid=document.getElementById("emojiGrid"); if(!grid) return;
  grid.innerHTML=EMOJIS.map(em=>`<div class="emoji-opt ${em===selectedEmoji?"sel":""}" data-em="${em}" onclick="selectEmoji('${em}')">${em}</div>`).join("");
}
function selectEmoji(em) {
  selectedEmoji=em;
  document.querySelectorAll(".emoji-opt").forEach(el=>el.classList.toggle("sel",el.dataset.em===em));
  updatePreview();
}

// ── LIVE PREVIEW ──
function initLivePreview() {
  ["fName","fPrice","fCat"].forEach(id=>{
    const el=document.getElementById(id);
    if(el){el.addEventListener("input",updatePreview);el.addEventListener("change",updatePreview);}
  });
}

function updatePreview() {
  const name  = document.getElementById("fName")?.value  || "Nom de l'article";
  const price = parseFloat(document.getElementById("fPrice")?.value)||0;
  const cat   = document.getElementById("fCat")?.value||"";
  const pvImg=document.getElementById("pvImg"), pvEmoji=document.getElementById("pvEmoji");
  const imgSrc=selectedImageUrl||selectedImageBase64;
  if(imgSrc){pvImg.src=imgSrc;pvImg.style.display="block";pvEmoji.style.display="none";}
  else{pvImg.style.display="none";pvEmoji.style.display="block";pvEmoji.textContent=selectedEmoji;}
  document.getElementById("pvName").textContent  = name;
  document.getElementById("pvPrice").textContent = price.toFixed(3)+" DT";
  document.getElementById("pvCat").textContent   = CATEGORIES[cat]||"Catégorie";
}

// ── CLEAR FORM ──
function clearForm() {
  ["fName","fPrice","fDesc"].forEach(id=>{const el=document.getElementById(id);if(el)el.value="";});
  document.getElementById("fStock").value="0";
  document.getElementById("fCat").value="boucles";
  document.getElementById("fFeatured").value="false";
  document.getElementById("fNew").value="false";
  document.getElementById("fImage").value="";
  selectedEmoji=selectedImageBase64=selectedImageUrl=null; isUploadingImage=false; editingId=null;
  selectedEmoji="💍";
  buildEmojiGrid(); resetDropZone(); updatePreview();
}
function cancelEdit(){clearForm();showSection("products");}

// ── SAVE (async) ──
async function saveProduct() {
  const name     = document.getElementById("fName").value.trim();
  const price    = parseFloat(document.getElementById("fPrice").value);
  const stock    = parseInt(document.getElementById("fStock").value, 10);
  const cat      = document.getElementById("fCat").value;
  const desc     = document.getElementById("fDesc").value.trim();
  const featured = document.getElementById("fFeatured").value==="true";
  const isNew    = document.getElementById("fNew").value==="true";

  if (!name)                     {toast("⚠ Saisir le nom","error");return;}
  if (isNaN(price)||price<0)     {toast("⚠ Prix invalide","error");return;}
  if (isNaN(stock)||stock<0)     {toast("⚠ Stock invalide","error");return;}
  if (isUploadingImage)          {toast("⏳ Attendez la fin de l'upload","error");return;}

  const imageToSave = selectedImageUrl || selectedImageBase64 || null;
  const productData = {name,price,stock,cat,emoji:selectedEmoji,image:imageToSave,desc,featured,isNew};

  if (editingId) {
    const idx=products.findIndex(p=>p.id===editingId);
    if(idx!==-1) products[idx]={id:editingId,...productData};
  } else {
    products.push({id:nextId++,...productData});
  }

  // Afficher spinner pendant la sauvegarde
  const btn = document.querySelector(".form-actions .btn-gold");
  if(btn){btn.textContent="⏳ Enregistrement...";btn.disabled=true;}

  const ok = await saveProducts(products);

  if(btn){btn.textContent="💾 Enregistrer l'article";btn.disabled=false;}

  if(ok) toast("✓ Article enregistré et visible par tous !");
  else   toast("⚠ Sauvegardé localement — JSONBin non configuré","error");

  editingId=null; clearForm(); showSection("products"); populateCatFilter();
}

// ── EDIT / DELETE ──
function editProduct(id) {
  const p=products.find(x=>x.id===id); if(!p) return;
  editingId=id; selectedEmoji=p.emoji||"💍";
  selectedImageBase64=null; selectedImageUrl=p.image||null; isUploadingImage=false;
  document.getElementById("fName").value    =p.name;
  document.getElementById("fPrice").value   =p.price;
  document.getElementById("fStock").value   =getStock(p)===null?0:p.stock;
  document.getElementById("fCat").value     =p.cat;
  document.getElementById("fDesc").value    =p.desc||"";
  document.getElementById("fFeatured").value=p.featured?"true":"false";
  document.getElementById("fNew").value     =p.isNew?"true":"false";
  buildEmojiGrid();
  if(p.image) showImagePreview(p.image,false); else resetDropZone();
  document.getElementById("formTitle").textContent="✏ Modifier l'Article";
  updatePreview(); showSection("add");
}

async function deleteProduct(id) {
  const p=products.find(x=>x.id===id); if(!p) return;
  if(!confirm(`Supprimer "${p.name}" ?`)) return;
  products=products.filter(x=>x.id!==id);
  await saveProducts(products);
  renderProductsTable(); renderDashboard(); populateCatFilter();
  toast(`✓ "${p.name}" supprimé`);
}

// ── CATEGORIES ──
function renderCatList() {
  document.getElementById("catList").innerHTML=Object.entries(CATEGORIES).map(([key,label])=>{
    const count=products.filter(p=>p.cat===key).length;
    return `<div class="cat-list-item">
      <div class="cat-list-left">
        <div class="cat-list-icon">${CAT_ICONS[key]||"✦"}</div>
        <div><div class="cat-list-name">${label}</div><div class="cat-list-count">${count} article${count!==1?"s":""}</div></div>
      </div>
      <span class="cat-count-badge">${count}</span>
    </div>`;
  }).join("");
}

// ── TOAST ──
function toast(msg, type) {
  const t=document.getElementById("toast");
  t.textContent=msg; t.style.background=type==="error"?"#B91C1C":"#1A1209";
  t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),4000);
}