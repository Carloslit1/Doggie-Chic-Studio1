const Producto = require("../models/Producto");

exports.listar = async (req, res) => {
  const items = await Producto.find().sort({ createdAt: -1 });
  res.json(items);
};

exports.obtener = async (req, res) => {
  const item = await Producto.findById(req.params.id);
  if (!item) return res.status(404).json({ error: "No encontrado" });
  res.json(item);
};

exports.crear = async (req, res) => {
  const { nombre, precio, descripcion, stock, activo } = req.body || {};
  if (!nombre || precio === undefined) return res.status(400).json({ error: "Faltan datos (nombre, precio)" });

  const nuevo = await Producto.create({ nombre, precio, descripcion, stock, activo });
  res.status(201).json({ message: "Producto creado ", producto: nuevo });
};

exports.actualizar = async (req, res) => {
  const updated = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.status(404).json({ error: "No encontrado" });
  res.json({ message: "Producto actualizado ", producto: updated });
};

exports.eliminar = async (req, res) => {
  const deleted = await Producto.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "No encontrado" });
  res.json({ message: "Producto eliminado " });
};
