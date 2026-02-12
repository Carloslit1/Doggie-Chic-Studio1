const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middlewares/auth");

const router = express.Router();

const USERS = [];

router.post("/register", async (req, res) => {
  const { email, password, name } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  const exists = USERS.find((u) => u.email === email);
  if (exists) {
    return res.status(400).json({ error: "Ya existe" });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = {
    id: String(Date.now()),
    email,
    name: name || email,
    password: hash,
  };

  USERS.push(user);

  return res.status(201).json({
    message: "Usuario registrado",
    user: { id: user.id, email: user.email, name: user.name },
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  const user = USERS.find((u) => u.email === email);
  if (!user) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: "Falta JWT_SECRET en el servidor" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  return res.json({ message: "Login OK", token });
});

router.get("/me", auth, (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;
