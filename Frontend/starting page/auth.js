const API_BASE = (window.location.origin.includes('3000') || window.location.protocol === 'file:')
    ? '/api/auth'
    : 'http://localhost:3000/api/auth';
let activeEmailForOtp = '';

// Check logged in status on page load
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        fetchUserProfile();
    }
});

// UI Tab Switcher
function switchTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const otpForm = document.getElementById('otp-form');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const tabsHeader = document.getElementById('auth-tabs');

    if (tabsHeader) tabsHeader.classList.remove('hidden');
    if (loginForm) loginForm.classList.remove('active');
    if (registerForm) registerForm.classList.remove('active');
    if (otpForm) otpForm.classList.remove('active');
    if (tabLogin) tabLogin.classList.remove('active');
    if (tabRegister) tabRegister.classList.remove('active');

    if (tab === 'login') {
        if (loginForm) loginForm.classList.add('active');
        if (tabLogin) tabLogin.classList.add('active');
    } else if (tab === 'register') {
        if (registerForm) registerForm.classList.add('active');
        if (tabRegister) tabRegister.classList.add('active');
    } else if (tab === 'otp') {
        if (tabsHeader) tabsHeader.classList.add('hidden');
        if (otpForm) otpForm.classList.add('active');
    }
}

// Password visibility toggle
function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Toast Notifications
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = 'background:#333;color:#fff;padding:12px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-size:14px;display:flex;align-items:center;gap:10px;';
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') { iconClass = 'fa-circle-check'; toast.style.background = '#2e6b3e'; }
    if (type === 'error') { iconClass = 'fa-triangle-exclamation'; toast.style.background = '#c73838'; }

    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// REGISTER HANDLER
async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    const btn = document.getElementById('register-btn');
    btn.disabled = true;
    btn.innerHTML = '<span>Creating Account...</span> <i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Registration successful! Please verify your OTP code.', 'success');
            activeEmailForOtp = email;
            const targetEl = document.getElementById('target-otp-email');
            if (targetEl) targetEl.innerText = email;
            switchTab('otp');
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
    } catch (err) {
        showToast('Network error connecting to backend server', 'error');
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Create Account</span> <i class="fa-solid fa-user-check"></i>';
    }
}

// VERIFY OTP HANDLER
async function handleVerifyOtp(e) {
    e.preventDefault();
    const otp = document.getElementById('otp-code').value.trim();
    const email = activeEmailForOtp || document.getElementById('reg-email').value.trim();

    if (!email) {
        showToast('Missing email address for OTP verification', 'error');
        return;
    }

    const btn = document.getElementById('otp-btn');
    btn.disabled = true;
    btn.innerHTML = '<span>Verifying...</span> <i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const response = await fetch(`${API_BASE}/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Email verified successfully! You can now log in.', 'success');
            const loginEmailEl = document.getElementById('login-email');
            if (loginEmailEl) loginEmailEl.value = email;
            switchTab('login');
        } else {
            showToast(data.message || 'Invalid or expired OTP', 'error');
        }
    } catch (err) {
        showToast('Network error verifying OTP', 'error');
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Verify Email</span> <i class="fa-solid fa-check-double"></i>';
    }
}

// LOGIN HANDLER
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.innerHTML = '<span>Authenticating...</span> <i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Logged in successfully! Redirecting to profile...', 'success');
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('ayush_user_profile', JSON.stringify({
                isLoggedIn: true,
                user: data.user,
                token: data.accessToken
            }));
            renderDashboard(data.user, data.accessToken);
            setTimeout(() => {
                window.location.href = '/profile';
            }, 700);
        } else {
            showToast(data.message || 'Invalid credentials', 'error');
            if (data.message && data.message.toLowerCase().includes('email not verified')) {
                activeEmailForOtp = email;
                const targetEl = document.getElementById('target-otp-email');
                if (targetEl) targetEl.innerText = email;
                switchTab('otp');
            }
        }
    } catch (err) {
        showToast('Network error during login', 'error');
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Sign In</span> <i class="fa-solid fa-arrow-right"></i>';
    }
}

// FETCH USER PROFILE
async function fetchUserProfile() {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE}/get-me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok && data.user) {
            renderDashboard(data.user, token);
        } else {
            attemptRefreshToken();
        }
    } catch (err) {
        console.error('Error fetching profile:', err);
    }
}

// REFRESH TOKEN FALLBACK
async function attemptRefreshToken() {
    try {
        const response = await fetch(`${API_BASE}/refresh-token`, {
            method: 'GET'
        });
        const data = await response.json();
        if (response.ok && data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken);
            fetchUserProfile();
        } else {
            localStorage.removeItem('accessToken');
            showLoggedOutUI();
        }
    } catch (err) {
        localStorage.removeItem('accessToken');
        showLoggedOutUI();
    }
}

// LOGOUT HANDLER
async function handleLogout() {
    try {
        await fetch(`${API_BASE}/logout`, { method: 'GET' });
    } catch (err) {
        console.error(err);
    } finally {
        localStorage.removeItem('accessToken');
        showToast('Logged out successfully', 'info');
        showLoggedOutUI();
    }
}

// LOGOUT ALL DEVICES HANDLER
async function handleLogoutAll() {
    try {
        await fetch(`${API_BASE}/logout-all`, { method: 'GET' });
    } catch (err) {
        console.error(err);
    } finally {
        localStorage.removeItem('accessToken');
        showToast('Logged out from all devices', 'info');
        showLoggedOutUI();
    }
}

// Modal Controls
function openAuthModal(e) {
    if (e) e.preventDefault();
    const modal = document.getElementById('auth-modal-overlay');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal-overlay');
    if (modal) {
        modal.classList.remove('active');
    }
}

// RENDER DASHBOARD
function renderDashboard(user, token) {
    const navLink = document.getElementById('nav-login-link');
    if (navLink) {
        navLink.innerHTML = `<a href="../profile/dist/index.html" style="color:#2e6b3e;font-weight:700;text-decoration:none;"><i class="fa-solid fa-circle-user" style="margin-right:4px;"></i> ${user.username} (Profile)</a>`;
    }

    const authCard = document.getElementById('auth-card');
    const dashCard = document.getElementById('dashboard-card');
    if (authCard) authCard.classList.add('hidden');
    if (dashCard) dashCard.classList.remove('hidden');

    const dashUsername = document.getElementById('dash-username');
    const dashUserVal = document.getElementById('dash-user-val');
    const dashEmailVal = document.getElementById('dash-email-val');
    const dashTokenVal = document.getElementById('dash-token-val');

    if (dashUsername) dashUsername.innerText = `Welcome, ${user.username}!`;
    if (dashUserVal) dashUserVal.innerText = user.username;
    if (dashEmailVal) dashEmailVal.innerText = user.email;
    if (dashTokenVal) dashTokenVal.innerText = token || 'Cookie session active';
}

// SHOW LOGGED OUT UI
function showLoggedOutUI() {
    const navLink = document.getElementById('nav-login-link');
    if (navLink) {
        navLink.innerText = 'Login / Register';
    }

    const dashCard = document.getElementById('dashboard-card');
    const authCard = document.getElementById('auth-card');
    if (dashCard) dashCard.classList.add('hidden');
    if (authCard) authCard.classList.remove('hidden');
    switchTab('login');
}
