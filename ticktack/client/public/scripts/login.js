document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    try {
        const response = await fetch('/TickTack/ticktack/backend/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            throw new Error('Server returned non-JSON response');
        }
        
        if (data.status === 'success' && data.user && data.user.id) {
            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify({
                id: data.user.id,
                username: data.user.username,
                email: data.user.email
            }));
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            throw new Error(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert(error.message || 'Invalid email or password');
    }
});

// Clear any existing user data when the login page loads
document.addEventListener('DOMContentLoaded', function() {
    localStorage.removeItem('user');
});

