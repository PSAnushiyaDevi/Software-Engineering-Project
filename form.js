// form.js
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById("regUsername").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const teachSkill = document.getElementById("teachSkill").value.trim();
    const learnSkill = document.getElementById("learnSkill").value.trim();
    const location = document.getElementById("location").value.trim();
    const skillDetails = document.getElementById("skillDetails").value.trim();

    // Validate passwords match
    if (password !== confirmPassword) {
      showNotification("Passwords do not match!", 'error');
      return;
    }

    // Create FormData to handle file upload
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('teachSkill', teachSkill);
    formData.append('learnSkill', learnSkill);
    formData.append('location', location);
    formData.append('skillDetails', skillDetails);
    
    // Handle certificate upload
    const certInput = document.getElementById("certificate");
    if (certInput && certInput.files && certInput.files[0]) {
      formData.append('certificate', certInput.files[0]);
    }

    console.log("Sending registration data...");

    try {
      // Send request to backend
      const response = await fetch("/register", {
        method: "POST",
        body: formData  // Send as FormData instead of JSON
      });
      
      // Get response
      const result = await response.json();
      console.log("Registration response:", result);
      
      if (response.ok) {
        // Success
        showNotification("Registration successful! Please login with your new account.");
        window.location.href = "signup.html";
      } else {
        // Error
        showNotification(`Registration failed: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error("Registration error:", error);
      showNotification("Registration failed. Please check your internet connection and try again.", 'error');
    }
  });
}

// Login form handler
const loginForm = document.getElementById("signupForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Get form values
    const email = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    try {
      // Send request to backend
      const response = await fetch("/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });
      
      // Get response
      const result = await response.json();
      console.log("Login response:", result);
      
      if (response.ok) {
        // Success
        showNotification("Login successful!");
        // Save user data to localStorage
        localStorage.setItem('current_user', JSON.stringify(result.user));
        // Redirect to dashboard
        window.location.href = "dashboard.html";
      } else {
        // Error
        showNotification(`Login failed: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error("Login error:", error);
      showNotification("Login failed. Please check your internet connection and try again.", 'error');
    }
  });
}
function showNotification(message, type = 'success') {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => notification.remove());

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  // Add icon based on type
  const icon = document.createElement('div');
  icon.className = 'notification-icon';
  
  if (type === 'success') {
    icon.innerHTML = '<i class="fas fa-check-circle"></i>';
  } else if (type === 'error') {
    icon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
  } else if (type === 'info') {
    icon.innerHTML = '<i class="fas fa-info-circle"></i>';
  } else if (type === 'warning') {
    icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
  }
  
  // Create message text
  const messageText = document.createElement('span');
  messageText.className = 'notification-message';
  messageText.textContent = message;
  
  // Add to notification
  notification.appendChild(icon);
  notification.appendChild(messageText);
  
  // Add to DOM
  document.body.appendChild(notification);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

