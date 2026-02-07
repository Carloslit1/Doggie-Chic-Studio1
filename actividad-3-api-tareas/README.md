# Actividad 3 — API Tareas (Node.js + Express)

API RESTful para gestionar tareas (to-do list) desarrollada con Node.js + Express.

Incluye:

- CRUD completo de tareas usando `fs.promises`
- Registro/Login con JWT + bcrypt
- Protección de rutas con Bearer Token
- Validación básica de datos
- Manejo de errores HTTP
- Verificación de correo (opcional)
- OAuth Google/Facebook (opcional)

---

# 🚀 Tecnologías utilizadas

- Node.js
- Express
- bcryptjs
- jsonwebtoken
- fs.promises
- Nodemailer (opcional)
- Passport OAuth (opcional)

#  Estructura del proyecto

```
actividad-3-api-tareas/
│
├── server.js
├── tareas.json
├── users.json
├── package.json
├── package-lock.json
├── .env.example
└── README.md
```

> `tareas.json` y `users.json` se crean automáticamente si no existen.

# ⚙ Requisitos

- Node.js v18+
- NPM

#  Instalación y ejecución (LOCAL)

##  Instalar dependencias

```bash
npm i
```

## 2️ Crear archivo de configuración

```bash
cp .env.example .env
```

Editar `.env`:

```
PORT=3000
JWT_SECRET=CAMBIA_ESTA_CLAVE

CLIENT_URL=http://localhost:5500
FRONTEND_URL=http://localhost:5500

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=TU_APP_PASSWORD
```

> SMTP solo es necesario si quieres probar correos.

## Iniciar servidor

```bash
node server.js
```

Servidor activo en:

```
http://localhost:3000
```
# Pruebas API con curl

##  Registrar usuario

```bash
curl -X POST http://localhost:3000/register \
-H "Content-Type: application/json" \
-d '{"email":"demo@doggie.com","password":"123456","name":"Demo"}'
```

---

##  Login (obtener token)

```bash
curl -X POST http://localhost:3000/login \
-H "Content-Type: application/json" \
-d '{"email":"demo@doggie.com","password":"123456"}'
```

Guardar el token que devuelve.

## 🔹 Usar Bearer Token

```bash
curl http://localhost:3000/tareas \
-H "Authorization: Bearer TU_TOKEN"
```

## 🔹 Crear tarea

```bash
curl -X POST http://localhost:3000/tareas \
-H "Content-Type: application/json" \
-H "Authorization: Bearer TU_TOKEN" \
-d '{"titulo":"Tarea demo","descripcion":"Prueba API"}'
```
## 🔹 Actualizar tarea

```bash
curl -X PUT http://localhost:3000/tareas/ID \
-H "Content-Type: application/json" \
-H "Authorization: Bearer TU_TOKEN" \
-d '{"completada":true}'
```

## 🔹 Eliminar tarea

```bash
curl -X DELETE http://localhost:3000/tareas/ID \
-H "Authorization: Bearer TU_TOKEN"
```

## 🔹 Ruta inexistente (error 404)

```bash
curl http://localhost:3000/ruta-inexistente
```

# ✉ Prueba de correo (opcional)

```bash
curl -X POST http://localhost:3000/email/test \
-H "Content-Type: application/json" \
-d '{"to":"tu_correo@gmail.com"}'
```

#  OAuth (opcional)

Configurar en `.env`:

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
```

Luego abrir:

```
http://localhost:3000/auth/google
http://localhost:3000/auth/facebook
```

#  Seguridad implementada

- Hash de contraseñas con bcrypt
- JWT con expiración
- Middleware de autenticación
- Validaciones de entrada
- Manejo de errores HTTP

# video

- Registro de usuario
- Login y obtención de token
- CRUD protegido con Bearer token
- Error 404
- envío de correo
  
#  Resultado esperado

API funcional con:

✔ Autenticación segura  
✔ Protección de rutas  
✔ CRUD completo  
✔ Manejo de errores  
✔ Persistencia en JSON  
