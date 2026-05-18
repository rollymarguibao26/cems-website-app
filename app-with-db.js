/* ================================================================
   CEMS — app-with-db.js
   Drop-in replacement for app.js.
   All localStorage reads/writes are replaced with fetch() calls
   to the Express/SQLite backend in ./backend/.
   Everything else (UI, CSS, page logic) is identical to app.js.
================================================================ */

const API = '/api';   // base URL — change to 'http://localhost:3000/api' for cross-origin dev

/* ─── helper: normalise API responses to the same shape app.js uses ─── */
function normEvent(e) {
  return { ...e, organizerId: e.organizer_id ?? e.organizerId, featured: !!e.featured };
}
function normOrg(o) {
  return { ...o, organizerId: o.organizer_id ?? o.organizerId,
                  coverPhoto:  o.cover_photo  ?? o.coverPhoto,
                  createdDate: o.created_date ?? o.createdDate,
                  socialLinks: o.socialLinks  ?? {} };
}
function normPost(p) {
  return { ...p, organizationId: p.organization_id ?? p.organizationId,
                  mediaUrl:  p.media_url  ?? p.mediaUrl  ?? '',
                  mediaUrls: p.media_urls ?? p.mediaUrls ?? [],
                  likedBy:   p.liked_by   ?? p.likedBy   ?? [],
                  editedAt:  p.edited_at  ?? p.editedAt  ?? null };
}
function normFollow(f) {
  return { ...f, userId: f.user_id ?? f.userId, organizationId: f.organization_id ?? f.organizationId };
}
function normReg(r) {
  return { ...r, userId: r.user_id ?? r.userId, eventId: r.event_id ?? r.eventId };
}
function normFeedback(f) {
  return { ...f, userId: f.user_id ?? f.userId, eventId: f.event_id ?? f.eventId,
                  createdAt: f.created_at ?? f.createdAt };
}
function normAttendance(a) {
  return { eventId: a.event_id ?? a.eventId, userId: a.user_id ?? a.userId, checkedIn: !!a.checked_in };
}
function normCert(c) {
  return { eventId: c.event_id ?? c.eventId, userId: c.user_id ?? c.userId };
}

/* ─── fetch wrapper ───────────────────────────────────────────── */
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

/* ================================================================
   STATE — same variables as app.js
================================================================ */
let DB = {
  users:[], events:[], regs:[], announcements:[], feedbacks:[],
  organizations:[], organizationPosts:[], organizationFollows:[],
  attendance:{}, certificates:{}
};
let CU = null;
let authMode = 'login';
let homeFilter = 'all';
let orgTab = 'all';
let adminTab = 'pending';
let editingEventId = null;
let browseFilter = 'all';
let pendingFbEventId = null;
let pendingFbRating = 0;
let orgsPageTab = 'all';
let viewingOrgId = null;
let editingOrgId = null;
let orgMainTab = 'events';
let pendingOrgLogo = null;
let pendingOrgCover = null;
let pendingPostPhoto = null;
let pendingPostVideo = null;
let postingForOrgId = null;

