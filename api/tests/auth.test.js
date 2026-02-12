const request = require("supertest");
const mongoose = require("mongoose");
const { app, connectDB } = require("../server");

describe("Auth Routes", () => {
  beforeAll(async () => {
    await connectDB();
    await mongoose.connection.db.collection("users").deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("Debe registrar un usuario correctamente", async () => {
    const res = await request(app).post("/auth/register").send({
      email: "testjest@demo.com",
      password: "123456",
    });

    expect([200, 201]).toContain(res.statusCode);
  });

  it("Debe loguear usuario correctamente", async () => {
    await request(app).post("/auth/register").send({
      email: "testjest@demo.com",
      password: "123456",
    });

    const res = await request(app).post("/auth/login").send({
      email: "testjest@demo.com",
      password: "123456",
    });

    expect(res.statusCode).toBe(200);


    expect(res.body.token).toBeTruthy();
  });
});
