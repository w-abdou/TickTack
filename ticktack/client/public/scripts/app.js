let currentProjectId = null;
let currentView = 'board';
let projects = [];
let tasks = [];

window.addEventListener('load', () => {
  setupEventListeners();
  setupSearch();
  setupViewToggle();
  // setupTaskFilter();
});

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in first
    const user = checkUser();
    if (!user) {
        // checkUser should handle redirection, so just return here
        return;
    }

    // If a project_id is in the URL, load that project directly
    const projectId = getProjectIdFromUrl();
    if (projectId) {
        // Fetch project info (name, description) from backend and then load tasks
        // Pass the user object to the fetch headers
        fetch(`/TickTack/ticktack/backend/projects.php?id=${projectId}`, {
          headers: {
            'Authorization': user.id.toString() // Use the user object obtained at the start
          }
        })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success' && data.data) {
            // When loading a specific project, we still need tasks, which might need user, but loadProjectTasks doesn't currently take user
            // Let's keep loadProjectTasks calling checkUser for now, and focus on passing user to initializeApp path
            loadProjectTasks(data.data.id, data.data.name, data.data.description);
          } else {
            console.error('Error loading project from URL:', data.message);
            alert('Failed to load project from URL.');
            // Optionally redirect to homepage if project loading fails
            // window.location.href = 'home.html';
          }
        })
        .catch(error => {
          console.error('Error fetching project details for URL ID:', error);
          alert('Failed to fetch project details.');
          // Optionally redirect to homepage on error
          // window.location.href = 'home.html';
        });
    } else {
        // Otherwise, initialize the full app, passing the user object
        initializeApp(user);
    }
});

function initializeApp(user) { // Accept user object
    // Load initial projects, passing the user object
    loadProjects(user);

    // Setup event listeners
    setupEventListeners();
    setupSearch();
    setupViewToggle();

    // Setup drag and drop
    setupDragAndDrop();
}