/* ================================================================
   DB BOOTSTRAP — replaces loadDB() + saveDB()
================================================================ */
async function loadDB() {
  try {
    const [users, events, regs, feedbacks, announcements, orgs, posts, follows, att, certs] = await Promise.all([
      api('GET', '/users'),
      api('GET', '/events'),
      api('GET', '/registrations'),
      api('GET', '/feedbacks'),
      api('GET', '/announcements'),
      api('GET', '/organizations'),
      fetch(API + '/organizations').then(() => api('GET', '/organizations')).then(async (orgList) => {
        // Fetch posts for all orgs in parallel
        const all = await Promise.all(orgList.map(o => api('GET', `/organizations/${o.id}/posts`)));
        return all.flat();
      }),
      api('GET', '/organizations/follows/all'),
      api('GET', '/attendance'),
      api('GET', '/certificates'),
    ]);

    DB.users              = users.map(u => ({ ...u }));
    DB.events             = events.map(normEvent);
    DB.regs               = regs.map(normReg);
    DB.feedbacks          = feedbacks.map(normFeedback);
    DB.announcements      = announcements;
    DB.organizations      = orgs.map(normOrg);
    DB.organizationPosts  = posts.map(normPost);
    DB.organizationFollows= follows.map(normFollow);

    // Reconstruct attendance & certificates as plain objects
    DB.attendance = {};
    for (const a of att.map(normAttendance)) {
      if (!DB.attendance[a.eventId]) DB.attendance[a.eventId] = {};
      DB.attendance[a.eventId][a.userId] = a.checkedIn;
    }
    DB.certificates = {};
    for (const c of certs.map(normCert)) {
      if (!DB.certificates[c.eventId]) DB.certificates[c.eventId] = {};
      DB.certificates[c.eventId][c.userId] = true;
    }

    const cuId = sessionStorage.getItem('cems_cu');
    if (cuId) CU = DB.users.find(u => u.id === cuId) || null;
  } catch (err) {
    console.error('CEMS: Failed to load from API, falling back to empty DB.', err);
  }
}

/* saveDB is a no-op in DB mode — individual mutations call their own API endpoints */
function saveDB() { /* no-op */ }

function uid(p = 'id') {
  return p + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
}

/* ================================================================
   AUTH — uses /api/auth/login and /api/auth/signup
================================================================ */
function openLogin(mode = 'login') { authMode = mode; renderAuthMode(); document.getElementById('loginModal').classList.add('open'); }
function toggleAuthMode() { authMode = authMode === 'login' ? 'signup' : 'login'; renderAuthMode(); }
function renderAuthMode() {
  document.getElementById('authTitle').textContent = authMode === 'login' ? 'Sign in to CEMS' : 'Create your CEMS account';
  document.getElementById('signupOnly').style.display = authMode === 'signup' ? 'block' : 'none';
  document.getElementById('authSubmitBtn').textContent = authMode === 'login' ? 'Sign In' : 'Create Account';
  document.getElementById('switchAuthTxt').textContent = authMode === 'login' ? "Don't have an account?" : 'Already have an account?';
  document.getElementById('switchAuthLink').textContent = authMode === 'login' ? 'Sign up' : 'Sign in';
}

async function submitAuth() {
  const email = document.getElementById('auEmail').value.trim().toLowerCase();
  const pass  = document.getElementById('auPass').value;
  if (!email || !pass) return toast('Please fill in all fields', 'error');

  try {
    if (authMode === 'login') {
      const { user } = await api('POST', '/auth/login', { email, password: pass });
      CU = user;
      DB.users = DB.users.find(u => u.id === user.id) ? DB.users.map(u => u.id === user.id ? user : u) : [...DB.users, user];
      sessionStorage.setItem('cems_cu', user.id);
      closeModal('loginModal');
      toast(`Welcome back, ${user.name}!`);
      renderNav();
      showPage(user.role === 'admin' ? 'admin' : user.role === 'organizer' ? 'organizer' : 'dashboard');
    } else {
      const name = document.getElementById('auFull').value.trim();
      const sid  = document.getElementById('auId').value.trim();
      const dept = document.getElementById('auDept').value;
      if (!name || !sid) return toast('Please complete all fields', 'error');
      const { user } = await api('POST', '/auth/signup', { name, email, password: pass, dept, sid });
      CU = user;
      DB.users.push(user);
      sessionStorage.setItem('cems_cu', user.id);
      closeModal('loginModal');
      toast(`Welcome to CEMS, ${name}!`);
      renderNav();
      showPage('dashboard');
    }
  } catch (err) {
    toast(err.message || 'Authentication failed', 'error');
  }
}

function logout() {
  CU = null;
  sessionStorage.removeItem('cems_cu');
  sessionStorage.removeItem('cems_current_page');
  renderNav();
  showPage('home');
  toast('Signed out');
}

