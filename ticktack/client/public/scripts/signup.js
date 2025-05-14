document.getElementById('signupForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Client-side validation
    if (!username || !email || !password) {
        alert('Please fill in all fields');
        return;
    }

    if (!email.includes('@')) {
        alert('Please enter a valid email address');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }
    
    try {
        const response = await fetch('/TickTack/ticktack/backend/signup.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            throw new Error('Server returned non-JSON response');
        }
        
        if (data.status === 'success') {
            alert('Account created successfully! Please log in.');
            window.location.href = 'login.html';
        } else {
            alert(data.message || 'Failed to create account');
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('Failed to create account. Please try again.');
    }
});

