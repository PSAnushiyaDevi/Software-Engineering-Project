// script.js
// Handle logout
function logout() {
  localStorage.removeItem('current_user');
  localStorage.removeItem('auth_token');
  window.location.href = 'index.html';
}

// Add logout event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in
  const token = localStorage.getItem('auth_token');
  const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
  
  // Update UI based on login status
  const loginLinks = document.querySelectorAll('a[href="signup.html"]');
  const dashboardLinks = document.querySelectorAll('a[href="dashboard.html"]');
  
  if (token && currentUser.email) {
    // User is logged in
    loginLinks.forEach(link => {
      link.textContent = 'Logout';
      link.setAttribute('href', '#');
      link.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    });
    
    dashboardLinks.forEach(link => {
      link.style.display = 'inline-block';
    });
  } else {
    // User is not logged in
    dashboardLinks.forEach(link => {
      link.style.display = 'none';
    });
  }
});

// Profile rotation for homepage
const profiles = [
  { name: "John Doe", skill: "Graphic Design" },
  { name: "Meena Kumari", skill: "Java Programming" },
  { name: "Akira Tanaka", skill: "Japanese Linguistics" },
  { name: "Carlos Vega", skill: "Spanish Cooking" }
];

let index = 0;
setInterval(() => {
  const profileBox = document.getElementById("profileSwap");
  if (profileBox) {
    const profile = profiles[index];
    profileBox.innerHTML = `<p><strong>Name:</strong> ${profile.name}</p><p><strong>Skill:</strong> ${profile.skill}</p>`;
    index = (index + 1) % profiles.length;
  }
}, 3000);