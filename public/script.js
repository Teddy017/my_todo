const API = "http://localhost:3000";
const tokenKey = "jwtToken";

// Elements
const authSection = document.getElementById("auth-section");
const todoSection = document.getElementById("todo-section");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const todoInput = document.getElementById("todoInput");
const todoList = document.getElementById("todoList");
const userNameDisplay = document.getElementById("user-name");
const themeSwitch = document.getElementById("themeSwitch");

// -------------------- AUTH --------------------
document.getElementById("registerBtn").addEventListener("click", async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  if (!username || !password) return alert("Please provide username and password.");

  try {
    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    alert(data.message || "Registered successfully");
  } catch (err) {
    console.error(err);
    alert("Registration failed.");
  }
});

document.getElementById("loginBtn").addEventListener("click", async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  if (!username || !password) return alert("Please provide username and password.");

  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem(tokenKey, data.token);
      showTodoSection(username);
      await loadTodos();
    } else {
      alert(data.message || "Login failed");
    }
  } catch (err) {
    console.error(err);
    alert("Login error");
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem(tokenKey);
  showAuthSection();
});

// -------------------- TODOS --------------------

// Add Todo
document.getElementById("addTodoBtn").addEventListener("click", async () => {
  const token = localStorage.getItem(tokenKey);
  const text = todoInput.value.trim();
  if (!text) return;

  try {
    const res = await fetch(`${API}/todos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) throw new Error("Failed to add todo");
    const newTodo = await res.json();

    todoInput.value = "";
    appendTodoToList(newTodo); // Append without reloading old todos

  } catch (err) {
    console.error(err);
    alert("Failed to add todo");
  }
});

// Load Todos
async function loadTodos() {
  const token = localStorage.getItem(tokenKey);
  if (!token) return;

  try {
    const res = await fetch(`${API}/todos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to load todos");

    const todos = await res.json();
    todoList.innerHTML = "";
    todos.forEach(t => appendTodoToList(t));

  } catch (err) {
    console.error(err);
    alert("Failed to load todos");
  }
}

// Append single todo to list
function appendTodoToList(t) {
  if (document.querySelector(`li[data-id='${t.id}']`)) return;

  const li = document.createElement("li");
  li.dataset.id = t.id;
  li.classList.toggle("done", t.done);

  const textWrap = document.createElement("div");
  textWrap.className = "todo-text";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = t.done;

  const span = document.createElement("span");
  span.textContent = t.text;

  checkbox.addEventListener("change", async () => {
    li.classList.toggle("done", checkbox.checked);
    try {
      await toggleDone(t.id, checkbox.checked);
      t.done = checkbox.checked; // persist locally
    } catch (err) {
      console.error(err);
      checkbox.checked = !checkbox.checked;
      li.classList.toggle("done", checkbox.checked);
      alert("Failed to update todo status.");
    }
  });

  textWrap.appendChild(checkbox);
  textWrap.appendChild(span);

  const actions = document.createElement("div");
  actions.className = "todo-actions";

  const editBtn = document.createElement("button");
  editBtn.className = "edit-btn";
  editBtn.title = "Edit";
  editBtn.innerText = "✏️";
  editBtn.addEventListener("click", async () => {
    const newText = prompt("Edit your task:", t.text);
    if (!newText || newText.trim() === "" || newText.trim() === t.text) return;
    try {
      await editTodoRequest(t.id, newText.trim());
      span.textContent = newText.trim();
      t.text = newText.trim();
    } catch (err) {
      console.error(err);
      alert("Failed to edit todo.");
    }
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.title = "Delete";
  deleteBtn.innerText = "🗑️";
  deleteBtn.addEventListener("click", async () => {
    if (!confirm("Delete this task?")) return;
    try {
      await deleteTodoRequest(t.id);
      li.remove();
    } catch (err) {
      console.error(err);
      alert("Failed to delete todo.");
    }
  });

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  li.appendChild(textWrap);
  li.appendChild(actions);
  todoList.appendChild(li);
}

// -------------------- BACKEND HELPERS --------------------
async function toggleDone(id, done) {
  const token = localStorage.getItem(tokenKey);
  const res = await fetch(`${API}/todos/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ done }),
  });
  if (!res.ok) throw new Error("Failed to update done");
  return res.json();
}

async function editTodoRequest(id, text) {
  const token = localStorage.getItem(tokenKey);
  const res = await fetch(`${API}/todos/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Failed to edit");
  return res.json();
}

async function deleteTodoRequest(id) {
  const token = localStorage.getItem(tokenKey);
  const res = await fetch(`${API}/todos/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete");
  return res.json();
}

// -------------------- UI / THEME --------------------
function showTodoSection(username) {
  userNameDisplay.textContent = username;
  authSection.classList.add("hidden");
  todoSection.classList.remove("hidden");
}

function showAuthSection() {
  authSection.classList.remove("hidden");
  todoSection.classList.add("hidden");
}

// Dark mode
if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark");
  themeSwitch.checked = true;
}

themeSwitch.addEventListener("change", () => {
  const isDark = themeSwitch.checked;
  document.body.classList.toggle("dark", isDark);
  localStorage.setItem("darkMode", isDark);
});

// Auto-login
if (localStorage.getItem(tokenKey)) {
  showTodoSection("User");
  loadTodos();
}
