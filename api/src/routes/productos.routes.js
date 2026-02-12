const express = require("express");
const auth = require("../middlewares/auth");
const ctrl = require("../controllers/productos.controller");

const router = express.Router();

router.get("/", auth, ctrl.listar);
router.get("/:id", auth, ctrl.obtener);
router.post("/", auth, ctrl.crear);
router.put("/:id", auth, ctrl.actualizar);
router.delete("/:id", auth, ctrl.eliminar);

module.exports = router;
