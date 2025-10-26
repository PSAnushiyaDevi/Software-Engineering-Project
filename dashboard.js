// dashboard.js
document.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
  const userDisplayEl = document.getElementById('userDisplay');
  const userProfileCard = document.getElementById('userProfileCard');

  if (currentUser && currentUser.name) {
    userDisplayEl.textContent = currentUser.name;
    // Display user's own profile details
    userProfileCard.innerHTML = `
      <div style="margin-bottom: 15px;">
        <p><b>Email:</b> ${currentUser.email}</p>
        <p><b>Teaching:</b> ${currentUser.teachSkill}</p>
        <p><b>Learning:</b> ${currentUser.learnSkill}</p>
        ${currentUser.skillDetails ? `<p><b>Details:</b> ${currentUser.skillDetails}</p>` : ''}
      </div>
      ${currentUser.certificate ? `
        <div style="margin-top: 20px;">
          <a href="${currentUser.certificate}" target="_blank" class="btn primary" style="display: inline-flex; align-items: center; gap: 8px;">
            <i class="fas fa-certificate"></i> View Certificate
          </a>
        </div>
      ` : ''}
    `;
  } else {
    userDisplayEl.textContent = 'Guest';
    userProfileCard.innerHTML = '<p>Please log in to see your profile details.</p>';
  }

  async function fetchAllUsersAndRenderStats() {
    let users = [];
    try {
      const res = await fetch('http://localhost:5000/users');
      if (res.ok) {
        users = await res.json();
        localStorage.setItem('talent_users', JSON.stringify(users)); // Update local cache
      } else {
        console.error('Failed to fetch users from backend:', res.status);
        users = JSON.parse(localStorage.getItem('talent_users') || '[]'); // Fallback to local
      }
    } catch (e) {
      console.warn('Backend unavailable, using local users for stats.', e);
      users = JSON.parse(localStorage.getItem('talent_users') || '[]'); // Fallback to local
    }

    // Fetch sessions for current user
    let sessions = [];
    try {
      if (currentUser.email) {
        const sessionRes = await fetch(`http://localhost:5000/sessions?email=${currentUser.email}`);
        if (sessionRes.ok) {
          sessions = await sessionRes.json();
        }
      }
    } catch (e) {
      console.warn('Error fetching sessions:', e);
    }

    document.getElementById('statMembersVal').textContent = users.length;
    
    // Count pending sessions
    const pendingSessions = sessions.filter(s => s.status === 'pending').length;
    document.getElementById('pendingCount').textContent = pendingSessions;
    
    // Count upcoming sessions (accepted)
    const upcomingSessions = sessions.filter(s => 
      s.status === 'accepted' && new Date(s.date) > new Date()
    ).length;
    document.getElementById('upcomingCount').textContent = upcomingSessions;
  }

  // Initial load and refresh
  fetchAllUsersAndRenderStats();
});