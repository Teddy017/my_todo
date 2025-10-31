const request = require("supertest");
const app = require("../server"); // Make sure server.js exports app, not app.listen()

let token = "";

describe("Todo API", () => {
  const testUser = { username: "john", password: "1234" };

  // -------------------- REGISTER --------------------
  it("should register a new user", async () => {
    const res = await request(app).post("/register").send(testUser);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("User registered successfully");
  });

  // -------------------- LOGIN --------------------
  it("should log in and return a JWT", async () => {
    const res = await request(app).post("/login").send(testUser);
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  // -------------------- ADD TODO --------------------
  it("should add a new todo", async () => {
    const res = await request(app)
      .post("/todos")
      .set("Authorization", `Bearer ${token}`)
      .send({ text: "Buy milk" }); // 'text' key matches server.js
    expect(res.statusCode).toBe(200);
    expect(res.body.text).toBe("Buy milk");
    expect(res.body.done).toBe(false);
    expect(res.body.id).toBeDefined();
  });

  // -------------------- GET TODOS --------------------
  it("should get user todos", async () => {
    const res = await request(app)
      .get("/todos")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].text).toBe("Buy milk");
  });

  // -------------------- TOGGLE TODO --------------------
  it("should toggle a todo done status", async () => {
    const todosRes = await request(app)
      .get("/todos")
      .set("Authorization", `Bearer ${token}`);
    const todoId = todosRes.body[0].id;

    const toggleRes = await request(app)
      .put(`/todos/${todoId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ done: true });
    expect(toggleRes.statusCode).toBe(200);
    expect(toggleRes.body.done).toBe(true);
  });

  // -------------------- EDIT TODO --------------------
  it("should edit a todo", async () => {
    const todosRes = await request(app)
      .get("/todos")
      .set("Authorization", `Bearer ${token}`);
    const todoId = todosRes.body[0].id;

    const editRes = await request(app)
      .put(`/todos/${todoId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ text: "Buy bread" });
    expect(editRes.statusCode).toBe(200);
    expect(editRes.body.text).toBe("Buy bread");
  });

  // -------------------- DELETE TODO --------------------
  it("should delete a todo", async () => {
    const todosRes = await request(app)
      .get("/todos")
      .set("Authorization", `Bearer ${token}`);
    const todoId = todosRes.body[0].id;

    const deleteRes = await request(app)
      .delete(`/todos/${todoId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.message).toBe("Deleted successfully");
  });
});