async function hardResetDB() {
  toast('Reset is not available in database mode. Use the admin panel to manage data.', 'warning');
}

function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal')) e.target.classList.remove('open');
});

/* ================================================================
   EVENT CRUD — mirrors all app.js patterns but uses API
================================================================ */
async function saveEvent(data) {
  if (editingEventId) {
    const updated = await api('PUT', `/events/${editingEventId}`, data);
    const norm = normEvent(updated);
    DB.events = DB.events.map(e => e.id === editingEventId ? norm : e);
    return norm;
  } else {
    const created = await api('POST', '/events', data);
    const norm = normEvent(created);
    DB.events.push(norm);
    return norm;
  }
}

async function deleteEvent(eid) {
  await api('DELETE', `/events/${eid}`);
  DB.events = DB.events.filter(e => e.id !== eid);
}

async function adminApprove(eid) {
  const updated = await api('PUT', `/events/${eid}`, { status: 'approved' });
  const norm = normEvent(updated);
  DB.events = DB.events.map(e => e.id === eid ? norm : e);
  toast('Event approved');
  refreshAll();
}

async function adminReject(eid) {
  const updated = await api('PUT', `/events/${eid}`, { status: 'rejected' });
  const norm = normEvent(updated);
  DB.events = DB.events.map(e => e.id === eid ? norm : e);
  toast('Event rejected', 'warning');
  refreshAll();
}

async function toggleFeatured(eid) {
  const ev = DB.events.find(e => e.id === eid);
  if (!ev) return;
  const updated = await api('PUT', `/events/${eid}`, { featured: !ev.featured });
  const norm = normEvent(updated);
  DB.events = DB.events.map(e => e.id === eid ? norm : e);
  toast(norm.featured ? 'Marked as featured' : 'Removed from featured');
  refreshAll();
}

/* ================================================================
   REGISTRATIONS
================================================================ */
async function registerEvent(eid) {
  if (!CU) return openLogin();
  try {
    const reg = await api('POST', '/registrations', { userId: CU.id, eventId: eid });
    DB.regs.push(normReg(reg));
    toast('Registered successfully! 🎉');
    refreshAll();
  } catch (err) {
    toast(err.message || 'Registration failed', 'error');
  }
}

async function cancelReg(eid) {
  if (!CU) return;
  const reg = DB.regs.find(r => r.userId === CU.id && r.eventId === eid);
  if (!reg) return;
  await api('DELETE', `/registrations/${reg.id}`);
  DB.regs = DB.regs.filter(r => !(r.userId === CU.id && r.eventId === eid));
  toast('Registration cancelled');
  refreshAll();
}

/* ================================================================
   FEEDBACK
================================================================ */
async function submitFeedback(eid, rating, comment) {
  if (!CU) return openLogin();
  const fb = await api('POST', '/feedbacks', { userId: CU.id, eventId: eid, rating, comment: comment || '' });
  DB.feedbacks.push(normFeedback(fb));
  toast('Feedback submitted! Thank you ⭐');
  refreshAll();
}

/* ================================================================
   ANNOUNCEMENTS
================================================================ */
async function createAnnouncement(text) {
  const ann = await api('POST', '/announcements', { text });
  DB.announcements.push(ann);
  renderAnnouncementBar();
}

async function deleteAnnouncement(id) {
  await api('DELETE', `/announcements/${id}`);
  DB.announcements = DB.announcements.filter(a => a.id !== id);
  renderAnnouncementBar();
}

/* ================================================================
   ORGANIZATIONS
================================================================ */
async function saveOrganization(data) {
  if (editingOrgId) {
    const updated = await api('PUT', `/organizations/${editingOrgId}`, data);
    const norm = normOrg(updated);
    DB.organizations = DB.organizations.map(o => o.id === editingOrgId ? norm : o);
    return norm;
  } else {
    const created = await api('POST', '/organizations', data);
    const norm = normOrg(created);
    DB.organizations.push(norm);
    return norm;
  }
}

