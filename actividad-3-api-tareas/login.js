"use strict";

const API = "http://localhost:3000";

const TOKEN_KEY = "doggie_token";
const EMAIL_VERIFIED_KEY = "doggie_emailVerified";

function setStatus(text, isError = false) {
  const el = document.getElementById("msg");
  if (!el) return;
  el.style.color = isError ? "#b00020" : "#0a7a2f";
  el.textContent = text;
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
function setEmailVerifiedFlag(v) {
  localStorage.setItem(EMAIL_VERIFIED_KEY, String(!!v));
}

// 1) Si vienes de Google/Facebook callback: login.html?token=...
(function handleOAuthCallback() {
  const params = new URLSearchParams(location.search);
  const tokenFromCallback = params.get("token");
  if (tokenFromCallback) {
    setToken(tokenFromCallback);
    setEmailVerifiedFlag(true); // OAuth lo tratamos como verificado
    setStatus("Sesión iniciada ");

    //  limpia la URL 
    history.replaceState({}, "", "login.html");

    setTimeout(() => (location.href = "index.html"), 600);
  }
})();

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

async function loginLocal(email, password) {
  const r = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await safeJson(r);
  if (!r.ok) throw new Error(data.error || `Error ${r.status} al iniciar sesión`);

  setToken(data.token);
  setEmailVerifiedFlag(!!data.emailVerified);
  return data;
}

async function registerLocal(email, password) {
  const r = await fetch(`${API}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name: email.split("@")[0] }),
  });

  const data = await safeJson(r);
  if (!r.ok) throw new Error(data.error || `Error ${r.status} al registrar`);
  return data;
}

// 2) Botón Login (DIRECTO)
document.getElementById("btnLogin")?.addEventListener("click", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email")?.value?.trim();
  const password = document.getElementById("password")?.value;

  if (!email || !password) {
    setStatus(" Escribe email y contraseña", true);
    return;
  }

  try {
    setStatus("⏳ Iniciando...");
    const data = await loginLocal(email, password);

    //  Entra directo SIEMPRE (aunque no verificado)
    if (!data.emailVerified) {
      setStatus(" Entraste, pero tu correo NO está verificado. Puedes verificar después (botón Reenviar).", true);
      setTimeout(() => (window.location.href = "index.html"), 700);
      return;
    }

    setStatus(" Login OK. Redirigiendo...");
    window.location.href = "index.html";
  } catch (err) {
    setStatus(" " + (err?.message || "Error"), true);
  }
});

// 3) Botón Crear cuenta (manda correo)
document.getElementById("btnRegister")?.addEventListener("click", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email")?.value?.trim();
  const password = document.getElementById("password")?.value;

  if (!email || !password) {
    setStatus(" Para crear cuenta escribe email y contraseña (mín 6)", true);
    return;
  }

  try {
    setStatus("⏳ Creando cuenta...");
    await registerLocal(email, password);

    setStatus(" Cuenta creada. Te envié un correo de verificación (revisa SPAM). Ahora puedes hacer Login directo.");
  } catch (err) {
    setStatus("❌ " + (err?.message || "Error"), true);
  }
});

// 4) Botón Reenviar verificación (requiere token)
document.getElementById("btnResend")?.addEventListener("click", async () => {
  const token = getToken();
  if (!token) {
    setStatus(" Primero inicia sesión (para saber qué usuario eres).", true);
    return;
  }

  try {
    setStatus(" Reenviando correo...");
    const r = await fetch(`${API}/verify/resend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    });

    const data = await safeJson(r);
    if (!r.ok) throw new Error(data.error || `Error ${r.status} al reenviar`);

    setStatus("✅" + (data.message || "Correo reenviado ") + " (revisa SPAM)");
  } catch (e) {
    setStatus("❌ " + (e?.message || "Error"), true);
  }
});

// 5) OAuth buttons
document.getElementById("btnGoogle")?.addEventListener("click", () => {
  location.href = `${API}/auth/google`;
});

document.getElementById("btnFacebook")?.addEventListener("click", () => {
  location.href = `${API}/auth/facebook`;
});
