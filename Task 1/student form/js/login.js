/**
 * login.js - Admin Portal Authentication
 * Validates admin credentials (username: admin, password: 123) and manages session state.
 */

document.addEventListener('DOMContentLoaded', () => {
  const AUTH_KEY = "sms_admin_auth";

  // If already logged in, redirect directly to dashboard
  if (sessionStorage.getItem(AUTH_KEY) === "true" || (typeof StorageService !== "undefined" && StorageService.isAdminLoggedIn())) {
    window.location.href = 'dashboard.html';
    return;
  }

  const loginForm = document.getElementById('adminLoginForm');
  const usernameInput = document.getElementById('adminUsername');
  const passwordInput = document.getElementById('adminPassword');
  const loginErrorBanner = document.getElementById('loginErrorBanner');
  const loginErrorMessage = document.getElementById('loginErrorMessage');

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const username = usernameInput ? usernameInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      // Clear previous error
      if (loginErrorBanner) loginErrorBanner.style.display = 'none';

      // Check credentials (username: admin, password: 123)
      if (username === 'admin' && password === '123') {
        sessionStorage.setItem(AUTH_KEY, "true");
        if (typeof StorageService !== "undefined") {
          StorageService.setAdminLoggedIn(true);
        }
        window.location.href = 'dashboard.html';
      } else {
        if (loginErrorBanner && loginErrorMessage) {
          loginErrorMessage.textContent = 'Invalid credentials! Default: username: admin, password: 123';
          loginErrorBanner.style.display = 'flex';
        }
        if (passwordInput) {
          passwordInput.value = '';
          passwordInput.focus();
        }
      }
    });
  }
});
