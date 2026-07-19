// ── WM JEWELRY — products.js ──
// Stockage : JSONBin.io (gratuit, partagé entre tous les appareils)
// Images   : Cloudinary

const CATEGORIES = {
  boucles:   "Boucles d'oreilles",
  colliers:  "Colliers",
  bracelets: "Bracelets",
  bagues:    "Bagues",
  montres:   "Montres",
  cheveux:   "Accessoires cheveux",
  pinces:    "Pinces & Barrettes",
  bondes:    "Bandes & Élastiques",
  autres:    "Autres"
};

const CAT_ICONS = {
  boucles:"💎", colliers:"📿", bracelets:"💍", bagues:"🪙",
  montres:"⌚", cheveux:"🌸", pinces:"🦋", bondes:"⭐", autres:"✦"
};

const CAT_IMAGES = {
  boucles:   "images/categories/boucles.jpg",
  colliers:  "images/categories/colliers.jpg",
  bracelets: "images/categories/bracelets.jpg",
  bagues:    "images/categories/bagues.jpg",
  montres:   "images/categories/montres.jpg",
  cheveux:   "images/categories/cheveux.png",
  pinces:    "images/categories/pinces.jpg",
  bondes:    "images/categories/bande.jpg",
  autres:    "images/categories/autres.jpg"
};

// ────────────────────────────────────────────────
// 🔧 CONFIGURATION JSONBin.io
//  1. Créez un compte gratuit sur https://jsonbin.io
//  2. Créez un nouveau Bin avec ce contenu initial :
//     { "products": [], "nextId": 1 }
//  3. Copiez l'ID du Bin et votre clé API ci-dessous
// ────────────────────────────────────────────────
const JSONBIN_BIN_ID  = "6a574397f5f4af5e29916aad";       // ex: 6650a1234abc56def789
const JSONBIN_API_KEY = "$2a$10$NFDB0MCpqGuV8D14mxxTk.8cWKSWLD30x6qWT4SgvVyowlhasP2FK";       // ex: $2a$10$xxxx...
const JSONBIN_URL     = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

// ── SEUIL "STOCK FAIBLE" (affiche un avertissement avant la rupture) ──
const LOW_STOCK_THRESHOLD = 3;

// ── PRODUITS PAR DÉFAUT (affichés si JSONBin non configuré) ──
const DEFAULT_PRODUCTS = [
  {id:1,  name:"Bracelet Doré Élégant",  price:24.900, cat:"bracelets", emoji:"💍", image:null, desc:"Bracelet en acier inoxydable plaqué or 18K, résistant à l'eau, anti-allergie.",       featured:true,  isNew:true,  stock:10},
  {id:2,  name:"Collier Minimaliste",     price:19.500, cat:"colliers",  emoji:"📿", image:null, desc:"Collier fin en acier 316L, longueur ajustable 40–45 cm, fermoir lobster.",            featured:false, isNew:true,  stock:8},
  {id:3,  name:"Boucles Perle Nacrée",   price:14.900, cat:"boucles",   emoji:"💎", image:null, desc:"Boucles d'oreilles avec perle nacrée 8mm, tige en acier inoxydable, légères.",       featured:true,  isNew:false, stock:0},
  {id:4,  name:"Montre Dorée Classique", price:89.000, cat:"montres",   emoji:"⌚", image:null, desc:"Montre avec cadran doré, bracelet acier inoxydable, étanche 30m, mouvement quartz.", featured:false, isNew:false, stock:5},
  {id:5,  name:"Bague Solitaire Zircon", price:16.900, cat:"bagues",    emoji:"🪙", image:null, desc:"Bague fine avec pierre zirconium AAA, disponible tailles 50 à 60.",                  featured:true,  isNew:false, stock:2},
];

// ── HELPERS STOCK ──
// Les anciens produits enregistrés avant cette mise à jour n'ont pas de champ "stock".
// On les considère "stock illimité" (non suivi) pour ne rien casser.
function getStock(p) {
  return (p && p.stock !== undefined && p.stock !== null) ? p.stock : null;
}
function isOutOfStock(p) {
  const s = getStock(p);
  return s !== null && s <= 0;
}
function isLowStock(p) {
  const s = getStock(p);
  return s !== null && s > 0 && s <= LOW_STOCK_THRESHOLD;
}

// ── STATE ──
let products = [];
let nextId   = 1;
let _dbReady = false;  // true quand JSONBin est configuré et chargé

// ── CHARGER LES PRODUITS ──
async function loadProducts() {
  // Si JSONBin pas configuré → produits locaux
  if (!JSONBIN_BIN_ID || JSONBIN_BIN_ID === "VOTRE_BIN_ID_ICI") {
    console.warn("⚠️ JSONBin non configuré — mode local");
    products = DEFAULT_PRODUCTS;
    nextId   = Math.max(...products.map(p => p.id), 0) + 1;
    _dbReady = false;
    return products;
  }

  try {
    const res = await fetch(`${JSONBIN_URL}/latest`, {
      headers: {
        "X-Master-Key": JSONBIN_API_KEY,
        "X-Bin-Meta":   "false"        // retourne directement le JSON sans métadonnées
      }
    });

    if (!res.ok) throw new Error(`JSONBin erreur ${res.status}`);

    const data = await res.json();

    // JSONBin retourne { record: { products, nextId } } ou directement { products, nextId }
    const record = data.record || data;

    if (record.products && Array.isArray(record.products)) {
      products = record.products;
      nextId   = record.nextId || Math.max(...products.map(p => p.id), 0) + 1;
      _dbReady = true;
      console.log(`✅ ${products.length} produits chargés depuis JSONBin`);
    } else {
      // Bin vide ou mal formaté → initialiser
      products = [];
      nextId   = 1;
      _dbReady = true;
      await saveProducts(products);
    }
  } catch (e) {
    console.error("❌ Erreur JSONBin:", e);
    // Fallback localStorage
    const local = localStorage.getItem("wm_products_backup");
    products = local ? JSON.parse(local) : DEFAULT_PRODUCTS;
    nextId   = Math.max(...products.map(p => p.id), 0) + 1;
    _dbReady = false;
  }

  return products;
}

// ── SAUVEGARDER LES PRODUITS ──
async function saveProducts(newProducts) {
  products = newProducts;

  // Toujours sauvegarder en backup localStorage
  localStorage.setItem("wm_products_backup", JSON.stringify(products));

  if (!_dbReady || !JSONBIN_BIN_ID || JSONBIN_BIN_ID === "VOTRE_BIN_ID_ICI") {
    console.warn("⚠️ JSONBin non dispo — sauvegarde locale uniquement");
    return false;
  }

  try {
    const res = await fetch(JSONBIN_URL, {
      method:  "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": JSONBIN_API_KEY
      },
      body: JSON.stringify({
        products: products,
        nextId:   nextId,
        updatedAt: new Date().toISOString()
      })
    });

    if (!res.ok) throw new Error(`JSONBin PUT erreur ${res.status}`);
    console.log("✅ Produits sauvegardés sur JSONBin");
    return true;
  } catch (e) {
    console.error("❌ Erreur sauvegarde JSONBin:", e);
    return false;
  }
}