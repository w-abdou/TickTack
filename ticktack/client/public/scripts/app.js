let currentProjectId = null;
let currentView = 'board';
let projects = [];
let tasks = [];

window.addEventListener('load', () => {
  loadProjects();
  setupEventListeners();
  setupSearch();
  setupViewToggle();
  setupTaskFilter();
});

// Load all projects
function loadProjects() {
  fetch('/TickTack/ticktack/backend/get_projects.php')
    .then(response => response.json())
    .then(data => {
      projects = data;
      const projectsList = document.querySelector('.projects');
      projectsList.innerHTML = '';
      
      projects.forEach(project => {
        const li = document.createElement('li');
        li.textContent = project.name;
        li.dataset.projectId = project.id;
        li.addEventListener('click', () => loadProjectTasks(project.id, project.name, project.description));
        projectsList.appendChild(li);
      });

      updateWorkspaceStats();
    })
    .catch(error => {
      console.error('Error loading projects:', error);
    });
}

// Load tasks for a specific project
function loadProjectTasks(projectId, projectName, projectDescription) {
  currentProjectId = projectId;
  document.querySelector('header h1').textContent = projectName;
  document.querySelector('.project-description').textContent = projectDescription || '';

  // Clear existing cards
  document.querySelectorAll('.column .card').forEach(card => card.remove());

  fetch(`/TickTack/ticktack/backend/get_tasks.php?project_id=${projectId}`)
    .then(response => response.json())
    .then(data => {
      tasks = data;
      renderTasks();
      updateTaskCounts();
      updateWorkspaceStats();
    })
    .catch(error => {
      console.error('Error fetching tasks:', error);
    });
}

function renderTasks(filteredTasks = null) {
  const tasksToRender = filteredTasks || tasks;
  
  // Clear existing cards
  document.querySelectorAll('.column .card').forEach(card => card.remove());

  tasksToRender.forEach(task => {
    const column = document.querySelector(`[data-status="${task.status}"]`);
    if (!column) return;

    const taskCard = document.createElement('div');
    taskCard.classList.add('card');
    taskCard.dataset.priority = task.priority || 'low';
    
    const tags = task.tags ? task.tags.split(',').map(tag => 
      `<span class="tag">${tag.trim()}</span>`
    ).join('') : '';

    taskCard.innerHTML = `
      <h3>${task.title}</h3>
      <p>${task.description}</p>
      ${tags ? `<div class="tags">${tags}</div>` : ''}
      <div class="card-meta">
        <span class="priority">Priority: ${task.priority || 'low'}</span>
        ${task.due_date ? `<span class="due-date">Due: ${new Date(task.due_date).toLocaleDateString()}</span>` : ''}
      </div>
    `;

    if (currentView === 'board') {
      column.insertBefore(taskCard, column.querySelector('.column-header'));
    } else {
      const listView = document.querySelector('.list-view');
      if (listView) {
        taskCard.innerHTML += `<span class="status">${task.status}</span>`;
        listView.appendChild(taskCard);
      }
    }
  });

  updateTaskCounts();
}

function setupSearch() {
  const searchInput = document.getElementById('project-search');
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const projectsList = document.querySelector('.projects');
    
    projectsList.childNodes.forEach(li => {
      const projectName = li.textContent.toLowerCase();
      li.style.display = projectName.includes(searchTerm) ? 'block' : 'none';
    });
  });
}

function setupViewToggle() {
  const viewBtns = document.querySelectorAll('.view-btn');
  const board = document.querySelector('.board');
  let listView = document.querySelector('.list-view');

  if (!listView) {
    listView = document.createElement('div');
    listView.className = 'list-view';
    board.parentNode.insertBefore(listView, board.nextSibling);
  }

  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;

      if (currentView === 'board') {
        board.style.display = 'flex';
        listView.style.display = 'none';
      } else {
        board.style.display = 'none';
        listView.style.display = 'flex';
      }

      renderTasks();
    });
  });
}

function setupTaskFilter() {
  const filterSelect = document.getElementById('task-filter');
  filterSelect.addEventListener('change', () => {
    const priority = filterSelect.value;
    const filteredTasks = priority === 'all' ? 
      tasks : 
      tasks.filter(task => task.priority === priority);
    renderTasks(filteredTasks);
  });
}

