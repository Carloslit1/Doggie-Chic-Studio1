Actividad 3 - API Tareas 
## Cómo correr (local)

1) Instalar dependencias
npm i

2) Crear .env
cp .env.example .env

3) Edita .env (JWT_SECRET obligatorio)
- SMTP_* solo si quieres probar emails
- Google/Facebook solo si quieres probar OAuth

4) Iniciar servidor
node server.js

Servidor: http://localhost:3000
