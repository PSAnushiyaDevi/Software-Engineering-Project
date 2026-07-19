// messages.js
document.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
  
  if (!currentUser.email) {
    window.location.href = 'signup.html';
    return;
  }

  loadConversations();
  
  // Check for new messages every 10 seconds
  setInterval(loadConversations, 10000);
  
  // Check if there's a specific conversation to load from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const withEmail = urlParams.get('with');
  if (withEmail) {
    // Load the specific conversation after a short delay to ensure conversations are loaded
    setTimeout(() => {
      loadChat(withEmail);
    }, 500);
  }
});

async function loadConversations() {
  try {
    const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
    const response = await fetch(`/conversations?userEmail=${encodeURIComponent(currentUser.email)}`)
    
    if (response.ok) {
      const conversations = await response.json();
      displayConversations(conversations);
    } else {
      console.error('Failed to load conversations');
    }
  } catch (error) {
    console.error('Error loading conversations:', error);
  }
}

function displayConversations(conversations) {
  const container = document.getElementById('conversationsList');
  container.innerHTML = '';
  
  if (conversations.length === 0) {
    container.innerHTML = `
      <div class="no-conversations">
        <i class="fas fa-comments"></i>
        <p>No conversations yet</p>
      </div>
    `;
    return;
  }
  
  // Check if we have an active conversation from URL
  const urlParams = new URLSearchParams(window.location.search);
  const activeEmail = urlParams.get('with');
  
  conversations.forEach(conversation => {
    const conversationEl = document.createElement('div');
    conversationEl.className = 'conversation-item';
    conversationEl.dataset.userEmail = conversation.user.email;
    
    // If this conversation is the active one from URL, mark it as active
    if (activeEmail && conversation.user.email === activeEmail) {
      conversationEl.classList.add('active');
    }
    
    // Format the timestamp
    const time = formatTime(conversation.lastTimestamp);
    
    conversationEl.innerHTML = `
      <div class="conversation-avatar">${conversation.user.name.charAt(0).toUpperCase()}</div>
      <div class="conversation-details">
        <div class="conversation-name">${conversation.user.name}</div>
        <div class="conversation-preview">${conversation.lastMessage}</div>
      </div>
      <div class="conversation-time">${time}</div>
      ${conversation.unreadCount > 0 ? `<div class="unread-badge">${conversation.unreadCount}</div>` : ''}
    `;
    
    conversationEl.addEventListener('click', () => {
      // Remove active class from all conversations
      document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
      });
      
      // Add active class to clicked conversation
      conversationEl.classList.add('active');
      
      // Load chat
      loadChat(conversation.user.email);
    });
    
    container.appendChild(conversationEl);
  });
  
  // If we have an active conversation from URL and it's not in the list, add it
  if (activeEmail && !conversations.some(c => c.user.email === activeEmail)) {
    // Find the user details
    fetch(`/users`)
      .then(response => response.json())
      .then(users => {
        const user = users.find(u => u.email === activeEmail);
        if (user) {
          const conversationEl = document.createElement('div');
          conversationEl.className = 'conversation-item active';
          conversationEl.dataset.userEmail = user.email;
          
          conversationEl.innerHTML = `
            <div class="conversation-avatar">${user.name.charAt(0).toUpperCase()}</div>
            <div class="conversation-details">
              <div class="conversation-name">${user.name}</div>
              <div class="conversation-preview">Start a conversation</div>
            </div>
            <div class="conversation-time">Now</div>
          `;
          
          conversationEl.addEventListener('click', () => {
            // Remove active class from all conversations
            document.querySelectorAll('.conversation-item').forEach(item => {
              item.classList.remove('active');
            });
            
            // Add active class to clicked conversation
            conversationEl.classList.add('active');
            
            // Load chat
            loadChat(user.email);
          });
          
          container.appendChild(conversationEl);
          
          // Load the chat
          loadChat(user.email);
        }
      })
      .catch(error => {
        console.error('Error fetching users:', error);
      });
  }
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  
  // If today, show time
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // If yesterday, show "Yesterday"
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  
  // Otherwise, show date
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

async function loadChat(otherUserEmail) {
  try {
    const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
    const response = await fetch(`/messages?userEmail=${encodeURIComponent(currentUser.email)}&otherUserEmail=${encodeURIComponent(otherUserEmail)}`)
    if (response.ok) {
      const messages = await response.json();
      displayChat(messages, otherUserEmail);
    } else {
      console.error('Failed to load messages');
    }
  } catch (error) {
    console.error('Error loading messages:', error);
  }
}

function displayChat(messages, otherUserEmail) {
  const chatContainer = document.getElementById('chatContainer');
  const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
  
  // Get other user details
  const otherUser = messages.length > 0 
    ? (messages[0].sender.email === currentUser.email ? messages[0].recipient : messages[0].sender)
    : { name: otherUserEmail, email: otherUserEmail };
  
  chatContainer.innerHTML = `
    <div class="chat-header">
      <div class="avatar">${otherUser.name.charAt(0).toUpperCase()}</div>
      <div>
        <h3>${otherUser.name}</h3>
        <p style="margin: 0; color: #666; font-size: 0.9em;">${otherUser.email}</p>
      </div>
    </div>
    
    <div class="chat-messages" id="chatMessages">
      ${messages.length === 0 ? 
        '<div class="no-messages"><i class="fas fa-comments" style="font-size: 3em; margin-bottom: 15px; color: #ddd;"></i><p>No messages yet. Start a conversation!</p></div>' : 
        ''}
    </div>
    
    <div class="chat-input">
      <input type="text" id="messageInput" placeholder="Type a message...">
      <button id="sendBtn">
        <i class="fas fa-paper-plane"></i>
      </button>
    </div>
  `;
  
  // Display messages
  const messagesContainer = document.getElementById('chatMessages');
  messages.forEach(message => {
    const isSent = message.sender.email === currentUser.email;
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
  
  // Set up message sending
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  
  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  async function sendMessage() {
    const content = messageInput.value.trim();
    if (!content) return;
    
    try {
      const response = await fetch('/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          senderEmail: currentUser.email,
          recipientEmail: otherUserEmail,
          content
        })
      });
      
      if (response.ok) {
        messageInput.value = '';
        // Reload chat
        loadChat(otherUserEmail);
        // Show notification
        showNotification('Message sent successfully!', 'success');
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
}

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
