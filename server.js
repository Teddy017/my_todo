const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const SECRET_KEY = "super_secret_key";
const users = [];
const todos = [];

// Register
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username))
    return res.status(400).json({ message: "Username already exists" });
  users.push({ username, password });
  res.json({ message: "User registered successfully" });
});

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
  res.json({ token });
});

// Middleware
function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (!bearerHeader) return res.status(403).json({ message: "No token provided" });

  const token = bearerHeader.split(" ")[1];
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token" });
    req.user = decoded;
    next();
  });
}

// Add Todo
app.post("/todos", verifyToken, (req, res) => {
  const { title } = req.body;
  const todo = { id: todos.length + 1, username: req.user.username, title, done: false };
  todos.push(todo);
  res.json(todo);
});

// Get Todos
app.get("/todos", verifyToken, (req, res) => {
  res.json(todos.filter(t => t.username === req.user.username));
});

// Mark done
app.put("/todos/:id", verifyToken, (req, res) => {
  const todo = todos.find(t => t.id === parseInt(req.params.id));
  if (!todo) return res.status(404).json({ message: "Todo not found" });
  if (todo.username !== req.user.username)
    return res.status(403).json({ message: "Not authorized" });
  todo.done = !todo.done;
  res.json(todo);
});

// Delete
app.delete("/todos/:id", verifyToken, (req, res) => {
  const index = todos.findIndex(t => t.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ message: "Todo not found" });
  if (todos[index].username !== req.user.username)
    return res.status(403).json({ message: "Not authorized" });
  todos.splice(index, 1);
  res.json({ message: "Deleted successfully" });
});

const PORT = 3000;

if (require.main === module) {
  app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
}

module.exports = app;
