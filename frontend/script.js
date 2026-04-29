// ===== Theme management =====
function getStoredTheme() {
  const fromLS = localStorage.getItem('theme');
  if (fromLS === 'dark' || fromLS === 'light') return fromLS;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setCookieTheme(theme) {
  document.cookie = "theme=" + theme + "; Max-Age=31536000; Path=/; SameSite=Lax";
}

function applyTheme(theme) {
  const link = document.getElementById('stylesheet');
  if (link) {
    const target = theme === 'dark' ? 'css/style-dark.css' : 'css/style.css';
    if (link.getAttribute('href') !== target) link.setAttribute('href', target);
  }
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  setCookieTheme(theme);

  let meta = document.querySelector('meta[name="color-scheme"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'color-scheme';
    document.head.appendChild(meta);
  }
  meta.content = theme === 'dark' ? 'dark light' : 'light dark';

  const themeIcon = document.getElementById('theme-icon');
  if (themeIcon) {
    themeIcon.classList.remove('fa-sun','fa-moon');
    themeIcon.classList.add(theme === 'dark' ? 'fa-moon' : 'fa-sun');
  }
}

// ===== API =====
const API_BASE = "http://localhost:5000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { "Authorization": "Bearer " + token } : {};
}

async function fetchTodosAPI() {
  const res = await fetch(`${API_BASE}/todos`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to load todos: ${res.status}`);
  return res.json();
}

async function createTodoAPI(title, start, end, status="todo") {
  const res = await fetch(`${API_BASE}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ title, start, end, status })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown' }));
    throw new Error(err.error || 'Failed to create todo');
  }
  return res.json();
}

