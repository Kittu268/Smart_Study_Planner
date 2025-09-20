let tasks = JSON.parse(localStorage.getItem("studyTasks")) || [];
let weeklyGoal = parseInt(localStorage.getItem("weeklyGoal")) || 0;

// Save tasks and goal
function saveTasks() {
  localStorage.setItem("studyTasks", JSON.stringify(tasks));
  localStorage.setItem("weeklyGoal", weeklyGoal);
}

// Add new task
function addTask() {
  const text = document.getElementById("taskInput").value.trim();
  const category = document.getElementById("categorySelect").value;
  const priority = document.getElementById("prioritySelect").value;
  const dueDate = document.getElementById("dueDateInput").value;
  const goalInput = parseInt(document.getElementById("weeklyGoalInput").value);

  if (!text) return;
  if (!isNaN(goalInput)) weeklyGoal = goalInput;

  tasks.push({
    text,
    category,
    priority,
    dueDate,
    completed: false,
    completedDate: null
  });

  saveTasks();
  renderTasks();
  playSound("soundAdd");
}

// Toggle task completion
function toggleTask(index) {
  const list = document.getElementById("taskList");
  const li = list.children[index];
  li.classList.add("fade-out");

  setTimeout(() => {
    tasks[index].completed = !tasks[index].completed;
    tasks[index].completedDate = tasks[index].completed ? new Date().toISOString() : null;
    saveTasks();
    renderTasks();
    playSound("soundDone");
  }, 300);
}

// Delete task
function deleteTask(index) {
  tasks.splice(index, 1);
  saveTasks();
  renderTasks();
  playSound("soundDelete");
}

// Export tasks as JSON
function exportTasks() {
  const blob = new Blob([JSON.stringify(tasks)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "study_tasks.json";
  a.click();
}

// Import tasks from file
function importTasks(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = e => {
    tasks = JSON.parse(e.target.result);
    saveTasks();
    renderTasks();
  };
  reader.readAsText(file);
}

// Play sound effect
function playSound(id) {
  const audio = document.getElementById(id);
  if (audio) audio.play();
}

// Weekly progress
function getWeeklyProgress() {
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const completedThisWeek = tasks.filter(t =>
    t.completed && new Date(t.completedDate) >= startOfWeek
  ).length;
  return { completedThisWeek, goal: weeklyGoal };
}

function updateProgress() {
  const { completedThisWeek, goal } = getWeeklyProgress();
  const percent = goal ? (completedThisWeek / goal) * 100 : 0;
  document.getElementById("progressBar").style.width = `${percent}%`;
  document.getElementById("progressSummary").textContent =
    `Completed ${completedThisWeek} of ${goal} tasks this week.`;
}

// Render tasks
function renderTasks() {
  const list = document.getElementById("taskList");
  list.innerHTML = "";

  const filter = document.getElementById("filterSelect")?.value || "All";
  const sortBy = document.getElementById("sortSelect")?.value || "none";

  let sortedTasks = [...tasks];

  if (sortBy === "dueDate") {
    sortedTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  } else if (sortBy === "priority") {
    const priorityOrder = { High: 1, Medium: 2, Low: 3 };
    sortedTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  const filteredTasks = filter === "All" ? sortedTasks : sortedTasks.filter(t => t.category === filter);

  filteredTasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.className = task.completed ? "completed" : "";
    li.classList.add("fade-in");

    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
    li.innerHTML = `
      <input type="checkbox" ${task.completed ? 'checked' : ''} onclick="toggleTask(${index})">
      <span class="${isOverdue ? 'overdue' : ''}">${task.text}</span>
      <span class="meta">${task.category} | ${task.priority} | ${task.dueDate || 'No date'}</span>
    `;

    // Drag and drop
    li.setAttribute("draggable", "true");
    li.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", index);
    });
    li.addEventListener("dragover", e => e.preventDefault());
    li.addEventListener("drop", e => {
      const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
      const toIndex = index;
      const moved = tasks.splice(fromIndex, 1)[0];
      tasks.splice(toIndex, 0, moved);
      saveTasks();
      renderTasks();
    });

    list.appendChild(li);
  });

  updateProgress();
}

// Theme switching
function applyTheme() {
  const theme = document.getElementById("themeSelect").value;
  localStorage.setItem("theme", theme);
  document.body.className = theme;
  document.getElementById("plannerContainer").className = `container ${theme}`;
}

function setTheme(theme) {
  localStorage.setItem("theme", theme);
  document.body.className = theme;
  document.getElementById("plannerContainer").className = `container ${theme}`;
}

const savedTheme = localStorage.getItem("theme") || "light";
document.getElementById("themeSelect").value = savedTheme;
document.body.className = savedTheme;
document.getElementById("plannerContainer").className = `container ${savedTheme}`;

// Custom theme builder
function applyCustomTheme() {
  const bg = document.getElementById("bgColorPicker").value;
  const text = document.getElementById("textColorPicker").value;
  document.body.style.background = bg;
  document.body.style.color = text;
  document.getElementById("plannerContainer").style.background = bg;
  document.getElementById("plannerContainer").style.color = text;
  localStorage.setItem("customTheme", JSON.stringify({ bg, text }));
}

const savedCustom = JSON.parse(localStorage.getItem("customTheme"));
if (savedCustom) {
  document.getElementById("bgColorPicker").value = savedCustom.bg;
  document.getElementById("textColorPicker").value = savedCustom.text;
  applyCustomTheme();
}

// Toggle task list visibility
function toggleTaskList() {
  const section = document.getElementById("taskSection");
  section.style.display = section.style.display === "none" ? "block" : "none";
}

// AI-powered summarizer (frontend hook)
async function summarizeTask() {
  const input = document.getElementById("taskInput").value.trim();
  if (!input) return;

  const response = await fetch("http://localhost:3000/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: input })
  });

  const data = await response.json();
  document.getElementById("taskInput").value = data.summary;
}

// Initial render
renderTasks();function toggleDarkMode() {
  const currentTheme = document.body.className;
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  setTheme(newTheme);
  document.getElementById("themeSelect").value = newTheme;
}

