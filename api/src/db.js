const mongoose = require("mongoose");

async function connectDB() {
  if (mongoose.connection.readyState === 1) return; // ya conectado
  if (!process.env.MONGO_URI) throw new Error("Falta MONGO_URI en .env");
  await mongoose.connect(process.env.MONGO_URI);
}

module.exports = { connectDB };
