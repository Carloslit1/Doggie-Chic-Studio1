const mongoose = require("mongoose");

const productoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, default: "" },
    precio: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Producto", productoSchema);
