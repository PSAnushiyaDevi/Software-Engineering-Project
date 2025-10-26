// sessions.js
const sessionForm = document.getElementById('sessionForm');
const typeEl = document.getElementById('sessionType');
const locationField = document.getElementById('locationField');

typeEl?.addEventListener('change', (e) => {
  locationField.style.display = e.target.value === 'offline' ? 'block' : 'none';
});

sessionForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const withVal = document.getElementById('sessionWith').value.trim();
  const type = document.getElementById('sessionType').value;
  const date = document.getElementById('sessionDate').value;
  const location = document.getElementById('sessionLocation').value;
  const notes = document.getElementById('sessionNotes').value;

  const current = JSON.parse(localStorage.getItem('current_user') || '{}');
  if (!current || !current.name) { alert('Please log in to schedule sessions.'); return; }

  const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
  sessions.push({
    id: Date.now(),
    by: current,
    with: withVal,
    type, date, location, notes,
    status: 'scheduled', createdAt: new Date().toISOString()
  });
  localStorage.setItem('sessions', JSON.stringify(sessions));
  alert('Session scheduled.');
  renderSessions();
  sessionForm.reset();
});

function renderSessions() {
  const list = document.getElementById('sessionList');
  const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
  list.innerHTML = '';
  if (sessions.length === 0) { list.innerHTML = '<div style="color:#cfe5ff">No sessions yet.</div>'; return; }

  sessions.forEach(s => {
    const d = document.createElement('div');
    d.className = 'session-item';
    const dateStr = s.date ? new Date(s.date).toLocaleString() : 'TBD';
    const mapLink = s.type === 'offline' && s.location ? `<a href="https://www.google.com/maps/search/${encodeURIComponent(s.location)}" target="_blank" class="btn secondary">Open Map</a>` : '';
    d.innerHTML = `
      <div style="display:flex; justify-content:space-between; gap:10px;">
        <div>
          <div style="font-weight:700; color:#fff">${s.with}</div>
          <div style="color:#cfe5ff">When: ${dateStr} · Type: ${s.type}</div>
          <div style="color:#cfe5ff">${s.notes || ''}</div>
        </div>
        <div style="display:flex; align-items:flex-end; gap:8px;">
          ${mapLink}
          <button class="btn" onclick="completeSession(${s.id})">Mark Done</button>
        </div>
      </div>
    `;
    list.appendChild(d);
  });
}

function completeSession(id) {
  const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
  const idx = sessions.findIndex(s => s.id === id);
  if (idx === -1) return;
  sessions[idx].status = 'completed';
  localStorage.setItem('sessions', JSON.stringify(sessions));
  alert('Session marked completed. Please leave feedback from Feedback page.');
  renderSessions();
}

// pending matches
function renderPending() {
  const pending = JSON.parse(localStorage.getItem('pending_matches') || '[]');
  const el = document.getElementById('pendingList');
  el.innerHTML = '';
  if (pending.length === 0) { el.innerHTML = '<div style="color:#cfe5ff">No pending requests.</div>'; return; }
  pending.forEach(p => {
    const div = document.createElement('div');
    div.className = 'session-item';
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-weight:700; color:#fff">Request to ${p.with.name || p.with}</div>
          <div style="color:#cfe5ff">Requested by ${p.by.name}</div>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn" onclick="acceptPending(${p.id})">Accept</button>
          <button class="btn secondary" onclick="declinePending(${p.id})">Decline</button>
        </div>
      </div>
    `;
    el.appendChild(div);
  });
}

function acceptPending(id) {
  const pending = JSON.parse(localStorage.getItem('pending_matches')||'[]');
  const p = pending.find(x=>x.id === id);
  if (!p) return;
  // convert to a scheduled session (ask for time now)
  const when = prompt('Enter date/time for the session (YYYY-MM-DDTHH:MM) — local datetime-local format', '');
  if (!when) return;
  const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
  sessions.push({
    id: Date.now(),
    by: p.by,
    with: p.with,
    type: 'online',
    date: when,
    notes: 'Matched session',
    status: 'scheduled',
    createdAt: new Date().toISOString()
  });
  localStorage.setItem('sessions', JSON.stringify(sessions));
  // remove pending
  const updated = pending.filter(x=>x.id!==id);
  localStorage.setItem('pending_matches', JSON.stringify(updated));
  alert('Session created. Check Sessions list.');
  renderPending();
  renderSessions();
}

function declinePending(id) {
  const pending = JSON.parse(localStorage.getItem('pending_matches')||'[]');
  const updated = pending.filter(x=>x.id!==id);
  localStorage.setItem('pending_matches', JSON.stringify(updated));
  renderPending();
}

document.getElementById('acceptPending')?.addEventListener('click', () => {
  // accept all (quick action) - convert to scheduled with placeholder time
  const pending = JSON.parse(localStorage.getItem('pending_matches')||'[]');
  if (pending.length === 0) { alert('No pending matches'); return; }
  pending.forEach(p => {
    const sessions = JSON.parse(localStorage.getItem('sessions')||'[]');
    sessions.push({
      id: Date.now()+Math.floor(Math.random()*10000),
      by: p.by, with: p.with, type:'online', date: new Date().toISOString(),
      notes: 'Bulk accepted match', status:'scheduled', createdAt: new Date().toISOString()
    });
    localStorage.setItem('sessions', JSON.stringify(sessions));
  });
  localStorage.setItem('pending_matches', JSON.stringify([]));
  alert('All pending matched accepted as scheduled sessions (you can edit).');
  renderPending();
  renderSessions();
});

renderSessions();
renderPending();
