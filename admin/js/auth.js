// ── WM JEWELRY — auth.js ──
// Modifiez ici vos identifiants admin
// ⚠️ Pour plus de sécurité, utilisez un backend (PHP, Node.js) en production

const ADMIN_CREDENTIALS = {
  username: "admin",      // ← Changez votre identifiant
  password: "wm2025"      // ← Changez votre mot de passe
};

function checkCredentials(user, pass) {
  return user === ADMIN_CREDENTIALS.username && pass === ADMIN_CREDENTIALS.password;
}

function requireAuth() {
  if (sessionStorage.getItem("wm_admin_auth") !== "1") {
    window.location.href = "index.html";
    return false;
  }
  return true;
}

function logout() {
  sessionStorage.removeItem("wm_admin_auth");
  window.location.href = "index.html";
}