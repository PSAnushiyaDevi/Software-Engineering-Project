// match.js
let currentMatch = null;
let map = null;
let marker = null;

// Load matches when page loads
document.addEventListener('DOMContentLoaded', loadMatches);

// Modal elements
const modal = document.getElementById('sessionModal');
const closeBtn = document.querySelector('.close-btn');
const cancelBtn = document.getElementById('cancelBtn');
const submitBtn = document.getElementById('submitBtn');
const onlineForm = document.getElementById('onlineForm');
const offlineForm = document.getElementById('offlineForm');
const sessionTypeOptions = document.querySelectorAll('.session-type-option');
const mapContainer = document.getElementById('mapContainer');

// Event listeners for modal
closeBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
submitBtn.addEventListener('click', submitSessionRequest);

// Session type selection
sessionTypeOptions.forEach(option => {
  option.addEventListener('click', () => {
    sessionTypeOptions.forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
    
    const type = option.getAttribute('data-type');
    if (type === 'online') {
      onlineForm.classList.add('active');
      offlineForm.classList.remove('active');
    } else {
      offlineForm.classList.add('active');
      onlineForm.classList.remove('active');
      // Initialize map if not already done
      if (!map) {
        initializeMap();
      }
    }
  });
});

// Load matches from backend
async function loadMatches() {
  try {
    const res = await fetch('http://localhost:5000/match');
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    const container = document.getElementById('matchesContainer');
    
    if (data.length === 0) {
      container.innerHTML = '<div class="no-matches"><i class="fas fa-search"></i><p>No matches found yet. Register more users and wait for matching.</p></div>';
    } else {
      container.innerHTML = data.map(m => createMatchCard(m)).join('');
      
      // Add event listeners to request buttons
      document.querySelectorAll('.request-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const matchData = JSON.parse(e.target.getAttribute('data-match'));
          openSessionModal(matchData);
        });
      });
    }
  } catch (error) {
    console.error('Failed to load matches:', error);
    document.getElementById('matchesContainer').innerHTML = '<div class="error-loading"><i class="fas fa-exclamation-triangle"></i><p>Error loading matches. Please ensure the backend is running.</p></div>';
  }
}

// Create match card HTML
function createMatchCard(match) {
  // Handle undefined skills
  const teaches = match.teaches && match.teaches !== 'undefined' ? match.teaches : 'Not specified';
  const learns = match.learns && match.learns !== 'undefined' ? match.learns : 'Not specified';
  
  return `
    <div class="match-card">
      <div class="match-header">
        <h3 class="match-title">Perfect Match Found!</h3>
        <span class="match-badge"><i class="fas fa-check-circle"></i> Compatible</span>
      </div>
      
      <div class="match-details">
        <div class="match-person">
          <h4><i class="fas fa-user"></i> ${match.person}</h4>
          <p><i class="fas fa-graduation-cap"></i> Wants to learn: <strong>${learns}</strong></p>
        </div>
        
        <div class="match-partner">
          <h4><i class="fas fa-user"></i> ${match.partner}</h4>
          <p><i class="fas fa-chalkboard-teacher"></i> Teaches: <strong>${teaches}</strong></p>
          ${match.partnerLocation ? `<p><i class="fas fa-map-marker-alt"></i> ${match.partnerLocation}</p>` : ''}
        </div>
      </div>
      
      <div class="match-actions">
        <button class="btn primary request-btn" data-match='${JSON.stringify(match)}'>
          <i class="fas fa-calendar-plus"></i> Request Session
        </button>
      </div>
    </div>
  `;
}

// Open session request modal
function openSessionModal(match) {
  currentMatch = match;
  modal.style.display = 'flex';
  
  // Reset form
  sessionTypeOptions.forEach(opt => opt.classList.remove('selected'));
  onlineForm.classList.remove('active');
  offlineForm.classList.remove('active');
  document.getElementById('onlineDate').value = '';
  document.getElementById('onlineNotes').value = '';
  document.getElementById('offlineDate').value = '';
  document.getElementById('offlineLocation').value = '';
  document.getElementById('offlineNotes').value = '';
}

// Close modal
function closeModal() {
  modal.style.display = 'none';
  currentMatch = null;
}

// Initialize map
function initializeMap() {
  // Create a simple map using OpenStreetMap (no API key needed)
  mapContainer.innerHTML = `
    <div id="map" style="width: 100%; height: 200px; border-radius: 6px;"></div>
  `;
  
  // Add Leaflet CSS and JS
  const leafletCSS = document.createElement('link');
  leafletCSS.rel = 'stylesheet';
  leafletCSS.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
  document.head.appendChild(leafletCSS);
  
  const leafletJS = document.createElement('script');
  leafletJS.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
  leafletJS.onload = function() {
    // Initialize map with default location
    map = L.map('map').setView([40.7128, -74.0060], 13); // Default to New York
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Add a marker
    marker = L.marker([40.7128, -74.0060]).addTo(map)
      .bindPopup('Meeting Location')
      .openPopup();
    
    // Update location when input changes
    document.getElementById('offlineLocation')?.addEventListener('input', function(e) {
      const location = e.target.value;
      if (location) {
        // Use Nominatim for geocoding
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`)
          .then(response => response.json())
          .then(data => {
            if (data && data.length > 0) {
              const lat = parseFloat(data[0].lat);
              const lon = parseFloat(data[0].lon);
              
              // Update map view
              map.setView([lat, lon], 15);
              
              // Update marker position
              marker.setLatLng([lat, lon]);
              marker.bindPopup(location).openPopup();
            }
          })
          .catch(error => {
            console.error('Geocoding error:', error);
          });
      }
    });
  };
  document.head.appendChild(leafletJS);
}

// Submit session request
function submitSessionRequest() {
  const selectedType = document.querySelector('.session-type-option.selected');
  
  if (!selectedType) {
    showNotification('Please select a session type', 'error');
    return;
  }
  
  const type = selectedType.getAttribute('data-type');
  const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
  
  if (!currentUser.email) {
    showNotification('Please log in to request a session', 'error');
    closeModal();
    return;
  }
  
  let sessionData = {
    requesterEmail: currentUser.email,
    recipientEmail: currentMatch.partnerEmail,
    type: type,
    date: type === 'online' ? document.getElementById('onlineDate').value : document.getElementById('offlineDate').value,
    location: type === 'offline' ? document.getElementById('offlineLocation').value : undefined,
    notes: type === 'online' ? document.getElementById('onlineNotes').value : document.getElementById('offlineNotes').value,
    requestedSkill: currentMatch.teaches
  };
  
  // Validate required fields
  if (!sessionData.date) {
    showNotification('Please select a date and time', 'error');
    return;
  }
  
  if (type === 'offline' && !sessionData.location) {
    showNotification('Please enter a location', 'error');
    return;
  }
  
  fetch('http://localhost:5000/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(sessionData)
  })
  .then(response => response.json())
  .then(data => {
    if (data.message) {
      showNotification(data.message, 'success');
      
      // For online sessions, redirect to messages page with the recipient
      if (type === 'online') {
        window.location.href = `messages.html?with=${encodeURIComponent(currentMatch.partnerEmail)}`;
      } else {
        closeModal();
      }
    } else {
      showNotification('Error: ' + data.message, 'error');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showNotification('Error sending session request', 'error');
  });
}

// Notification system
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