async function updateTodoAPI(id, title, start, end, status) {
  const res = await fetch(`${API_BASE}/todos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ title, start, end, status })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown' }));
    throw new Error(err.error || 'Failed to update todo');
  }
  return res.json();
}

async function deleteTodoAPI(id) {
  const res = await fetch(`${API_BASE}/todos/${id}`, {
    method: "DELETE",
    headers: authHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown' }));
    throw new Error(err.error || 'Failed to delete todo');
  }
  return res.json();
}

function getEventColor(status) {
  if (status === 'inprogress') return '#FFA500';
  if (status === 'done') return '#28a745';
  return '#6a5acd';
}

// ===== KPI =====
async function updateKPI() {
  const todos = await fetchTodosAPI();
  if (!Array.isArray(todos)) return;

  const todayStr = new Date().toISOString().split("T")[0];
  const tasksToday = todos.filter(t => t.start?.split('T')[0] === todayStr).length;

  const now = new Date();
  const day = now.getDay() || 7; // dimanche = 7
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - day + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const tasksThisWeek = todos.filter(t => {
    const dStr = t.start?.split('T')[0];
    if (!dStr) return false;
    const d = new Date(dStr);
    return d >= weekStart && d <= weekEnd;
  }).length;

  const tasksDone = todos.filter(t => t.status === "done").length;

  document.getElementById("kpi-today").textContent = tasksToday;
  document.getElementById("kpi-week").textContent = tasksThisWeek;
  document.getElementById("stat-done").textContent = tasksDone;
}

// ===== DOMContentLoaded =====
document.addEventListener('DOMContentLoaded', async () => {
  // Theme
  const currentTheme = getStoredTheme();
  applyTheme(currentTheme);
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || getStoredTheme();
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  // Auth
  const token = localStorage.getItem("token");
  if (!token) return window.location.href = "/login.html";

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const welcomeH3 = document.querySelector("#div-content h3");
    if (welcomeH3) welcomeH3.textContent = `Welcome, ${payload.name || ''} ${payload.firstname || ''}`.trim();
  } catch {
    localStorage.removeItem("token");
    return window.location.href = "/login.html";
  }

  document.querySelector("#btn-user")?.addEventListener("click", e => {
    e.preventDefault();
    localStorage.removeItem("token");
    window.location.href = "/login.html";
  });

  // Calendar setup
  const dlg = document.getElementById('event-modal');
  const form = document.getElementById('event-form');
  const titleInput = document.getElementById('evt-title');
  const startDateInput = document.getElementById('evt-start-date');
  const endDateInput = document.getElementById('evt-end-date');
  let statusSelect = document.getElementById('evt-status');

  if (!statusSelect) {
    statusSelect = document.createElement('select');
    statusSelect.id = 'evt-status';
    ['todo', 'inprogress', 'done'].forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s.charAt(0).toUpperCase() + s.slice(1);
      statusSelect.appendChild(opt);
    });
    form.insertBefore(statusSelect, form.querySelector('menu'));
  }

  const cancelBtn = document.getElementById('evt-cancel');
  const deleteBtn = document.getElementById('evt-delete');
  const saveBtn = document.getElementById('evt-save');

  let calendar = null;
  let editingEvent = null;

  const calendarEl = document.getElementById('calendar');
  if (calendarEl && typeof FullCalendar !== 'undefined') {
    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      locale: 'en',
      firstDay: 1,
      contentHeight: 625,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      selectable: true,
      editable: true,
      dateClick(info) { openModalCreate(info.dateStr); },
      eventClick(info) { openModalEdit(info.event); },
      events: async function(_, successCallback, failureCallback) {
        try {
          const events = await fetchTodosAPI();
          successCallback(events.map(e => ({
            id: String(e.id),
            title: e.title,
            start: e.start ? e.start.split('T')[0] : null,
            end: e.end ? e.end.split('T')[0] : (e.start ? e.start.split('T')[0] : null),
            allDay: true,
            extendedProps: { status: e.status },
            backgroundColor: getEventColor(e.status),
            borderColor: getEventColor(e.status)
          })));
          await updateKPI(); // KPI update after loading events
        } catch (err) { console.error(err); failureCallback(err); }
      },
      eventChange: async function(info) {
        const evt = info.event;
        try {
          await updateTodoAPI(
            evt.id,
            evt.title,
            evt.startStr.split('T')[0],
            evt.endStr ? evt.endStr.split('T')[0] : evt.startStr.split('T')[0],
            evt.extendedProps.status
          );
          await updateKPI();
        } catch (err) {
          console.error(err);
          alert("Failed to update event on server.");
          info.revert();
        }
      }
    });
    calendar.render();
  }

  // Modal helpers
  function openModalCreate(date) {
    editingEvent = null;
    form?.reset();
    deleteBtn && (deleteBtn.hidden = true);
    saveBtn && (saveBtn.textContent = 'Add');
    const today = date || new Date().toISOString().split('T')[0];
    startDateInput.value = today;
    endDateInput.value = today;
    statusSelect.value = 'todo';
    dlgShow();
  }

  function openModalEdit(event) {
    form?.reset();
    if (!event) return;
    editingEvent = event;
    titleInput.value = event.title || '';
    startDateInput.value = event.startStr.split('T')[0];
    endDateInput.value = event.endStr ? event.endStr.split('T')[0] : event.startStr.split('T')[0];
    statusSelect.value = event.extendedProps?.status || 'todo';
    deleteBtn && (deleteBtn.hidden = false);
    saveBtn && (saveBtn.textContent = 'Save');
    dlgShow();
  }

  function dlgShow() {
    if (!dlg) return;
    typeof dlg.showModal === 'function' ? dlg.showModal() : dlg.style.display = 'block';
    setTimeout(() => titleInput?.focus(), 50);
  }

  cancelBtn?.addEventListener('click', () => {
    if (!dlg) return;
    typeof dlg.close === 'function' ? dlg.close() : dlg.style.display = 'none';
  });

  deleteBtn?.addEventListener('click', async () => {
    if (!editingEvent?.id) return;
    try {
      await deleteTodoAPI(editingEvent.id);
      calendar.getEventById(editingEvent.id)?.remove();
      await updateKPI();
      dlg && (typeof dlg.close === 'function' ? dlg.close() : dlg.style.display = 'none');
    } catch (err) { console.error(err); alert("Failed to delete event on server."); }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const start = startDateInput.value;
    const end = endDateInput.value || start;
    const status = statusSelect.value;

    if (!title || !start) return alert("Title and start date required");
    if (new Date(end) < new Date(start)) return alert("End date cannot be before start date.");

    try {
      if (editingEvent?.id) {
        await updateTodoAPI(editingEvent.id, title, start, end, status);
        const evt = calendar.getEventById(editingEvent.id);
        if (evt) {
          evt.setProp('title', title);
          evt.setExtendedProp('status', status);
          const oldStart = evt.startStr.split('T')[0];
          const oldEnd = evt.endStr ? evt.endStr.split('T')[0] : oldStart;
          if (oldStart !== start || oldEnd !== end) {
            evt.setStart(start);
            evt.setEnd(end);
          }
          const color = getEventColor(status);
          evt.setProp('backgroundColor', color);
          evt.setProp('borderColor', color);
        }
      } else {
        const newTodo = await createTodoAPI(title, start, end, status);
        const id = String(newTodo.id || newTodo.insertId || newTodo._id);
        calendar.addEvent({
          id,
          title,
          start,
          end,
          allDay: true,
          extendedProps: { status },
          backgroundColor: getEventColor(status),
          borderColor: getEventColor(status)
        });
      }
      await updateKPI();
      dlg && (typeof dlg.close === 'function' ? dlg.close() : dlg.style.display = 'none');
    } catch (err) {
      console.error(err);
      alert("Failed to save event on server: " + (err.message || ""));
    }
  });

  document.getElementById('btn-add-task')?.addEventListener('click', () => openModalCreate());

  const btnDisco = document.getElementById('btn-disco');
  if (btnDisco) {
    btnDisco.addEventListener('click', () => {
      if (confirm("Are you sure ?")) {
        localStorage.removeItem("token");
        window.location.href = "/login.html";
      }
    });
  }
});