function setupDragAndDrop() {
    document.querySelectorAll('.column').forEach(column => {
        column.addEventListener('dragover', e => {
            e.preventDefault();
            const draggingCard = document.querySelector('.dragging');
            if (draggingCard) {
                column.querySelector('.cards').appendChild(draggingCard);
            }
        });

        column.addEventListener('drop', async e => {
            e.preventDefault();
            const taskId = e.dataTransfer.getData('text/plain');
            const newStatus = column.dataset.status;
            
            try {
                const response = await fetch(`/TickTack/ticktack/backend/tasks.php?id=${taskId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: newStatus })
                });

                const data = await response.json();
                if (data.status === 'success') {
                    loadProjectTasks(currentProjectId);
                }
            } catch (error) {
                console.error('Error updating task status:', error);
            }
        });
    });
}

// Load all projects
async function loadProjects(user) { // Accept user object
    // Remove internal checkUser call, rely on user being passed
    // const currentUser = checkUser(); // REMOVED
    // if (!currentUser) return; // REMOVED

    console.log('Loading projects for user:', user.id); // Use passed user

    try {
        const response = await fetch('/TickTack/ticktack/backend/projects.php', {
            headers: {
                'Authorization': user.id.toString() // Use passed user
            }
        });
        console.log('Projects response:', response);
        const data = await response.json();
        console.log('Projects data:', data);
        if (data.status === 'success') {
            projects = data.data;
            const projectsList = document.querySelector('.projects');
            projectsList.innerHTML = '';
            
            if (!projects || projects.length === 0) {
                projectsList.innerHTML = '<li class="no-projects">No projects yet</li>';
                return;
            }
            
            projects.forEach(project => {
                const li = document.createElement('li');
                // Keep onclick/event listeners as is for now, they call functions that checkUser internally
                li.innerHTML = `
                    <span class="project-name">${project.name}</span>
                    <div class="project-actions">
                        <button onclick="editProject(${project.id}, event)" class="edit-btn">✏️</button>
                        <button onclick="deleteProject(${project.id}, event)" class="delete-btn">🗑️</button>
                    </div>
                `;
                li.addEventListener('click', () => loadProjectTasks(project.id, project.name, project.description));
                projectsList.appendChild(li);
            });

            updateWorkspaceStats();
        } else {
            throw new Error(data.message || 'Failed to load projects');
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        const projectsList = document.querySelector('.projects');
        projectsList.innerHTML = '<li class="no-projects">Error loading projects</li>';
    }
}

// Load tasks for a specific project
async function loadProjectTasks(projectId, projectName, projectDescription) {
  currentProjectId = projectId;
  document.querySelector('header h1').textContent = projectName;
  document.querySelector('.project-description').textContent = projectDescription || '';

  // Enable add card buttons
  document.querySelectorAll('.add-card').forEach(btn => btn.disabled = false);

  // Clear existing cards
  document.querySelectorAll('.column .cards').forEach(container => container.innerHTML = '');

  try {
    const response = await fetch(`/TickTack/ticktack/backend/tasks.php?project_id=${projectId}`);
    const data = await response.json();
    if (data.status === 'success') {
      tasks = data.data;
      renderTasks();
      updateTaskCounts();
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
  }
}

function renderTasks(tasksToRender = tasks) {
  const columns = {
    'todo': document.querySelector('.todo-column .cards'),
    'in-work': document.querySelector('.in-work-column .cards'),
    'in-progress': document.querySelector('.in-progress-column .cards'),
    'completed': document.querySelector('.column[data-status="completed"] .cards')
  };

  // Clear all columns
  Object.values(columns).forEach(column => column.innerHTML = '');

  // Render tasks in their respective columns
  tasksToRender.forEach(task => {
    const card = createTaskCard(task);
    const column = columns[task.status] || columns['todo'];
    column.appendChild(card);
  });
}

function createTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.taskId = task.id;
  card.draggable = true;

  const priorityClass = `priority-${task.priority}`;
  const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date';

  card.innerHTML = `
    <div class="card-header">
      <h3>${task.title}</h3>
      <span class="priority ${priorityClass}">${task.priority}</span>
    </div>
    <p class="card-description">${task.description || ''}</p>
    <div class="card-footer">
      <div class="card-meta">
        <span class="due-date">${dueDate}</span>
      </div>
      <div class="card-actions">
        <button onclick="editTask(${task.id}, event)" class="edit-btn">✏️</button>
        <button onclick="deleteTask(${task.id}, event)" class="delete-btn">🗑️</button>
      </div>
    </div>
  `;

  // Add drag and drop functionality
  card.addEventListener('dragstart', handleDragStart);
  card.addEventListener('dragend', handleDragEnd);

  return card;
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
  const sortSelect = document.getElementById('task-sort');
  
  filterSelect.addEventListener('change', () => {
    const priority = filterSelect.value;
    const sortBy = sortSelect.value;
    filterAndSortTasks(priority, sortBy);
  });

  sortSelect.addEventListener('change', () => {
    const priority = filterSelect.value;
    const sortBy = sortSelect.value;
    filterAndSortTasks(priority, sortBy);
  });
}

function filterAndSortTasks(priority, sortBy) {
  let filteredTasks = [...tasks];
  
  // Apply priority filter
  if (priority !== 'all') {
    filteredTasks = filteredTasks.filter(task => task.priority === priority);
  }
  
  // Apply sorting
  switch (sortBy) {
    case 'due-date-asc':
      filteredTasks.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      });
      break;
    case 'due-date-desc':
      filteredTasks.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(b.due_date) - new Date(a.due_date);
      });
      break;
    case 'priority-high':
      filteredTasks.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
      break;
    case 'priority-low':
      filteredTasks.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
      break;
    case 'created-desc':
      filteredTasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
    case 'created-asc':
      filteredTasks.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      break;
  }
  
  renderTasks(filteredTasks);
}

function updateTaskCounts() {
  document.querySelectorAll('.column').forEach(column => {
    const status = column.dataset.status;
    const count = tasks.filter(task => task.status === status).length;
    column.querySelector('.task-count').textContent = count;
  });
}

function updateWorkspaceStats() {
  const totalProjects = document.getElementById('total-projects');
  const totalTasks = document.getElementById('total-tasks');
  
  if (totalProjects) {
    totalProjects.textContent = projects.length;
  }
  
  if (totalTasks) {
    totalTasks.textContent = tasks.length;
  }
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
  const cardForm = document.getElementById('card-form');

  // Add event listeners to all .add-card buttons
  document.querySelectorAll('.add-card').forEach(button => {
    button.addEventListener('click', function() {
      const column = this.closest('.column');
      const status = column.dataset.status;
      addTask(status); // Just call addTask with the status
    });
  });

  // Card form submit handler (OUTSIDE of addTask)
  cardForm.addEventListener('submit', handleCardFormSubmit);

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
    const currentUser = checkUser(); // Ensure this is the first use of currentUser in this scope
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
          'Authorization': currentUser.id.toString() // Should be safe now
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
        console.log('checkUser: userData from localStorage', userData); // Log userData

        if (!userData) {
            console.log('checkUser: No userData, redirecting to login.html'); // Log redirect
            window.location.href = 'login.html';
            return null;
        }

        const user = JSON.parse(userData);
        console.log('checkUser: Parsed user object', user); // Log parsed user

        if (!user || !user.id) {
            console.log('checkUser: Invalid user object or missing ID, clearing localStorage and redirecting', user); // Log invalid user
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return null;
        }

        console.log('checkUser: Valid user found', user); // Log valid user
        return user;
    } catch (error) {
        console.error('Error checking user:', error); // Log error
        localStorage.removeItem('user');
        window.location.href = 'login.html';
        return null;
    }
}

// Global variable to store current project
let currentProject = null;

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

// Function to add a new task
function addTask(status) {
  const cardModal = document.getElementById('card-modal');
  const cardForm = document.getElementById('card-form');
  const projectSelectRow = document.getElementById('project-select-row');
  const projectSelect = document.getElementById('modal-project-select');

  // Set the current status for the form handler to use
  currentTaskStatus = status;

  // Reset form
  cardForm.reset();

  // If no project is selected, show the project dropdown and populate it
  if (!currentProjectId) {
    projectSelectRow.style.display = '';
    projectSelect.innerHTML = '';
    // Populate dropdown with all projects
    projects.forEach(project => {
      const option = document.createElement('option');
      option.value = project.id;
      option.textContent = project.name;
      projectSelect.appendChild(option);
    });
  } else {
    projectSelectRow.style.display = 'none';
  }

  // Show modal
  cardModal.style.display = 'block';
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

// Drag and drop functionality
function handleDragStart(e) {
  e.target.classList.add('dragging');
  e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
}

// Helper to get project_id from URL
function getProjectIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('project_id');
}

// Card form submit handler (OUTSIDE of addTask)
async function handleCardFormSubmit(e) {
  e.preventDefault();

  const cardForm = document.getElementById('card-form');
  const projectSelect = document.getElementById('modal-project-select');
  let projectIdToUse = currentProjectId;
  if (!projectIdToUse) {
    projectIdToUse = projectSelect.value;
  }

  const taskData = {
    title: document.getElementById('card-title').value,
    description: document.getElementById('card-description').value,
    priority: document.getElementById('card-priority').value,
    due_date: document.getElementById('card-due-date').value,
    tags: document.getElementById('card-tags').value,
    status: currentTaskStatus,
    project_id: projectIdToUse
  };

  try {
    const currentUser = checkUser();
    if (!currentUser) return;

    if (typeof currentUser !== 'object' || currentUser === null || !currentUser.id) {
      console.error('Invalid currentUser object:', currentUser);
      alert('User authentication failed. Please log in again.');
      logout();
      return;
    }

    // Check if we're editing an existing task
    const taskId = cardForm.dataset.taskId;
    const isEditing = !!taskId;

    if (isEditing) {
      taskData.id = taskId;
    }

    const response = await fetch('/TickTack/ticktack/backend/tasks.php' + (isEditing ? `?id=${taskId}` : ''), {
      method: isEditing ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': currentUser.id.toString()
      },
      body: JSON.stringify(taskData)
    });

    const data = await response.json();

    if (data.status === 'success') {
      document.getElementById('card-modal').style.display = 'none';
      cardForm.reset();
      cardForm.removeAttribute('data-task-id'); // Clear task ID
      document.getElementById('modal-title').textContent = 'Add New Task';
      if (currentProjectId) {
        loadProjectTasks(currentProjectId);
      }
    } else {
      throw new Error(data.message || `Failed to ${isEditing ? 'update' : 'create'} task`);
    }
  } catch (error) {
    console.error('Error handling task:', error);
    alert(error.message);
  }
}

// Function to edit a task
async function editTask(taskId, event) {
    if (event) {
        event.stopPropagation(); // Prevent card click event
    }

    const currentUser = checkUser();
    if (!currentUser) return;

    try {
        // Fetch task details
        const response = await fetch(`/TickTack/ticktack/backend/tasks.php?id=${taskId}`, {
            headers: {
                'Authorization': currentUser.id.toString()
            }
        });
        
        const data = await response.json();
        if (data.status === 'success' && data.data) {
            const task = data.data;
            
            // Update modal for editing
            const cardModal = document.getElementById('card-modal');
            const cardForm = document.getElementById('card-form');
            const modalTitle = document.getElementById('modal-title');
            
            modalTitle.textContent = 'Edit Task';
            document.getElementById('card-title').value = task.title;
            document.getElementById('card-description').value = task.description || '';
            document.getElementById('card-priority').value = task.priority;
            document.getElementById('card-due-date').value = task.due_date || '';
            document.getElementById('card-tags').value = task.tags || '';
            
            // Store task ID for update
            cardForm.dataset.taskId = taskId;
            
            // Show modal
            cardModal.style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching task:', error);
        alert('Failed to load task details');
    }
}

// Function to delete a task
async function deleteTask(taskId, event) {
    if (event) {
        event.stopPropagation(); // Prevent card click event
    }

    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    const currentUser = checkUser();
    if (!currentUser) return;

    try {
        const response = await fetch(`/TickTack/ticktack/backend/tasks.php?id=${taskId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': currentUser.id.toString()
            },
            body: JSON.stringify({
                id: taskId,
                project_id: currentProjectId
            })
        });

        const data = await response.json();
        if (data.status === 'success') {
            // Refresh tasks
            loadProjectTasks(currentProjectId);
        } else {
            throw new Error(data.message || 'Failed to delete task');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task');
    }
}