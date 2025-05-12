document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const res = await fetch('backend/login.php', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();

if (data.success) {
  console.log("Login success, redirecting...");
  localStorage.setItem('loggedIn', true);
  localStorage.setItem('username', data.username);  
  window.location.href = 'homepage.html';  
} else {
  alert(data.message);
}

});
