document.querySelectorAll('.add-card').forEach(button => {
  button.addEventListener('click', () => {
    const column = button.closest('.column');
    const newCard = document.createElement('div');
    newCard.classList.add('card');
    newCard.innerHTML = `
      <p class="tag" style="background:#3498db; color:white;">New</p>
      <h3>New Task</h3>
      <p>Describe the task...</p>
      <div class="progress"><span style="width:0%"></span></div>
    `;
    column.insertBefore(newCard, button);
  });
});

// Redirect to login if not logged in
if (!localStorage.getItem('loggedIn')) {
  window.location.href = 'login.html';
}
//logout function
function logout() {
  localStorage.removeItem('loggedIn');
  window.location.href = 'login.html';
}


// Optional: Drag & Drop (Basic)
let dragged;
document.querySelectorAll('.card').forEach(card => {
  card.draggable = true;

  card.addEventListener('dragstart', e => {
    dragged = card;
    setTimeout(() => card.style.display = "none", 0);
  });

  card.addEventListener('dragend', e => {
    setTimeout(() => {
      dragged.style.display = "block";
      dragged = null;
    }, 0);
  });
});

document.querySelectorAll('.column').forEach(column => {
  column.addEventListener('dragover', e => e.preventDefault());
  column.addEventListener('drop', e => {
    if (dragged) column.insertBefore(dragged, column.querySelector('.add-card'));
  });
});