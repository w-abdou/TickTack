
window.addEventListener('load', () => {
  // Fetch tasks from the backend
  fetch('http://localhost/ticktack/backend/get_tasks.php')
    .then(response => response.json())
    .then(tasks => {
      tasks.forEach(task => {
        const column = document.querySelector(`[data-status="${task.status}"]`);
        const taskCard = document.createElement('div');
        taskCard.classList.add('card');
        taskCard.innerHTML = `
          <h3>${task.title}</h3>
          <p>${task.description}</p>
          <div class="progress"><span style="width:0%"></span></div>
        `;
        column.appendChild(taskCard);
      });
    })
    .catch(error => {
      console.error('Error fetching tasks:', error);
    });
});

// Event listener for adding new tasks
document.querySelectorAll('.add-card').forEach(button => {
  button.addEventListener('click', () => {
    const column = button.closest('.column');
    const newCard = document.createElement('div');
    newCard.classList.add('card');
    newCard.innerHTML = `
      <h3>New Task</h3>
      <p>Describe the task...</p>
      <div class="progress"><span style="width:0%"></span></div>
      <button class="save-task">Save Task</button>
    `;
    column.insertBefore(newCard, button);

    // Event listener for saving the new task
    const saveButton = newCard.querySelector('.save-task');
    saveButton.addEventListener('click', () => {
      const title = newCard.querySelector('h3').innerText;
      const description = newCard.querySelector('p').innerText;
      const project_id = 1; 
      
      // Send POST request to add the task to the backend
      fetch('http://localhost/ticktack/backend/add_task.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `title=${title}&description=${description}&project_id=${project_id}`,
      })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          alert(data.message);
        } else {
          alert(data.message);
        }
      })
      .catch(error => {
        console.error('Error saving task:', error);
        alert('There was an error saving the task.');
      });
    });
  });
});

// Redirect to login if the user is not logged in
if (!localStorage.getItem('loggedIn')) {
  window.location.href = 'login.html';
}

// Logout function to clear the session
function logout() {
  console.log("Logging out...");
  localStorage.removeItem('loggedIn');
  window.location.href = 'login.html';
}

// Event listener for logout button
const logoutButton = document.querySelector('.logout-btn');
if (logoutButton) {
  logoutButton.addEventListener('click', logout);
}
