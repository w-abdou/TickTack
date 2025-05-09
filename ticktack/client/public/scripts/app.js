document.addEventListener("DOMContentLoaded", () => {
    const todoList = document.querySelector("#todo .task-list");
  
    const task = createTask("Sample Task");
    todoList.appendChild(task);
  });
  
  function createTask(text) {
    const div = document.createElement("div");
    div.textContent = text;
    div.className = "task";
    div.style.padding = "10px";
    div.style.marginBottom = "10px";
    div.style.background = "#e1ecf4";
    div.style.borderRadius = "6px";
    return div;
  }
  