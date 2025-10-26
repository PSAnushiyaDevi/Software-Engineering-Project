// feedback.js
document.addEventListener('DOMContentLoaded', () => {
  const feedbackForm = document.getElementById("feedbackForm");
  const ratingSelect = document.getElementById("fbRating");
  const stars = document.querySelectorAll(".rating-stars i");
  
  // Update star display based on rating
  function updateStars(rating) {
    stars.forEach(star => {
      const starRating = parseInt(star.getAttribute("data-rating"));
      if (starRating <= rating) {
        star.classList.add("active");
      } else {
        star.classList.remove("active");
      }
    });
  }
  
  // Initialize stars based on default rating
  updateStars(ratingSelect.value);
  
  // Update stars when rating changes
  ratingSelect.addEventListener("change", () => {
    updateStars(ratingSelect.value);
  });
  
  // Handle star clicks
  stars.forEach(star => {
    star.addEventListener("click", () => {
      const rating = star.getAttribute("data-rating");
      ratingSelect.value = rating;
      updateStars(rating);
    });
  });
  
  feedbackForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const withVal = document.getElementById("fbWith").value.trim();
    const rating = document.getElementById("fbRating").value;
    const comment = document.getElementById("fbComment").value.trim();
    const user = JSON.parse(localStorage.getItem('current_user') || '{}');

    if (!user || !user.name) { 
      alert('Sign in to leave feedback'); 
      return; 
    }

    const feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
    feedbacks.unshift({
      id: Date.now(), 
      by: user.name, 
      with: withVal, 
      rating, 
      comment, 
      at: new Date().toISOString()
    });
    localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
    
    // Show success notification
    showNotification('Thank you for your feedback!', 'success');
    
    feedbackForm.reset();
    updateStars(5); // Reset to default rating
    renderFeedback();
  });

  function renderFeedback() {
    const list = document.getElementById('feedbackList');
    const feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
    list.innerHTML = '';
    
    if (feedbacks.length === 0) {
      list.innerHTML = `
        <div class="no-feedback">
          <i class="fas fa-comments"></i>
          <p>No feedback yet. Be the first to share your experience!</p>
        </div>
      `;
      return;
    }
    
    feedbacks.forEach(f => {
      const div = document.createElement('div');
      div.className = 'feedback-item';
      
      // Create star rating display
      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
        if (i <= f.rating) {
          starsHtml += '<i class="fas fa-star" style="color: #ffc107;"></i>';
        } else {
          starsHtml += '<i class="far fa-star" style="color: #ddd;"></i>';
        }
      }
      
      div.innerHTML = `
        <div class="feedback-header-info">
          <div>
            <span class="feedback-user">${f.by}</span> → 
            <span style="color: #667eea;">${f.with}</span>
          </div>
          <div class="feedback-rating">${starsHtml}</div>
        </div>
        <div class="feedback-comment">${f.comment}</div>
        <div class="feedback-date">${new Date(f.at).toLocaleString()}</div>
      `;
      list.appendChild(div);
    });
  }
  
  renderFeedback();
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