const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("../src/routes/auth.routes");
const productosRoutes = require("../src/routes/productos.routes");

const app = express();
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/productos", productosRoutes);

app.get("/health", (req, res) => res.json({ ok: true }));

app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

let cached = global.__mongoose_conn;
if (!cached) cached = global.__mongoose_conn = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!process.env.MONGO_URI) throw new Error("Falta MONGO_URI en variables de entorno");
  cached.promise =
    cached.promise ||
    mongoose.connect(process.env.MONGO_URI).then((m) => m);

  cached.conn = await cached.promise;
  return cached.conn;
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    return next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = app;