async function deleteOrganization(oid) {
  await api('DELETE', `/organizations/${oid}`);
  DB.organizations = DB.organizations.filter(o => o.id !== oid);
  DB.organizationPosts = DB.organizationPosts.filter(p => p.organizationId !== oid);
  DB.organizationFollows = DB.organizationFollows.filter(f => f.organizationId !== oid);
}

async function toggleFollow(oid) {
  if (!CU) return openLogin('login');
  if (CU.role !== 'student') return toast("Only students can follow organizations", 'warning');
  try {
    const res = await api('POST', '/organizations/follows', { userId: CU.id, organizationId: oid });
    if (res.following) {
      DB.organizationFollows.push({ id: res.id, userId: CU.id, organizationId: oid, followedDate: new Date().toISOString() });
      toast('Following!');
    } else {
      DB.organizationFollows = DB.organizationFollows.filter(f => !(f.userId === CU.id && f.organizationId === oid));
      toast('Unfollowed');
    }
    if (document.getElementById('page-orgprofile').classList.contains('active')) renderOrgProfile();
    else renderOrgsDiscover();
  } catch (err) {
    toast(err.message || 'Failed', 'error');
  }
}

/* ================================================================
   ORGANIZATION POSTS
================================================================ */
async function createPost(orgId, data) {
  const post = await api('POST', `/organizations/${orgId}/posts`, data);
  const norm = normPost(post);
  DB.organizationPosts.push(norm);
  return norm;
}

async function likePost(pid) {
  if (!CU) return openLogin('login');
  const p = DB.organizationPosts.find(x => x.id === pid);
  if (!p) return;
  if (!p.likedBy) p.likedBy = [];
  const i = p.likedBy.indexOf(CU.id);
  if (i >= 0) { p.likedBy.splice(i, 1); p.likes = Math.max(0, (p.likes || 1) - 1); }
  else { p.likedBy.push(CU.id); p.likes = (p.likes || 0) + 1; }
  await api('PUT', `/organizations/posts/${pid}`, { likes: p.likes, likedBy: p.likedBy });
  refreshPost(pid);
}

async function addComment(pid) {
  if (!CU) return openLogin('login');
  const inp = document.getElementById('ci_' + pid);
  const text = (inp?.value || '').trim();
  if (!text) return;
  const p = DB.organizationPosts.find(x => x.id === pid);
  if (!p) return;
  if (!p.comments) p.comments = [];
  const c = { id: uid('c'), userId: CU.id, userName: CU.name, text, createdAt: new Date().toISOString() };
  p.comments.push(c);
  await api('PUT', `/organizations/posts/${pid}`, { comments: p.comments });
  inp.value = '';
  refreshPost(pid);
}

async function deleteComment(pid, cid) {
  const p = DB.organizationPosts.find(x => x.id === pid);
  if (!p) return;
  p.comments = (p.comments || []).filter(c => c.id !== cid);
  await api('PUT', `/organizations/posts/${pid}`, { comments: p.comments });
  refreshPost(pid);
}

async function deleteOrgPost(pid) {
  if (!confirm('Delete this post?')) return;
  await api('DELETE', `/organizations/posts/${pid}`);
  DB.organizationPosts = DB.organizationPosts.filter(p => p.id !== pid);
  toast('Post deleted');
  if (document.getElementById('page-orgprofile').classList.contains('active')) renderOrgProfile();
  else if (document.getElementById('page-home').classList.contains('active')) renderFeedPosts();
  else renderOrgMyOrgContent();
}

