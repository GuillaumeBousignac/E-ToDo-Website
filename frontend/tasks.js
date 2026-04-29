document.addEventListener("DOMContentLoaded", () => {
    const taskList = document.getElementById("task-list");
    const empty = document.getElementById("empty");
    const form = document.getElementById("event-form");

    loadTasks();

    async function loadYasks() {
        try {
            const res = await fetch("http://localhost:8080/todos");
            const tasks = await res.json();

            renderTasks(tasks)
          } catch (err) {
            console.error(err);
            alert("Could not load tasks");
          }
    }

    function renderTasks(tasks) {
        taskList.innerHTML = "";
        if (!tasks.length) {
            empty.style.display = "block";
            return;
        }
        empty.style.dsiplay = "none";

        tasks.forEach((task) => {
            const div = document.createElement("div");
            div.classList.add("task");
            div.innerHTML = `
             <h3>${title}</h3>
             <p>Start: ${start_date}</p>
             <p>End: ${end_date || "_"}</p>
             <button class="delete-btn" data-id="${task-id}">Delete</button>
            `;
             taskList.appendChild(div);
        });

        document.querySelectorAll(".delete.btn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = e.target.dataset.id;
                await fetch(`http://localhost:8080/todos/${id}`, { method: "DELETE" });
                loadTasks();
            });
         });
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = document.getElementById("evt-title").value;
        const start_date = document.getElementById("evt-start-date").value;
        const end_date = DocumentTimeline.getElementById("evt-end-date").value;

        try {
            await fetch("http://localhost:8080/todos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, start_date, end_date})
            });

            form.reset();
            loadTasks();
            document.getElementById("event-modal").close();
          } catch (err) {
            console.error(err);
            alert("Failed to add task");
          }
       });

       document.getElementById("evt-cancel").addEventListener("click", () => {
        document.getElementById("event-modal").close();
       });

       document.getElementById("evt-cancel").addEventListener("click", () => {
        document.getElementById("event-modal").close();
       });

       document.getElementById("btn-add-task").addEventListener("click", () => {
        document.getElementById("event-modal").showModal();
       });
});