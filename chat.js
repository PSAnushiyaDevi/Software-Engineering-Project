// chat.js
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const userEmail = urlParams.get('user');
  const withEmail = urlParams.get('with');
  
  if (!userEmail || !withEmail) {
    window.location.href = 'match.html';
    return;
  }
  
  const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
  if (currentUser.email !== userEmail) {
    window.location.href = 'signup.html';
    return;
  }
  
  // Set chat header info
  document.getElementById('chatName').textContent = withEmail;
  document.getElementById('chatAvatar').textContent = withEmail.charAt(0).toUpperCase();
  
  // Load messages
  loadMessages();
  
  // Set up message sending
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  
  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  // Video call button
  document.getElementById('videoCallBtn').addEventListener('click', () => {
    showNotification('Video call feature coming soon!', 'info');
  });
  
  async function loadMessages() {
    try {
      const response = await fetch(`http://localhost:5000/messages?userEmail=${encodeURIComponent(userEmail)}&otherUserEmail=${encodeURIComponent(withEmail)}`);
      if (response.ok) {
        const messages = await response.json();
        displayMessages(messages);
        
        // Check for new messages and show notification
        const newMessages = messages.filter(msg => 
          !msg.read && msg.sender.email === withEmail
        );
        
        if (newMessages.length > 0) {
          showNotification(`You have ${newMessages.length} new message${newMessages.length > 1 ? 's' : ''} from ${withEmail}`, 'info');
        }
      } else {
        console.error('Failed to load messages');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }
  
  function displayMessages(messages) {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = '';
    
    if (messages.length === 0) {
      messagesContainer.innerHTML = `
        <div class="no-messages">
          <i class="fas fa-comments" style="font-size: 3em; margin-bottom: 15px; color: #ddd;"></i>
          <p>No messages yet. Start a conversation!</p>
        </div>
      `;
      return;
    }
    
    messages.forEach(message => {
      const isSent = message.sender.email === userEmail;
      const messageEl = document.createElement('div');
      messageEl.className = `message ${isSent ? 'sent' : 'received'}`;
      
      const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      messageEl.innerHTML = `
        <div class="message-content">
          ${message.content}
        </div>
        <div class="message-time">${time}</div>
      `;
      
      messagesContainer.appendChild(messageEl);
    });
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  async function sendMessage() {
    const content = messageInput.value.trim();
    if (!content) return;
    
    try {
      const response = await fetch('http://localhost:5000/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          senderEmail: userEmail,
          recipientEmail: withEmail,
          content
        })
      });
      
      if (response.ok) {
        messageInput.value = '';
        loadMessages(); // Reload messages
        
        // Show notification to sender
        showNotification('Message sent successfully!', 'success');
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
  
  // Poll for new messages every 3 seconds
  setInterval(loadMessages, 3000);
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