async function saveEditPost() {
  const modal = document.getElementById('editPostModal');
  if (!modal) return;
  const pid = modal.dataset.pid;
  const p = DB.organizationPosts.find(x => x.id === pid);
  if (!p) return;
  const text = document.getElementById('editPostText').value.trim();
  if (!text && !_editPostPhotos.length) return toast('Post must have text or at least one image', 'error');
  p.content = text;
  if (_editPostPhotos.length) { p.mediaUrls = [..._editPostPhotos]; p.mediaUrl = _editPostPhotos[0]; p.type = 'photo'; }
  else { p.mediaUrls = []; p.mediaUrl = ''; p.type = 'text'; }
  p.editedAt = new Date().toISOString();
  p._expanded = false;
  await api('PUT', `/organizations/posts/${pid}`, {
    content: p.content, mediaUrl: p.mediaUrl, mediaUrls: p.mediaUrls, type: p.type
  });
  closeModal('editPostModal');
  toast('Post updated!');
  refreshPost(pid);
  if (document.getElementById('page-home').classList.contains('active')) renderFeedPosts();
}

/* ================================================================
   USERS
================================================================ */
async function saveProfile(data) {
  if (!CU) return;
  const updated = await api('PUT', `/users/${CU.id}`, data);
  CU = updated;
  DB.users = DB.users.map(u => u.id === CU.id ? updated : u);
  toast('Profile saved!');
  renderNav();
}

async function setUserRole(uid2, role) {
  const u = DB.users.find(x => x.id === uid2);
  if (!u || u.role === 'admin') return;
  await api('PUT', `/users/${uid2}`, { role });
  u.role = role;
  toast(role === 'organizer' ? `${u.name} promoted to organizer` : `${u.name} demoted to student`);
  renderAdminTab();
}

/* ================================================================
   ATTENDANCE & CERTIFICATES
================================================================ */
async function checkInUser(eid, uid2) {
  await api('POST', '/attendance/checkin', { eventId: eid, userId: uid2 });
  if (!DB.attendance[eid]) DB.attendance[eid] = {};
  DB.attendance[eid][uid2] = true;
}

async function issueCertificate(eid, uid2) {
  await api('POST', '/certificates', { eventId: eid, userId: uid2 });
  if (!DB.certificates[eid]) DB.certificates[eid] = {};
  DB.certificates[eid][uid2] = true;
}

/* ================================================================
   MIGRATION HELPER (run once from browser console)

   Usage:
     migrateLocalStorageToServer()

   This reads your existing localStorage data and POSTs it to
   POST /api/migrate so the server imports it into SQLite.
================================================================ */
async function migrateLocalStorageToServer() {
  const LS_KEY = 'cems_csu_v1';
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return console.warn('No localStorage data found under', LS_KEY);
  try {
    const result = await api('POST', '/migrate', { dump: raw });
    console.log('Migration complete:', result);
    alert('Migration complete! ' + JSON.stringify(result.migrated, null, 2));
  } catch (err) {
    console.error('Migration failed:', err);
    alert('Migration failed: ' + err.message);
  }
}

/* ================================================================
   INIT — replaces the synchronous init() at the bottom of app.js
================================================================ */
async function init() {
  await loadDB();
  renderNav();

  // Restore last page
  const lastPage = sessionStorage.getItem('cems_current_page') || 'home';
  try { showPage(lastPage); } catch { showPage('home'); }

  // Keyboard shortcut
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
  });
}

document.addEventListener('DOMContentLoaded', init);

/* ================================================================
   NOTE: All other functions (renderHome, renderBrowseEvents,
   renderStudentDash, renderOrganizerDash, renderAdminDash,
   renderFbPostHtml, eventCard, escapeHtml, toast, showPage,
   toggleSeeMore, openEditPost, renderEditPostThumbs,
   removeEditPostPhoto, handleEditPostPhotos, etc.) are IDENTICAL
   to app.js and are loaded from a shared file.

   RECOMMENDED SETUP:
     <script src="app-shared.js"></script>   ← rendering + UI logic only
     <script src="app-with-db.js"></script>  ← data layer (this file)

   For simplicity in a single-file deploy, copy the rendering
   functions from app.js directly above this section and remove
   the duplicate init() call at the bottom of app.js.
================================================================ */
