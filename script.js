// =====================
// TaskFlow — script.js
// =====================

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const counter = document.getElementById("counter");
const clearDoneBtn = document.getElementById("clearDoneBtn");
const filterButtons = document.querySelectorAll(".filter-btn");

const STORAGE_KEY = "taskflow_tasks_v1";

let tasks = [];
let currentFilter = "all";

// ---------- storage ----------
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  tasks = raw ? JSON.parse(raw) : [];
}

// ---------- utils ----------
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getFilteredTasks() {
  if (currentFilter === "todo") return tasks.filter(t => !t.done);
  if (currentFilter === "done") return tasks.filter(t => t.done);
  return tasks;
}

// ---------- render ----------
function render() {
  const visibleTasks = getFilteredTasks();

  // empty state depends on visible list
  emptyState.style.display = visibleTasks.length === 0 ? "block" : "none";

  // counter depends on all tasks
  const left = tasks.filter(t => !t.done).length;
  counter.textContent = `${tasks.length} task${tasks.length === 1 ? "" : "s"} — ${left} left`;

  // build list
  taskList.innerHTML = "";

  visibleTasks.forEach(task => {
    const li = document.createElement("li");
    li.className = `task ${task.done ? "done" : ""}`;
    li.dataset.id = task.id;

    li.innerHTML = `
      <input class="check" type="checkbox" ${task.done ? "checked" : ""} />
      <span class="title"></span>
      <div class="actions">
        <button class="icon-btn edit" type="button" title="Edit">✏️</button>
        <button class="icon-btn delete" type="button" title="Delete">🗑️</button>
      </div>
    `;

    li.querySelector(".title").textContent = task.title;

    taskList.appendChild(li);
  });
}

// ---------- actions ----------
function addTask(title) {
  tasks.unshift({
    id: uid(),
    title,
    done: false,
    createdAt: Date.now()
  });

  saveTasks();
  render();
}

function toggleTask(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;

  t.done = !t.done;
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter(x => x.id !== id);
  saveTasks();
  render();
}

function editTaskInline(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;

  // get the li of this task 
  const li = taskList.querySelector(`.task[data-id="${id}"]`);
  if (!li) return;

  // title span inside the li
  const titleSpan = li.querySelector(".title");
  if (!titleSpan) return;

  // prevent double edit
  if (li.querySelector(".edit-input")) return;

  const input = document.createElement("input");
  input.className = "edit-input";
  input.type = "text";
  input.value = t.title;
  input.maxLength = 80;

  // replace span with input
  titleSpan.replaceWith(input);
  input.focus();
  input.select();

  function finish(save) {
    const val = input.value.trim();

    // restore span
    const span = document.createElement("span");
    span.className = "title";

    if (save && val) {
      t.title = val;
      saveTasks();
    }

    span.textContent = t.title;
    input.replaceWith(span);

    render();
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") finish(true);
    if (e.key === "Escape") finish(false);
  });

  input.addEventListener("blur", () => finish(true));
}

function clearDone() {
  tasks = tasks.filter(t => !t.done);
  saveTasks();
  render();
}

// ---------- events ----------
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = taskInput.value.trim();
  if (!title) return;

  addTask(title);

  taskInput.value = "";
  taskInput.focus();
});

clearDoneBtn.addEventListener("click", clearDone);

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    render();
  });
});

// event delegation (list actions)
taskList.addEventListener("click", (e) => {
  const li = e.target.closest(".task");
  if (!li) return;

  const id = li.dataset.id;

  if (e.target.classList.contains("delete")) deleteTask(id);
  if (e.target.classList.contains("edit")) editTaskInline(id);
});

taskList.addEventListener("change", (e) => {
  if (!e.target.classList.contains("check")) return;
  const li = e.target.closest(".task");
  if (!li) return;
  toggleTask(li.dataset.id);
});

// ---------- init ----------
loadTasks();
render();