
let currentProjectId = null;

window.addEventListener('load', () => {
  loadProjects();
  setupEventListeners();
});

// Load all projects
function loadProjects() {
  fetch('http://localhost/ticktack/backend/get_projects.php')
    .then(response => response.json())
    .then(projects => {
      const projectsList = document.querySelector('.projects');
      projectsList.innerHTML = '';
      
      projects.forEach(project => {
        const li = document.createElement('li');
        li.textContent = project.name;
        li.dataset.projectId = project.id;
        li.addEventListener('click', () => loadProjectTasks(project.id, project.name));
        projectsList.appendChild(li);
      });
    })
    .catch(error => {
      console.error('Error loading projects:', error);
    });
}

// Load tasks for a specific project
function loadProjectTasks(projectId, projectName) {
  currentProjectId = projectId;
  document.querySelector('header h1').textContent = projectName;

  // Clear existing cards
  document.querySelectorAll('.column .card').forEach(card => card.remove());

  fetch(`http://localhost/ticktack/backend/get_tasks.php?project_id=${projectId}`)
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
        column.insertBefore(taskCard, column.querySelector('.add-card'));
      });
    })
    .catch(error => {
      console.error('Error fetching tasks:', error);
    });
}

function setupEventListeners() {
  // Project modal functionality
  const projectModal = document.getElementById('project-modal');
  const addProjectBtn = document.getElementById('add-project-btn');
  const projectForm = document.getElementById('project-form');

  addProjectBtn.addEventListener('click', () => {
    projectModal.style.display = 'block';
  });

  // Card modal functionality
  const cardModal = document.getElementById('card-modal');
  document.querySelectorAll('.add-card').forEach(button => {
    button.addEventListener('click', () => {
      if (!currentProjectId) {
        alert('Please select a project first!');
        return;
      }
      const column = button.closest('.column');
      cardModal.dataset.status = column.dataset.status;
      cardModal.style.display = 'block';
    });
  });

  // Close modal functionality
  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
      closeBtn.closest('.modal').style.display = 'none';
    });
  });

  // Project form submission
  projectForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('project-name').value;
    const description = document.getElementById('project-description').value;

    fetch('http://localhost/ticktack/backend/add_project.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `name=${encodeURIComponent(name)}&description=${encodeURIComponent(description)}`,
    })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        projectModal.style.display = 'none';
        projectForm.reset();
        loadProjects();
      }
      alert(data.message);
    })
    .catch(error => {
      console.error('Error creating project:', error);
      alert('There was an error creating the project.');
    });
  });

  // Card form submission
  const cardForm = document.getElementById('card-form');
  cardForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('card-title').value;
    const description = document.getElementById('card-description').value;
    const status = cardModal.dataset.status;

    fetch('http://localhost/ticktack/backend/add_task.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&project_id=${currentProjectId}&status=${status}`,
    })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        cardModal.style.display = 'none';
        cardForm.reset();
        loadProjectTasks(currentProjectId, document.querySelector('header h1').textContent);
      }
      alert(data.message);
    })
    .catch(error => {
      console.error('Error saving task:', error);
      alert('There was an error saving the task.');
    });
  });
}

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
