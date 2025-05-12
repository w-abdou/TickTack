document.getElementById('signupForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const res = await fetch('backend/signup.php', {
    method: 'POST',
    body: JSON.stringify({ username, email, password })
  });
  const data = await res.json();

  if (data.success) {
    alert('Signup successful. You can now log in.');
    window.location.href = 'login.html';
  } else {
    alert(data.message);
  }
});
