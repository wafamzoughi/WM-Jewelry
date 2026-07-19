# WM JEWELRY — Site Web Complet

## Structure des fichiers

```
wm-jewelry/
├── index.html              ← Boutique (visible par tous)
├── css/
│   └── style.css           ← Style de la boutique
├── js/
│   ├── products.js         ← Données produits (partagées)
│   └── main.js             ← Logique boutique
└── admin/
    ├── index.html          ← Page de connexion admin (protégée)
    ├── dashboard.html      ← Tableau de bord admin
    ├── css/
    │   └── admin.css       ← Style admin
    └── js/
        ├── auth.js         ← Identifiants admin
        └── dashboard.js    ← Logique admin
```

## Accès

| Page | URL | Accès |
|------|-----|-------|
| Boutique | `index.html` | Public (tous les visiteurs) |
| Admin Login | `admin/index.html` | Mot de passe requis |
| Dashboard Admin | `admin/dashboard.html` | Admin uniquement |

## Identifiants par défaut

- **Utilisateur** : `admin`
- **Mot de passe** : `wm2025`

> ⚠️ Changez ces identifiants dans `admin/js/auth.js` avant de mettre en ligne !

## Configuration

### 1. Numéro WhatsApp
Dans `js/main.js`, ligne 3 :
```js
const WA_NUMBER = "21627820895"; // ← Votre vrai numéro
```

### 2. Identifiants admin
Dans `admin/js/auth.js` :
```js
const ADMIN_CREDENTIALS = {
  username: "admin",   // ← Changez
  password: "wm2025"  // ← Changez
};
```

## Hébergement gratuit

### Option 1 : Netlify (recommandé)
1. Allez sur [netlify.com](https://netlify.com)
2. Glissez-déposez le dossier `wm-jewelry`
3. Votre site est en ligne en 30 secondes !

### Option 2 : GitHub Pages
1. Créez un repo GitHub
2. Uploadez les fichiers
3. Activez GitHub Pages dans les Settings

## Fonctionnalités

### Boutique (index.html)
- ✅ Logo WM Jewelry SVG professionnel
- ✅ Hero section avec design sombre et doré
- ✅ Barre de catégories dynamique
- ✅ Grille de produits avec filtres
- ✅ Badges "Nouveau" et "Vedette"
- ✅ Favoris (wishlist)
- ✅ Panier latéral avec quantités
- ✅ Commande via WhatsApp
- ✅ Formulaire de contact WhatsApp
- ✅ Responsive mobile

### Admin (admin/)
- ✅ Page de connexion sécurisée
- ✅ Tableau de bord avec statistiques
- ✅ Ajouter des articles avec aperçu live
- ✅ Modifier les articles existants
- ✅ Supprimer des articles
- ✅ Recherche et filtrage
- ✅ Graphique de répartition catégories
- ✅ Persistance via localStorage

## Note sécurité

L'authentification actuelle est basée sur JavaScript côté client.
Pour une sécurité maximale en production, utilisez un backend (PHP/Node.js) avec une vraie base de données.
