// profile.js
document.addEventListener('DOMContentLoaded', async () => {
  const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
  
  // Check if user is logged in
  if (!currentUser.email) {
    window.location.href = 'signup.html';
    return;
  }
  
  // Populate profile data
  document.getElementById('profileName').textContent = currentUser.name || 'Not provided';
  document.getElementById('profileEmail').textContent = currentUser.email || 'Not provided';
  document.getElementById('profileLocation').textContent = currentUser.location || 'Not provided';
  document.getElementById('teachSkill').textContent = currentUser.teachSkill || 'Not specified';
  document.getElementById('learnSkill').textContent = currentUser.learnSkill || 'Not specified';
  document.getElementById('skillDetails').textContent = currentUser.skillDetails || 'No additional information provided.';
  
  // Set avatar with user's initial
  const avatarElement = document.getElementById('profileAvatar');
  avatarElement.textContent = (currentUser.name || 'U').charAt(0).toUpperCase();
  
  // Handle certificate display
  const certificateSection = document.getElementById('certificateSection');
  const certificateDisplay = document.getElementById('certificateDisplay');
  
  if (currentUser.certificate) {
    // Check if it's an image or PDF
    if (currentUser.certificate.startsWith('data:image/')) {
      certificateDisplay.innerHTML = `<img src="${currentUser.certificate}" alt="Certificate">`;
    } else if (currentUser.certificate.startsWith('data:application/pdf')) {
      certificateDisplay.innerHTML = `
        <div class="certificate-placeholder">
          <i class="fas fa-file-pdf"></i>
          <p>Certificate available as PDF</p>
          <a href="${currentUser.certificate}" target="_blank" class="btn primary">View Certificate</a>
        </div>
      `;
    }
  } else {
    certificateDisplay.innerHTML = `
      <div class="certificate-placeholder">
        <i class="fas fa-certificate"></i>
        <p>No certificate uploaded yet</p>
      </div>
    `;
  }
  
  // Fetch and display stats
  try {
    // Get user count
    const usersRes = await fetch('http://localhost:5000/users');
    if (usersRes.ok) {
      const users = await usersRes.json();
      document.getElementById('memberCount').textContent = users.length;
    }
    
    // Get sessions count
    const sessionsRes = await fetch(`http://localhost:5000/sessions?email=${currentUser.email}`);
    if (sessionsRes.ok) {
      const sessions = await sessionsRes.json();
      document.getElementById('sessionCount').textContent = sessions.length;
    }
    
    // Get matches count
    const matchesRes = await fetch('http://localhost:5000/match');
    if (matchesRes.ok) {
      const matches = await matchesRes.json();
      const userMatches = matches.filter(m => 
        m.personEmail === currentUser.email || m.partnerEmail === currentUser.email
      );
      document.getElementById('matchCount').textContent = userMatches.length;
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
    // Set default values if fetch fails
    document.getElementById('memberCount').textContent = '0';
    document.getElementById('sessionCount').textContent = '0';
    document.getElementById('matchCount').textContent = '0';
  }
});