function updateTaskCounts() {
  document.querySelectorAll('.column').forEach(column => {
    const status = column.dataset.status;
    const count = tasks.filter(task => task.status === status).length;
    column.querySelector('.task-count').textContent = count;
  });
}

function updateWorkspaceStats() {
  document.getElementById('total-projects').textContent = projects.length;
  document.getElementById('total-tasks').textContent = tasks.length;
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
  projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Recheck user session
    const currentUser = checkUser();
    if (!currentUser) return;

    const projectId = document.getElementById('project-id').value;
    const name = document.getElementById('project-name').value.trim();
    const description = document.getElementById('project-description').value.trim();

    if (!name) {
      alert('Project name is required');
      return;
    }

    const isEditing = !!projectId;

    try {
      const url = isEditing 
        ? `/TickTack/ticktack/backend/projects.php?id=${projectId}`
        : '/TickTack/ticktack/backend/projects.php';

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': currentUser.id.toString()
        },
        body: JSON.stringify({ name, description })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        projectModal.style.display = 'none';
        projectForm.reset();
        document.getElementById('project-id').value = '';
        document.getElementById('modal-title').textContent = 'Add New Project';
        document.getElementById('project-submit-btn').textContent = 'Create Project';
        await loadProjects();
      } else {
        throw new Error(data.message || `Failed to ${isEditing ? 'update' : 'create'} project`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert(error.message || 'Failed to create project');
    }
  });

  // Card form submission
  const cardForm = document.getElementById('card-form');
  cardForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('card-title').value;
    const description = document.getElementById('card-description').value;
    const status = cardModal.dataset.status;

    fetch('/TickTack/ticktack/backend/add_task.php', {
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

// Logout function to clear the session
function logout() {
  console.log("Logging out...");
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// Event listener for logout button
const logoutButton = document.querySelector('.logout-btn');
if (logoutButton) {
  logoutButton.addEventListener('click', logout);
}

// Global user variable
let user = null;

// Function to check if user is logged in
function checkUser() {
    try {
        const userData = localStorage.getItem('user');
        if (!userData) {
            window.location.href = 'login.html';
            return null;
        }

        const user = JSON.parse(userData);
        if (!user || !user.id) {
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return null;
        }

        return user;
    } catch (error) {
        console.error('Error checking user:', error);
        localStorage.removeItem('user');
        window.location.href = 'login.html';
        return null;
    }
}

// Global variable to store current project
let currentProject = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const user = checkUser();
    if (!user) return;

    // Modal elements
    const projectModal = document.getElementById('project-modal');
    const closeBtn = document.querySelector('.close');
    const addProjectBtn = document.getElementById('add-project-btn');
    const projectForm = document.getElementById('project-form');
    const logoutBtn = document.getElementById('logout-btn');

    // Disable add card buttons initially
    const addCardBtns = document.querySelectorAll('.add-card');
    addCardBtns.forEach(btn => btn.disabled = true);

    // Add card button click handlers
    addCardBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!currentProject) {
                alert('Please select a project first!');
                return;
            }
            const status = btn.closest('.column').dataset.status;
            addCard(status);
        });
    });

    // Add Project button click handler
    if (addProjectBtn) {
        addProjectBtn.addEventListener('click', () => {
            // Reset form
            projectForm.reset();
            document.getElementById('project-id').value = '';
            document.getElementById('modal-title').textContent = 'Add New Project';
            document.getElementById('project-submit-btn').textContent = 'Create Project';
            projectModal.style.display = 'block';
        });
    }

    // Close button click handler
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            projectModal.style.display = 'none';
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === projectModal) {
            projectModal.style.display = 'none';
        }
    });

    // Project form submission
    if (projectForm) {
        // Remove any existing event listeners
        const newProjectForm = projectForm.cloneNode(true);
        projectForm.parentNode.replaceChild(newProjectForm, projectForm);
        projectForm = newProjectForm;

        projectForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Recheck user session
            const currentUser = checkUser();
            if (!currentUser) return;

            const projectId = document.getElementById('project-id').value;
            const name = document.getElementById('project-name').value.trim();
            const description = document.getElementById('project-description').value.trim();

            if (!name) {
                alert('Project name is required');
                return;
            }

            const isEditing = !!projectId;

            try {
                const url = isEditing 
                    ? `/TickTack/ticktack/backend/projects.php?id=${projectId}`
                    : '/TickTack/ticktack/backend/projects.php';

                console.log('Sending request to:', url);
                console.log('Request data:', { name, description });

                const response = await fetch(url, {
                    method: isEditing ? 'PUT' : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': currentUser.id.toString()
                    },
                    body: JSON.stringify({ name, description })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Server response:', data);
                
                if (data.status === 'success') {
                    // Reset form and modal
                    projectModal.style.display = 'none';
                    projectForm.reset();
                    document.getElementById('project-id').value = '';
                    document.getElementById('modal-title').textContent = 'Add New Project';
                    document.getElementById('project-submit-btn').textContent = 'Create Project';
                    
                    // Reload projects
                    await loadProjects();
                    
                    // If this was a new project, select it
                    if (!isEditing && data.data && data.data.id) {
                        const projectElement = document.querySelector(`[data-project-id="${data.data.id}"]`);
                        if (projectElement) {
                            selectProject(data.data, projectElement);
                        }
                    }
                } else {
                    throw new Error(data.message || `Failed to ${isEditing ? 'update' : 'create'} project`);
                }
            } catch (error) {
                console.error('Error:', error);
                alert(error.message || `Failed to ${isEditing ? 'update' : 'create'} project`);
            }
        });
    }

    // Logout button click handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });
    }

    // Load initial projects
    loadProjects();
});

