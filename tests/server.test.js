// tests/todo.test.js
const request = require("supertest");
const app = require("../server"); // make sure server.js exports app, not app.listen()

let token = "";

describe("Todo API", () => {
  const testUser = { username: "john", password: "1234" };

  it("should register a new user", async () => {
    const res = await request(app).post("/register").send(testUser);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("User registered successfully");
  });

  it("should log in and return a JWT", async () => {
    const res = await request(app).post("/login").send(testUser);
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it("should add a new todo", async () => {
    const res = await request(app)
      .post("/todos")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Buy milk" });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe("Buy milk");
  });

  it("should get user todos", async () => {
    const res = await request(app)
      .get("/todos")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
