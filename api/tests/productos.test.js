const request = require("supertest");
const mongoose = require("mongoose");
const { app, connectDB } = require("../server");

describe("Productos Routes", () => {
  let token = "";

  beforeAll(async () => {
    await connectDB();

    // Limpia colecciones para que los tests sean repetibles
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    // Borra solo si existen (evita error si no están)
    if (collections.some((c) => c.name === "users")) {
      await db.collection("users").deleteMany({});
    }
    if (collections.some((c) => c.name === "productos")) {
      await db.collection("productos").deleteMany({});
    }

    // Registra y loguea para obtener token
    await request(app).post("/auth/register").send({
      email: "prodtest@demo.com",
      password: "123456",
    });

    const login = await request(app).post("/auth/login").send({
      email: "prodtest@demo.com",
      password: "123456",
    });

    // Ajusta si tu token se llama diferente
    token = login.body.token;
    expect(token).toBeTruthy();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("Debe crear producto", async () => {
    const res = await request(app)
      .post("/productos")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nombre: "Shampoo premium",
        precio: 199,
        stock: 10,
      });

    expect([200, 201]).toContain(res.statusCode);

    if (res.body) {
      expect(res.body.nombre || res.body.producto?.nombre).toBeTruthy();
    }
  });

  it("Debe listar productos", async () => {
    const res = await request(app)
      .get("/productos")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);

    const list = Array.isArray(res.body) ? res.body : res.body.productos;
    expect(Array.isArray(list)).toBe(true);
  });
});
