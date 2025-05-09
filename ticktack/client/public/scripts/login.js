document.querySelector('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.querySelector('#email').value;
  const password = document.querySelector('#password').value;

  const response = await fetch('backend/login.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const result = await response.json();

  if (result.success) {
    localStorage.setItem('loggedIn', true);
    localStorage.setItem('username', result.username);
    window.location.href = 'index.html';
  } else {
    alert(result.message);
  }
});
