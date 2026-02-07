# Actividad 3 — API Tareas (Node.js + Express)

API RESTful para gestionar tareas (to-do list) con:

- CRUD completo en `tareas.json` usando `fs.promises` (asincrónico, sin bloquear el Event Loop)
- Registro/Login con `bcryptjs` + `jsonwebtoken (JWT)`
- Rutas protegidas con middleware: `Authorization: Bearer <token>`
- Validación básica de datos (400)
- Manejo de errores (401/403/404/500)
- (Opcional) Verificación de correo con Nodemailer (SMTP)
- (Opcional) OAuth Google/Facebook con Passport

---

## Requisitos
- Node.js (v18+ recomendado)
- NPM

---

## Estructura (carpeta Actividad 3)
Dentro de `actividad-3-api-tareas/` encontrarás:
- `server.js` (servidor + rutas + auth + middlewares)
- `tareas.json` (almacenamiento de tareas)
- `users.json` (almacenamiento de usuarios)
- `package.json` / `package-lock.json`
- `.env.example` (plantilla de variables)
- `README.md` (este archivo)

> Nota: `tareas.json` y `users.json` se crean automáticamente si no existen.

---

## Instalación y ejecución (LOCAL)

### 1) Instalar dependencias
```bash
npm i
