// profiles.js
async function fetchUsers() {
  try {
    const res = await fetch('/users');
    if (res.ok) {
      const users = await res.json();
      localStorage.setItem('talent_users', JSON.stringify(users));
      return users;
    }
  } catch (e) { /* fallback */ }
  return JSON.parse(localStorage.getItem('talent_users') || '[]');
}

async function renderProfiles() {
  const users = await fetchUsers();
  document.getElementById('memberCount').textContent = `(${users.length})`;
  const container = document.getElementById('profilesContainer');
  container.innerHTML = '';

  users.forEach(u => {
    const div = document.createElement('div');
    div.className = 'profile-card';
    
    // Generate random login/logout times for demo purposes
    const loginTime = generateRandomDateTime();
    const logoutTime = generateRandomDateTime(loginTime);
    
    div.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar">${u.name.charAt(0).toUpperCase()}</div>
        <div class="profile-info">
          <h3>${u.name}</h3>
          <p>${u.email}</p>
        </div>
      </div>
      
      <div class="profile-details">
        <div class="detail-item">
          <i class="fas fa-chalkboard-teacher"></i>
          <span><strong>Teaches:</strong> ${u.teachSkill}</span>
        </div>
        <div class="detail-item">
          <i class="fas fa-graduation-cap"></i>
          <span><strong>Learns:</strong> ${u.learnSkill}</span>
        </div>
        <div class="detail-item">
          <i class="fas fa-map-marker-alt"></i>
          <span><strong>Location:</strong> ${u.location || 'Not specified'}</span>
        </div>
        <div class="detail-item">
          <i class="fas fa-certificate"></i>
          <span><strong>Certificate:</strong> ${u.certificate ? 'Available' : 'None'}</span>
        </div>
      </div>
      
      <div class="profile-timeline">
        <div class="timeline-item">
          <div class="timeline-icon">
            <i class="fas fa-sign-in-alt"></i>
          </div>
          <div class="timeline-content">
            <p><strong>Last Login:</strong> ${formatDateTime(loginTime)}</p>
            <small>${getTimeAgo(loginTime)}</small>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-icon">
            <i class="fas fa-sign-out-alt"></i>
          </div>
          <div class="timeline-content">
            <p><strong>Last Logout:</strong> ${formatDateTime(logoutTime)}</p>
            <small>${getTimeAgo(logoutTime)}</small>
          </div>
        </div>
      </div>
    `;
    
    container.appendChild(div);
  });

  // Show waiting list
  showWaitingList(users);
}

function showWaitingList(users) {
  const waitingDiv = document.getElementById('waitingList');
  waitingDiv.innerHTML = '';
  const waiting = JSON.parse(localStorage.getItem('pending_matches') || '[]');
  
  if (waiting.length === 0) {
    waitingDiv.innerHTML = `
      <div class="no-waiting">
        <i class="fas fa-handshake"></i>
        <p>No pending match requests at the moment.</p>
      </div>
    `;
    return;
  }
  
  waiting.forEach(p => {
    const user = users.find(u => u.email === p.with.email);
    const waitingCard = document.createElement('div');
    waitingCard.className = 'waiting-card';
    
    waitingCard.innerHTML = `
      <div class="waiting-header">
        <h4>Request to: ${user ? user.name : p.with}</h4>
        <span class="status-badge">${p.status}</span>
      </div>
      <p><strong>From:</strong> ${p.by.name}</p>
      <p><strong>Type:</strong> ${p.type}</p>
      <p><strong>When:</strong> ${p.date}</p>
    `;
    
    waitingDiv.appendChild(waitingCard);
  });
}

// Helper functions to generate and format dates
function generateRandomDateTime(afterDate) {
  const date = afterDate ? new Date(afterDate) : new Date();
  date.setHours(date.getHours() + Math.floor(Math.random() * 12));
  date.setMinutes(date.getMinutes() + Math.floor(Math.random() * 60));
  return date;
}

function formatDateTime(date) {
  return new Date(date).toLocaleString();
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return interval + " year" + (interval > 1 ? "s" : "") + " ago";
  }
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval + " month" + (interval > 1 ? "s" : "") + " ago";
  }
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval + " day" + (interval > 1 ? "s" : "") + " ago";
  }
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval + " hour" + (interval > 1 ? "s" : "") + " ago";
  }
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval + " minute" + (interval > 1 ? "s" : "") + " ago";
  }
  
  return "Just now";
}

document.getElementById('refreshProfiles')?.addEventListener('click', () => {
  // Add rotation animation to refresh icon
  const refreshIcon = document.querySelector('#refreshProfiles i');
  refreshIcon.classList.add('fa-spin');
  
  setTimeout(() => {
    refreshIcon.classList.remove('fa-spin');
    renderProfiles();
  }, 1000);
});

window.onload = renderProfiles;
