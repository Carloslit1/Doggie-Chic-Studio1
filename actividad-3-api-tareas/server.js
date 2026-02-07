"use strict";

/**
 * DoggieF / api-tareas / server.js
 * - Register + Login (JWT)
 * - CRUD /tareas protegido
 * - Verificación de correo con Nodemailer (Gmail App Password)
 * - Google / Facebook OAuth (si pones llaves)
 * - Debug endpoints + logout (para rúbrica 100)
 */

require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs").promises;
const path = require("path");
const cors = require("cors");
const crypto = require("crypto");

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

const TAREAS_PATH = path.join(__dirname, "tareas.json");
const USERS_PATH = path.join(__dirname, "users.json");

const JWT_SECRET = process.env.JWT_SECRET || "clave_secreta";

// Middlewares 
app.use(express.json());        
app.use(bodyParser.json());     

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5500",
    credentials: true,
  })
);

app.use(passport.initialize());

// Helpers fs
async function readJson(filePath, fallbackValue) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data || "null") ?? fallbackValue;
  } catch (err) {
    if (err.code === "ENOENT") {
      await fs.writeFile(filePath, JSON.stringify(fallbackValue, null, 2));
      return fallbackValue;
    }
    throw err;
  }
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

function makeId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

// ---------- Validaciones ----------
function validarEmail(email) {
  return typeof email === "string" && email.includes("@") && email.includes(".");
}

function validarTarea(req, res, next) {
  const { titulo, descripcion } = req.body || {};
  if (!titulo || typeof titulo !== "string" || titulo.trim().length < 2) {
    return res.status(400).json({ error: "titulo es requerido (mín 2 chars)" });
  }
  if (!descripcion || typeof descripcion !== "string" || descripcion.trim().length < 2) {
    return res.status(400).json({ error: "descripcion es requerida (mín 2 chars)" });
  }
  next();
}

// ---------- JWT Middleware ----------
function autenticarToken(req, res, next) {
  const auth = req.headers["authorization"];
  if (!auth) return res.status(401).json({ error: "Acceso denegado: falta Authorization" });

  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(403).json({ error: "Token inválido o expirado" });
  }
}

//                 La verificacion
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verificar SMTP al iniciar 
transporter.verify((err) => {
  if (err) console.log(" SMTP NO listo:", err.message);
  else console.log(" SMTP listo para enviar correos");
});

