// header.js
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.header');
  const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
  
  // Create a style element to force our logo styles
  const style = document.createElement('style');
  style.innerHTML = `
    .tiny-logo {
      width: 40px !important;
      height: 40px !important;
      border-radius: 50% !important;
      object-fit: cover !important;
      margin-right: 10px !important;
      display: inline-block !important;
      vertical-align: middle !important;
      border: none !important;
      padding: 0 !important;
      background: none !important;
      box-shadow: none !important;
      max-width: none !important;
      max-height: none !important;
      min-width: 40px !important;
      min-height: 40px !important;
      overflow: hidden !important;
    }
  `;
  document.head.appendChild(style);
  
  // Find the brand-left container
  const brandLeft = header.querySelector('.brand-left');
  if (brandLeft) {
    // Remove any existing logo elements
    const existingLogos = brandLeft.querySelectorAll('.logo, img');
    existingLogos.forEach(logo => logo.remove());
    
    // Create a new container for the logo
    const logoContainer = document.createElement('div');
    logoContainer.style.cssText = `
      display: inline-block;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
      margin-right: 10px;
      vertical-align: middle;
      flex-shrink: 0;
    `;
    
    // Create a new image element for the logo
    const logoImg = document.createElement('img');
    logoImg.src = 'project logo.png';
    logoImg.alt = 'The Talented Trove';
    logoImg.className = 'tiny-logo';
    
    // Append the image to the container
    logoContainer.appendChild(logoImg);
    
    // Insert the container at the beginning of the brand-left
    brandLeft.insertBefore(logoContainer, brandLeft.firstChild);
    
    // Force styles with a timeout
    setTimeout(() => {
      // Force container styles
      logoContainer.style.cssText += `
        width: 40px !important;
        height: 40px !important;
        border-radius: 50% !important;
        overflow: hidden !important;
        margin-right: 10px !important;
        vertical-align: middle !important;
        flex-shrink: 0 !important;
      `;
      
      // Force image styles
      logoImg.style.cssText = `
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        border: none !important;
        padding: 0 !important;
        margin: 0 !important;
        display: block !important;
      `;
    }, 200);
  }
  
  // Check if user is logged in
  if (currentUser && currentUser.email) {
    // Create user profile element
    const userProfile = document.createElement('div');
    userProfile.className = 'user-profile';
    
    // Create avatar with user's initial
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = currentUser.name.charAt(0).toUpperCase();
    
    // Create user name
    const userName = document.createElement('span');
    userName.className = 'user-name';
    userName.textContent = currentUser.name;
    
    // Create dropdown menu
    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown';
    
    // Add dropdown items
    const dashboardLink = document.createElement('a');
    dashboardLink.href = 'dashboard.html';
    dashboardLink.textContent = 'Dashboard';
    
    const profileLink = document.createElement('a');
    profileLink.href = 'profile.html';
    profileLink.textContent = 'My Profile';
    
    const messagesLink = document.createElement('a');
    messagesLink.href = 'messages.html';
    messagesLink.innerHTML = `Messages <span id="unreadCount" style="background: red; color: white; border-radius: 50%; padding: 2px 6px; font-size: 0.8em; display: none;">0</span>`;
    
    const logoutLink = document.createElement('a');
    logoutLink.href = '#';
    logoutLink.textContent = 'Logout';
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('current_user');
      window.location.href = 'index.html';
    });
    
    // Add elements to DOM
    dropdown.appendChild(dashboardLink);
    dropdown.appendChild(profileLink);
    dropdown.appendChild(messagesLink);
    dropdown.appendChild(logoutLink);
    
    userProfile.appendChild(avatar);
    userProfile.appendChild(userName);
    userProfile.appendChild(dropdown);
    
    // Add user profile to header
    header.appendChild(userProfile);
    
    // Check for unread messages
    let lastUnreadCount = parseInt(localStorage.getItem('lastUnreadCount') || '0');
    
    async function checkUnreadMessages() {
      try {
        const response = await fetch(`http://localhost:5000/messages/unread-count?userEmail=${encodeURIComponent(currentUser.email)}`);
        if (response.ok) {
          const data = await response.json();
          const count = data.count;
          
          // Update unread count in UI
          const unreadCountElement = document.getElementById('unreadCount');
          if (unreadCountElement) {
            if (count > 0) {
              unreadCountElement.textContent = count;
              unreadCountElement.style.display = 'inline-block';
            } else {
              unreadCountElement.style.display = 'none';
            }
          }
          
          // Show notification if new messages
          if (count > lastUnreadCount) {
            showNotification(`You have ${count - lastUnreadCount} new message${count - lastUnreadCount > 1 ? 's' : ''}`, 'info');
            lastUnreadCount = count;
            localStorage.setItem('lastUnreadCount', count);
          }
        }
      } catch (error) {
        console.error('Error checking unread messages:', error);
      }
    }
    
    // Check immediately and then every 10 seconds
    checkUnreadMessages();
    setInterval(checkUnreadMessages, 10000);
  }
});

// Notification function
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