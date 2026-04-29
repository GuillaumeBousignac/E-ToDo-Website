const token = localStorage.getItem("token");

if (!token) {

  window.location.href = "/login.html";
} else {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const name = payload.name;
    const firstname = payload.firstname;

    const welcomeH3 = document.querySelector("#div-content h3");
    welcomeH3.textContent = `Welcome, ${name} ${firstname}`;
  } catch (err) {
    console.error("Error while token's decrypting :", err);
    localStorage.removeItem("token");
    window.location.href = "/login.html";
  }
}

const btnUser = document.querySelector("#btn-user");
btnUser.addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem("token");
  window.location.href = "/login.html";
});

async function updateKPI() {
  const todos = await fetchTodosAPI();

  const todayStr = new Date().toISOString().split("T")[0];
  const tasksToday = todos.filter(t => t.start === todayStr).length;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const tasksThisWeek = todos.filter(t => {
    const d = new Date(t.start);
    return d >= weekStart && d <= weekEnd;
  }).length;

  const tasksDone = todos.filter(t => t.status === "done").length;

  document.getElementById("kpi-today").textContent = tasksToday;
  document.getElementById("kpi-week").textContent = tasksThisWeek;
  document.getElementById("stat-done").textContent = tasksDone;
}
