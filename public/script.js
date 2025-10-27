const API = "http://localhost:3000";
const tokenKey = "jwtToken";

const authSection = document.getElementById("auth-section");
const todoSection = document.getElementById("todo-section");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const todoInput = document.getElementById("todoInput");
const todoList = document.getElementById("todoList");
const userNameDisplay = document.getElementById("user-name");

// Register
document.getElementById("registerBtn").onclick = async () => {
  const res = await fetch(`${API}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: usernameInput.value,
      password: passwordInput.value
    })
  });
  alert((await res.json()).message);
};

// Login
document.getElementById("loginBtn").onclick = async () => {
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: usernameInput.value,
      password: passwordInput.value
    })
  });

  const data = await res.json();
  if (data.token) {
    localStorage.setItem(tokenKey, data.token);
    showTodoSection(usernameInput.value);
    loadTodos();
  } else {
    alert(data.message || "Login failed");
  }
};

// Logout
document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem(tokenKey);
  showAuthSection();
};

// Add Todo
document.getElementById("addTodoBtn").onclick = async () => {
  const token = localStorage.getItem(tokenKey);
  if (!todoInput.value) return;
  await fetch(`${API}/todos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ title: todoInput.value })
  });
  todoInput.value = "";
  loadTodos();
};

// Load Todos
async function loadTodos() {
  const token = localStorage.getItem(tokenKey);
  const res = await fetch(`${API}/todos`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const todos = await res.json();
  todoList.innerHTML = "";

  todos.forEach(t => {
    const li = document.createElement("li");
    li.textContent = t.title;
    if (t.done) li.classList.add("done");

    const actions = document.createElement("div");

    const doneBtn = document.createElement("button");
    doneBtn.textContent = t.done ? "Undo" : "Done";
    doneBtn.onclick = async () => {
      await fetch(`${API}/todos/${t.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      loadTodos();
    };

    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑";
    delBtn.onclick = async () => {
      await fetch(`${API}/todos/${t.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      loadTodos();
    };

    actions.append(doneBtn, delBtn);
    li.append(actions);
    todoList.append(li);
  });
}

function showTodoSection(username) {
  userNameDisplay.textContent = username;
  authSection.classList.add("hidden");
  todoSection.classList.remove("hidden");
}

function showAuthSection() {
  authSection.classList.remove("hidden");
  todoSection.classList.add("hidden");
}

if (localStorage.getItem(tokenKey)) {
  showTodoSection("User");
  loadTodos();
}
