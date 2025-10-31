const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const SECRET_KEY = "super_secret_key";

// -------------------- In-memory storage --------------------
const users = [];
const todos = [];

// -------------------- REGISTER --------------------
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: "Username and password are required" });

  if (users.find(u => u.username === username))
    return res.status(400).json({ message: "Username already exists" });

  users.push({ username, password });
  res.json({ message: "User registered successfully" });
});

// -------------------- LOGIN --------------------
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
  res.json({ token });
});

// -------------------- AUTH MIDDLEWARE --------------------
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(403).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token" });
    req.user = decoded;
    next();
  });
}

// -------------------- TODOS ROUTES --------------------

// Create new todo
app.post("/todos", verifyToken, (req, res) => {
  const { text, done = false } = req.body;
  if (!text) return res.status(400).json({ message: "Todo text is required" });

  const newTodo = {
    id: Date.now(),
    username: req.user.username,
    text,
    done,
  };
  todos.push(newTodo);
  res.json(newTodo);
});

// Get user todos
app.get("/todos", verifyToken, (req, res) => {
  const userTodos = todos.filter(t => t.username === req.user.username);
  res.json(userTodos);
});

// Toggle todo done
app.put("/todos/:id", verifyToken, (req, res) => {
  const todo = todos.find(t => t.id === parseInt(req.params.id));
  if (!todo) return res.status(404).json({ message: "Todo not found" });
  if (todo.username !== req.user.username) return res.status(403).json({ message: "Not authorized" });

  const { text, done } = req.body;
  if (text !== undefined) todo.text = text;
  if (done !== undefined) todo.done = done;

  res.json(todo);
});

// Delete todo
app.delete("/todos/:id", verifyToken, (req, res) => {
  const index = todos.findIndex(t => t.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ message: "Todo not found" });
  if (todos[index].username !== req.user.username) return res.status(403).json({ message: "Not authorized" });

  todos.splice(index, 1);
  res.json({ message: "Deleted successfully" });
});

// -------------------- START SERVER --------------------
const PORT = 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
}

module.exports = app;