async function sendVerifyEmail({ to, name, token }) {
  const base = process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5500";
  const link = `${base}/verify.html?token=${encodeURIComponent(token)}`;

  await transporter.sendMail({
    from: `"Doggie Chic Studio" <${process.env.SMTP_USER}>`,
    to,
    subject: "Verifica tu correo - Doggie Chic Studio",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5">
        <h2>Hola ${name || ""} 👋</h2>
        <p>Confirma tu correo dando click aquí:</p>
        <p><a href="${link}" target="_blank">${link}</a></p>
        <p>Este enlace expira en 30 minutos.</p>
      </div>
    `,
  });
}

async function getAllUsers() {
  return await readJson(USERS_PATH, []);
}

async function saveAllUsers(users) {
  await writeJson(USERS_PATH, users);
}

async function findUserByVerifyToken(token) {
  const users = await getAllUsers();
  return users.find((u) => u.verifyToken === token);
}

//                      RUTAS BASE
app.get("/", (req, res) => {
  res.json({ ok: true, message: "API Tareas activa " });
});

// Debug endpoints 
app.get("/debug/ping", (req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

app.get("/debug/error", (req, res) => {
  // fuerza error para probar middleware 500
  throw new Error("Error forzado de prueba");
});

// 
//            aurth local: registrologin 
app.post("/register", async (req, res, next) => {
  try {
    const { email, password, name } = req.body || {};

    if (!validarEmail(email)) return res.status(400).json({ error: "email inválido" });
    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "password mínimo 6 caracteres" });
    }

    const users = await getAllUsers();
    const exists = users.find((u) => u.email === email.toLowerCase() && u.provider === "local");
    if (exists) return res.status(409).json({ error: "Usuario ya existe" });

    const passwordHash = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(32).toString("hex");

    const user = {
      id: makeId(),
      email: email.toLowerCase(),
      name: (name || email.split("@")[0]).trim(),
      passwordHash,
      provider: "local",
      createdAt: new Date().toISOString(),

      emailVerified: false,
      verifyToken,
      verifyTokenExp: Date.now() + 30 * 60 * 1000, // 30 min
    };

    users.push(user);
    await saveAllUsers(users);

    // enviar correo verificación 
    await sendVerifyEmail({ to: user.email, name: user.name, token: verifyToken });

    res.status(201).json({
      message: "Usuario registrado. Revisa tu correo para verificar ",
      user: { id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified },
    });
  } catch (err) {
    next(err);
  }
});

app.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email y password requeridos" });

    const users = await getAllUsers();
    const user = users.find((u) => u.email === email.toLowerCase() && u.provider === "local");
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, provider: "local" },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Login OK",
      token,
      emailVerified: !!user.emailVerified,
    });
  } catch (err) {
    next(err);
  }
});

app.get("/me", autenticarToken, (req, res) => {
  res.json({ user: req.user });
});

//  Logout “sesión con token” (para rúbrica)
app.post("/logout", autenticarToken, (req, res) => {
  // En JWT el logout real es borrar el token en el cliente.
  res.json({ message: "Logout OK (borra el token en el cliente)" });
});

//                 Verificacion de endpots en email
app.post("/verify/confirm", async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: "Token requerido" });

    const user = await findUserByVerifyToken(token);
    if (!user) return res.status(400).json({ error: "Token inválido" });

    if (!user.verifyTokenExp || Date.now() > user.verifyTokenExp) {
      return res.status(400).json({ error: "Token expirado" });
    }

    const users = await getAllUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) return res.status(404).json({ error: "Usuario no existe" });

    users[idx].emailVerified = true;
    users[idx].verifyToken = null;
    users[idx].verifyTokenExp = null;

    await saveAllUsers(users);

    return res.json({ message: "Correo verificado " });
  } catch (e) {
    return res.status(500).json({ error: "Error verificando correo", detail: String(e.message || e) });
  }
});

app.post("/verify/resend", autenticarToken, async (req, res) => {
  try {
    const users = await getAllUsers();
    const idx = users.findIndex((u) => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ error: "Usuario no existe" });

    if (users[idx].emailVerified) return res.json({ message: "Ya verificado " });

    const token = crypto.randomBytes(32).toString("hex");
    users[idx].verifyToken = token;
    users[idx].verifyTokenExp = Date.now() + 30 * 60 * 1000;

    await saveAllUsers(users);
    await sendVerifyEmail({ to: users[idx].email, name: users[idx].name, token });

    return res.json({ message: "Correo reenviado " });
  } catch (e) {
    return res.status(500).json({ error: "No se pudo enviar correo", detail: String(e.message || e) });
  }
});

//                    Prueba de endpount
app.post("/email/test", async (req, res) => {
  try {
    const { to } = req.body || {};
    if (!to) return res.status(400).json({ error: "Falta to" });

    await transporter.sendMail({
      from: `"Doggie Chic Studio" <${process.env.SMTP_USER}>`,
      to,
      subject: "Correo de prueba ",
      html: "<h2>Si te llegó esto, tu SMTP ya funciona.</h2>",
    });

    res.json({ ok: true, message: "Correo enviado " });
  } catch (e) {
    console.error("EMAIL ERROR:", e);
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

//                 CRUD /tareas (Protegidas)
app.get("/tareas", autenticarToken, async (req, res, next) => {
  try {
    const tareas = await readJson(TAREAS_PATH, []);
    res.json(tareas);
  } catch (err) {
    next(err);
  }
});

app.post("/tareas", autenticarToken, validarTarea, async (req, res, next) => {
  try {
    const { titulo, descripcion } = req.body;

    const tareas = await readJson(TAREAS_PATH, []);
    const nueva = {
      id: makeId(),
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      completada: false,
      createdAt: new Date().toISOString(),
    };

    tareas.push(nueva);
    await writeJson(TAREAS_PATH, tareas);

    res.status(201).json({ message: "Tarea creada", tarea: nueva });
  } catch (err) {
    next(err);
  }
});

app.put("/tareas/:id", autenticarToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, completada } = req.body || {};

    const tareas = await readJson(TAREAS_PATH, []);
    const idx = tareas.findIndex((t) => t.id === id);
    if (idx === -1) return res.status(404).json({ error: "Tarea no encontrada" });

    if (titulo !== undefined) {
      if (typeof titulo !== "string" || titulo.trim().length < 2) return res.status(400).json({ error: "titulo inválido" });
      tareas[idx].titulo = titulo.trim();
    }
    if (descripcion !== undefined) {
      if (typeof descripcion !== "string" || descripcion.trim().length < 2) return res.status(400).json({ error: "descripcion inválida" });
      tareas[idx].descripcion = descripcion.trim();
    }
    if (completada !== undefined) {
      if (typeof completada !== "boolean") return res.status(400).json({ error: "completada debe ser boolean" });
      tareas[idx].completada = completada;
    }

    tareas[idx].updatedAt = new Date().toISOString();
    await writeJson(TAREAS_PATH, tareas);

    res.json({ message: "Tarea actualizada", tarea: tareas[idx] });
  } catch (err) {
    next(err);
  }
});

app.delete("/tareas/:id", autenticarToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const tareas = await readJson(TAREAS_PATH, []);
    const exists = tareas.some((t) => t.id === id);
    if (!exists) return res.status(404).json({ error: "Tarea no encontrada" });

    const nuevas = tareas.filter((t) => t.id !== id);
    await writeJson(TAREAS_PATH, nuevas);

    res.json({ message: "Tarea eliminada" });
  } catch (err) {
    next(err);
  }
});


//               OAuth (Google/Facebook) 
const hasGoogle =
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CALLBACK_URL;

const hasFacebook =
  process.env.FACEBOOK_APP_ID &&
  process.env.FACEBOOK_APP_SECRET &&
  process.env.FACEBOOK_CALLBACK_URL;

if (hasGoogle) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const users = await getAllUsers();
          const key = `google:${profile.id}`;
          let user = users.find((u) => u.oauthKey === key);

          if (!user) {
            user = {
              id: makeId(),
              provider: "google",
              oauthKey: key,
              email: (profile.emails?.[0]?.value || "").toLowerCase(),
              name: profile.displayName || "Usuario",
              photo: profile.photos?.[0]?.value || "",
              createdAt: new Date().toISOString(),
              emailVerified: true,
            };
            users.push(user);
            await saveAllUsers(users);
          }

          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );

  app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      session: false,
      failureRedirect: `${process.env.CLIENT_URL}/login.html?error=google`,
    }),
    (req, res) => {
      const token = jwt.sign(
        { id: req.user.id, email: req.user.email, name: req.user.name, photo: req.user.photo, provider: "google" },
        JWT_SECRET,
        { expiresIn: "2h" }
      );
      res.redirect(`${process.env.CLIENT_URL}/login.html?token=${encodeURIComponent(token)}`);
    }
  );
} else {
  console.log("Google OAuth: NO configurado (faltan llaves).");
}

if (hasFacebook) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL,
        profileFields: ["id", "displayName", "photos", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const users = await getAllUsers();
          const key = `facebook:${profile.id}`;
          let user = users.find((u) => u.oauthKey === key);

          if (!user) {
            user = {
              id: makeId(),
              provider: "facebook",
              oauthKey: key,
              email: (profile.emails?.[0]?.value || "").toLowerCase(),
              name: profile.displayName || "Usuario",
              photo: profile.photos?.[0]?.value || "",
              createdAt: new Date().toISOString(),
              emailVerified: true,
            };
            users.push(user);
            await saveAllUsers(users);
          }

          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );

  app.get("/auth/facebook", passport.authenticate("facebook", { scope: ["email"], session: false }));

  app.get(
    "/auth/facebook/callback",
    passport.authenticate("facebook", {
      session: false,
      failureRedirect: `${process.env.CLIENT_URL}/login.html?error=facebook`,
    }),
    (req, res) => {
      const token = jwt.sign(
        { id: req.user.id, email: req.user.email, name: req.user.name, photo: req.user.photo, provider: "facebook" },
        JWT_SECRET,
        { expiresIn: "2h" }
      );
      res.redirect(`${process.env.CLIENT_URL}/login.html?token=${encodeURIComponent(token)}`);
    }
  );
} else {
  console.log("Facebook OAuth: NO configurado (faltan llaves).");
}

// 404 
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Errores 
app.use((err, req, res, next) => {
  console.error("ERROR:", err.stack || err);
  res.status(500).json({ error: "Error en el servidor", detail: String(err.message || err) });
});

// LISTEN 
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
