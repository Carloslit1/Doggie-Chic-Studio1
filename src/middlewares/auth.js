const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: "Falta JWT_SECRET en el servidor" });
  }

  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Acceso denegado: falta Authorization Bearer" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(403).json({ error: "Token inválido o expirado" });
  }
};
