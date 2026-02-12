"use strict";

const API = "http://localhost:3000";

// keys consistentes con tu login.html
const TOKEN_KEY = "doggie_token";
const USER_EMAIL_KEY = "doggie_userEmail";
const EMAIL_VERIFIED_KEY = "doggie_emailVerified";

function $(id) { return document.getElementById(id); }

function setLoggedOutUI() {
  const btnGoLogin = $("btnGoLogin");
  const authUser = $("authUser");
  if (btnGoLogin) btnGoLogin.hidden = false;
  if (authUser) authUser.hidden = true;
}

function setLoggedInUI(nameOrEmail) {
  const btnGoLogin = $("btnGoLogin");
  const authUser = $("authUser");
  const authName = $("authName");

  if (btnGoLogin) btnGoLogin.hidden = true;
  if (authUser) authUser.hidden = false;
  if (authName) authName.textContent = `Hola, ${nameOrEmail || "Usuario"}`;
}

async function fetchMe(token) {
  const r = await fetch(`${API}/me`, {
    headers: { "Authorization": "Bearer " + token }
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "No autorizado");
  return data.user;
}

async function logoutServer(token) {
  // Para “sesión” en la rúbrica: el backend responde OK y el cliente borra token
  await fetch(`${API}/logout`, {
    method: "POST",
    headers: { "Authorization": "Bearer " + token }
  }).catch(() => {});
}

(async function initAuthHeader(){
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    setLoggedOutUI();
    return;
  }

  try {
    const me = await fetchMe(token);
    localStorage.setItem(USER_EMAIL_KEY, me.email || "");
    setLoggedInUI(me.name || me.email || "Usuario");
  } catch (e) {
    // token inválido/expirado
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
    localStorage.removeItem(EMAIL_VERIFIED_KEY);
    setLoggedOutUI();
  }
})();

// botón salir
$("btnLogout")?.addEventListener("click", async () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) await logoutServer(token);

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
  localStorage.removeItem(EMAIL_VERIFIED_KEY);
  location.href = "login.html";
});
