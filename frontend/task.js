const API_BASE = "http://localhost:5000";

function getStoredTheme() {
  const fromLS = localStorage.getItem('theme');
  if (fromLS === 'dark' || fromLS === 'light') return fromLS;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  const link = document.getElementById('stylesheet');
  if (link) link.href = theme === 'dark' ? 'css/style-dark.css' : 'css/style.css';

  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);

  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.classList.remove('fa-sun', 'fa-moon');
    icon.classList.add(theme === 'dark' ? 'fa-moon' : 'fa-sun');
  }
}

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { "Authorization": "Bearer " + token } : {};
}

function checkToken() {
  const token = localStorage.getItem("token");
  if (!token) return (window.location.href = "/login.html");
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const welcomeH3 = document.querySelector("#div-content h3");
    if (welcomeH3) welcomeH3.textContent = `Welcome, ${payload.name || ''} ${payload.firstname || ''}`.trim();
  } catch {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
  }
}

async function fetchTodosAPI() {
  const res = await fetch(`${API_BASE}/todos`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load todos");
  return res.json();
}

async function createTodoAPI(title, start, end, status="todo") {
  const res = await fetch(`${API_BASE}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ title, start, end, status })
  });
  if (!res.ok) throw new Error("Failed to create todo");
  return res.json();
}

async function updateTodoAPI(id, title, start, end, status) {
  const res = await fetch(`${API_BASE}/todos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ title, start, end, status })
  });
  if (!res.ok) throw new Error("Failed to update todo");
  return res.json();
}

async function deleteTodoAPI(id) {
  const res = await fetch(`${API_BASE}/todos/${id}`, {
    method: "DELETE",
    headers: authHeaders()
  });
  if (!res.ok) throw new Error("Failed to delete todo");
  return res.json();
}

function getStatusColor(status) {
  if (status === "inprogress") return "#FFA500";
  if (status === "done") return "#28a745";
  return "#6a5acd";
}

function filterTodos(todos, query, statusFilter) {
  return todos.filter(t => {
    const matchesQuery = t.title.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = !statusFilter || t.status === statusFilter;
    return matchesQuery && matchesStatus;
  });
}

function updateKPIAndCount(todos) {
  const total = todos.length;
  const inProgress = todos.filter(t => t.status === 'inprogress').length;
  const done = todos.filter(t => t.status === 'done').length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-inprogress').textContent = inProgress;
  document.getElementById('stat-done').textContent = done;

  const countChip = document.getElementById('count-chip');
  if (countChip) countChip.textContent = `${total} task${total !== 1 ? 's' : ''}`;
}

document.addEventListener("DOMContentLoaded", async () => {
  applyTheme(getStoredTheme());
  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });

  checkToken();

  const btnDisco = document.getElementById('btn-disco');
  if (btnDisco) btnDisco.addEventListener('click', () => {
    if (confirm("Are you sure ?")) {
      localStorage.removeItem("token");
      window.location.href = "/login.html";
    }
  });

  const dlg = document.getElementById("event-modal");
  const form = document.getElementById("event-form");
  const titleInput = document.getElementById("evt-title");
  const startInput = document.getElementById("evt-start-date");
  const endInput = document.getElementById("evt-end-date");
  const statusInput = document.getElementById("evt-status");
  const deleteBtn = document.getElementById("evt-delete");
  const cancelBtn = document.getElementById("evt-cancel");

  let editingTask = null;

  const openModal = () => dlg?.showModal();
  const closeModal = () => dlg?.close();

  const searchInput = document.getElementById('q');
  const statusSelect = document.getElementById('status');

  document.getElementById("btn-add-task")?.addEventListener("click", () => {
    editingTask = null;
    form.reset();
    deleteBtn.hidden = true;

    const today = new Date().toISOString().split("T")[0];
    startInput.value = today;
    endInput.value = today;
    statusInput.value = "todo";

    openModal();
  });

  cancelBtn?.addEventListener("click", () => closeModal());

  deleteBtn?.addEventListener("click", async () => {
    if (!editingTask) return;
    await deleteTodoAPI(editingTask.id);
    closeModal();
    await renderTaskList();
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const start = startInput.value;
    const end = endInput.value;
    const status = statusInput.value;

    if (editingTask) {
      await updateTodoAPI(editingTask.id, title, start, end, status);
    } else {
      await createTodoAPI(title, start, end, status);
    }

    closeModal();
    await renderTaskList();
  });

  async function renderTaskList() {
    const listEl = document.getElementById('task-list');
    const emptyEl = document.getElementById('empty');
    if (!listEl) return;

    const todos = await fetchTodosAPI();
    const query = searchInput?.value || '';
    const statusFilter = statusSelect?.value || '';

    const filteredTodos = filterTodos(todos, query, statusFilter);

    listEl.innerHTML = '';
    const formatDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : '';

    filteredTodos.forEach(todo => {
      const div = document.createElement('div');
      div.className = 'task-item card';

      div.innerHTML = `
        <div class="task-main">
          <div class="task-title">${todo.title}</div>
          <div class="task-dates">
            <span>📅 ${formatDate(todo.start)}</span>
            ${todo.end ? `<span>➡️ ${formatDate(todo.end)}</span>` : ''}
          </div>
        </div>
        <div class="task-right">
          <span class="task-status" style="background:${getStatusColor(todo.status)}">
            ${todo.status.replace('inprogress', 'in progress')}
          </span>
          <button class="btn-edit">Edit</button>
        </div>
      `;

      div.querySelector('.btn-edit')?.addEventListener('click', () => {
        editingTask = todo;
        titleInput.value = todo.title;
        startInput.value = todo.start;
        endInput.value = todo.end;
        statusInput.value = todo.status;
        deleteBtn.hidden = false;
        openModal();
      });

      listEl.appendChild(div);
    });

    if (emptyEl) emptyEl.style.display = filteredTodos.length ? 'none' : 'block';

    updateKPIAndCount(filteredTodos);
  }

  searchInput?.addEventListener('input', renderTaskList);
  statusSelect?.addEventListener('change', renderTaskList);

  await renderTaskList();
});
