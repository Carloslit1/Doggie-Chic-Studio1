const express = require("express");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const productosRoutes = require("./routes/productos.routes");
const { connectDB } = require("./db");

const app = express();

/* MIDDLEWARES */
app.use(express.json());

/* STATIC LOGIN (si tienes public/) */
app.use(express.static(path.join(__dirname, "..", "public")));

/* DB: conectar antes de usar rutas (en Vercel y local)  */
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (e) {
    return res.status(500).json({ error: "Error conectando a MongoDB" });
  }
});

/* RUTAS*/
app.use("/auth", authRoutes);
app.use("/productos", productosRoutes);

/* EALTHCHECK  */
/* HEALTHCHECK  */
app.get("/health", (req, res) =>
  res.json({ ok: true, msg: "health-v2-actividad4" })
);

app.get("/__version", (req, res) => {
  res.json({
    ok: true,
    msg: "version-endpoint-actividad4",
    commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
    now: new Date().toISOString()
  });
});

app.get("/productos-test", (req, res) => {
  res.json({ ok: true, msg: "productos-test vivo" });
});

app.get("/productos-test", (req, res) => {
  res.json({ ok: true, msg: "productos-test vivo" });
});

/*404  */
app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

module.exports = app;