// Function to edit project
async function editProject(projectId, event) {
    if (!projectId) {
        alert('Project ID is required');
        return;
    }

    if (event) {
        event.stopPropagation(); // Prevent project selection when clicking edit button
    }
    
    const currentUser = checkUser();
    if (!currentUser) return;
    
    try {
        const response = await fetch(`/TickTack/ticktack/backend/projects.php?id=${projectId}`, {
            headers: {
                'Authorization': currentUser.id.toString()
            }
        });
        
        const data = await response.json();
        if (data.status === 'success' && data.data) {
            const project = data.data;
            
            // Update modal for editing
            document.getElementById('modal-title').textContent = 'Edit Project';
            document.getElementById('project-id').value = project.id;
            document.getElementById('project-name').value = project.name;
            document.getElementById('project-description').value = project.description || '';
            document.getElementById('project-submit-btn').textContent = 'Update Project';
            
            // Show modal
            const projectModal = document.getElementById('project-modal');
            if (projectModal) {
                projectModal.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error fetching project:', error);
        alert('Failed to load project details');
    }
}

// Function to delete project
async function deleteProject(projectId, event) {
    if (!projectId) {
        alert('Project ID is required');
        return;
    }

    event.stopPropagation(); // Prevent project selection
    
    if (!confirm('Are you sure you want to delete this project?')) {
        return;
    }
    
    const currentUser = checkUser();
    if (!currentUser) return;
    
    try {
        const response = await fetch(`/TickTack/ticktack/backend/projects.php?id=${projectId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': currentUser.id.toString()
            }
        });
        
        const data = await response.json();
        if (data.status === 'success') {
            // Clear current project if it was deleted
            if (currentProject && currentProject.id === projectId) {
                currentProject = null;
                const header = document.querySelector('.main-header h1');
                if (header) {
                    header.textContent = 'Select a Project';
                }
                // Disable add card buttons
                const addCardBtns = document.querySelectorAll('.add-card');
                addCardBtns.forEach(btn => btn.disabled = true);
            }
            await loadProjects(); // Refresh projects list
        } else {
            throw new Error(data.message || 'Failed to delete project');
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project');
    }
}

// Function to add a new card
async function addCard(status) {
    if (!currentProject) {
        alert('Please select a project first!');
        return;
    }

    const title = prompt('Enter card title:');
    if (!title) return;

    const currentUser = checkUser();
    if (!currentUser) return;

    try {
        const response = await fetch('/TickTack/ticktack/backend/cards.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': currentUser.id.toString()
            },
            body: JSON.stringify({
                title,
                status,
                project_id: currentProject.id
            })
        });

        const data = await response.json();
        if (data.status === 'success') {
            loadCards(currentProject.id);
        } else {
            throw new Error(data.message || 'Failed to create card');
        }
    } catch (error) {
        console.error('Error creating card:', error);
        alert('Failed to create card');
    }
}

// Function to handle project selection
function selectProject(project, element) {
    currentProject = project;
    
    // Update UI to show selected project
    const allProjects = document.querySelectorAll('.projects li');
    allProjects.forEach(li => li.classList.remove('active'));
    
    // Add active class to selected project
    if (element) {
        element.classList.add('active');
    }
    
    // Update header with project name
    const header = document.querySelector('.main-header h1');
    if (header) {
        header.textContent = project.name;
    }

    // Enable add card buttons
    const addCardBtns = document.querySelectorAll('.add-card');
    addCardBtns.forEach(btn => btn.disabled = false);

    // Load cards for the selected project
    loadCards(project.id);
}

// Function to load cards for a project
async function loadCards(projectId) {
    const currentUser = checkUser();
    if (!currentUser) return;

    try {
        const response = await fetch(`/TickTack/ticktack/backend/cards.php?project_id=${projectId}`, {
            headers: {
                'Authorization': currentUser.id.toString()
            }
        });

        const data = await response.json();
        if (data.status === 'success') {
            displayCards(data.data || []);
        }
    } catch (error) {
        console.error('Error loading cards:', error);
    }
}

function displayCards(cards) {
    const todoColumn = document.querySelector('.todo-column .cards');
    const inProgressColumn = document.querySelector('.in-progress-column .cards');
    const completedColumn = document.querySelector('.completed-column .cards');

    // Clear existing cards
    todoColumn.innerHTML = '';
    inProgressColumn.innerHTML = '';
    completedColumn.innerHTML = '';

    // Display cards in their respective columns
    cards.forEach(card => {
        const cardElement = createCardElement(card);
        switch (card.status) {
            case 'todo':
                todoColumn.appendChild(cardElement);
                break;
            case 'in_progress':
                inProgressColumn.appendChild(cardElement);
                break;
            case 'completed':
                completedColumn.appendChild(cardElement);
                break;
        }
    });
}

function createCardElement(card) {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
        <h3>${card.title}</h3>
        ${card.description ? `<p>${card.description}</p>` : ''}
        <div class="card-actions">
            <button onclick="editCard(${card.id})">Edit</button>
            <button onclick="deleteCard(${card.id})">Delete</button>
        </div>
    `;
    return div;
}

// Function to display projects
function displayProjects(projects) {
    const todoColumn = document.querySelector('.todo-column .cards');
    const inProgressColumn = document.querySelector('.in-progress-column .cards');
    const completedColumn = document.querySelector('.completed-column .cards');

    // Clear existing cards
    todoColumn.innerHTML = '';
    inProgressColumn.innerHTML = '';
    completedColumn.innerHTML = '';

    if (!projects || projects.length === 0) {
        todoColumn.innerHTML = '<div class="empty-message">No projects yet</div>';
        return;
    }

    projects.forEach(project => {
        const card = createProjectCard(project);
        switch (project.status) {
            case 'in_progress':
                inProgressColumn.appendChild(card);
                break;
            case 'completed':
                completedColumn.appendChild(card);
                break;
            default: // 'active' or any other status
                todoColumn.appendChild(card);
        }
    });
}

function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <h3>${project.name}</h3>
        ${project.description ? `<p>${project.description}</p>` : ''}
        <div class="card-actions">
            <button onclick="editProject(${project.id})">Edit</button>
            <button onclick="deleteProject(${project.id})">Delete</button>
        </div>
    `;
    return card;
}

// Function to load projects
async function loadProjects() {
    const currentUser = checkUser();
    if (!currentUser) return;

    try {
        const response = await fetch('/TickTack/ticktack/backend/projects.php', {
            headers: {
                'Authorization': currentUser.id.toString()
            }
        });

        const data = await response.json();
        if (data.status === 'success') {
            displayProjects(data.data || []);
        }
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}