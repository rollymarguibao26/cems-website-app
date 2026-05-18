/* ============================ STATE ============================ */
const LS_KEY='cems_csu_v1';
let DB={users:[],events:[],regs:[],announcements:[],feedbacks:[],organizations:[],organizationPosts:[],organizationFollows:[]};
let CU=null; // current user
let authMode='login';
let homeFilter='all';
let orgTab='all';
let adminTab='pending';
let editingEventId=null;
let browseFilter='all';
let pendingFbEventId=null;
let pendingFbRating=0;
let orgsPageTab='all';
let viewingOrgId=null;
let editingOrgId=null;
let orgMainTab='events';
let pendingOrgLogo=null;
let pendingOrgCover=null;
let pendingPostPhoto=null;
let pendingPostVideo=null;
let postingForOrgId=null;

/* ============================ INIT ============================ */
function loadDB(){
  try{
    const r=localStorage.getItem(LS_KEY);
    if(r){
      const parsed=JSON.parse(r);
      if(parsed&&typeof parsed==='object'){
        DB=parsed;
        if(!Array.isArray(DB.users))DB.users=[];
        if(!Array.isArray(DB.events))DB.events=[];
        if(!Array.isArray(DB.regs))DB.regs=[];
        if(!Array.isArray(DB.announcements))DB.announcements=[];
        if(!Array.isArray(DB.feedbacks))DB.feedbacks=[];
        if(!Array.isArray(DB.organizations))DB.organizations=[];
        if(!Array.isArray(DB.organizationPosts))DB.organizationPosts=[];
        if(!Array.isArray(DB.organizationFollows))DB.organizationFollows=[];
        if(!DB.attendance||typeof DB.attendance!=='object'||Array.isArray(DB.attendance))DB.attendance={};
        if(!DB.certificates||typeof DB.certificates!=='object'||Array.isArray(DB.certificates))DB.certificates={};
      }
    }
  }catch(e){
    console.warn('CEMS: Failed to load saved data, starting fresh.',e);
    DB={users:[],events:[],regs:[],announcements:[],feedbacks:[],organizations:[],organizationPosts:[],organizationFollows:[],attendance:{},certificates:{}};
  }
  if(!DB.users||!DB.users.length) seed();
  if(DB.orgRequests)delete DB.orgRequests;
  if(DB.events)DB.events.forEach(e=>{if(e.featured===undefined)e.featured=false});
  if(!DB.feedbacks)DB.feedbacks=[];
  if(!DB.attendance)DB.attendance={};
  if(!DB.certificates)DB.certificates={};
  if(!DB.organizations)DB.organizations=[];
  if(!DB.organizationPosts)DB.organizationPosts=[];
  if(!DB.organizationFollows)DB.organizationFollows=[];
  const cuId=localStorage.getItem(LS_KEY+'_cu');
  if(cuId){CU=DB.users.find(u=>u.id===cuId)||null}
}
function saveDB(){localStorage.setItem(LS_KEY,JSON.stringify(DB))}
function uid(p='id'){return p+'_'+Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-3)}

function seed(){
  DB.users=[
    {id:'u_admin',name:'CSU Administrator',email:'admin@carsu.edu.ph',role:'admin',dept:'Administrative',sid:'ADMIN-001'},
    {id:'u_org',name:'Maria Santos',email:'organizer@carsu.edu.ph',role:'organizer',dept:'College of Engineering & IT',sid:'ORG-002'},
    {id:'u_stu',name:'Juan Dela Cruz',email:'student@carsu.edu.ph',role:'student',dept:'College of Engineering & IT',sid:'2023-00045'},
    {id:'u_stu2',name:'Anna Reyes',email:'anna@carsu.edu.ph',role:'student',dept:'College of Education',sid:'2023-00112'},
  ];
  const today=new Date();const future=(d)=>{const x=new Date(today);x.setDate(x.getDate()+d);return x.toISOString().slice(0,10)};
  DB.events=[
    {id:'e1',title:'Engineering Innovation Summit 2025',desc:'A gathering of CSU engineering students showcasing capstone projects and emerging research in renewable energy and IoT.',category:'Academic',date:future(7),time:'09:00',venue:'CSU Main Auditorium',capacity:200,organizerId:'u_org',status:'approved',icon:'🎓'},
    {id:'e2',title:'Golden Paddlers Cultural Night',desc:'Celebrate Caraga heritage with traditional dances, music, and a Mr. & Ms. CSU pageant.',category:'Cultural',date:future(14),time:'18:00',venue:'CSU Open Grounds',capacity:500,organizerId:'u_org',status:'approved',icon:'🎭',img:'gold'},
    {id:'e3',title:'Inter-College Basketball Championship',desc:'Five-day tournament featuring all CSU colleges battling for the Golden Paddler trophy.',category:'Sports',date:future(21),time:'08:00',venue:'CSU Gymnasium',capacity:300,organizerId:'u_org',status:'approved',icon:'🏀',img:'light'},
    {id:'e4',title:'AI & Machine Learning Workshop',desc:'Hands-on workshop on Python, scikit-learn, and TensorFlow for beginners.',category:'Workshop',date:future(10),time:'13:00',venue:'CEIT Computer Lab 3',capacity:40,organizerId:'u_org',status:'approved',icon:'🤖'},
    {id:'e5',title:'Mental Health Awareness Seminar',desc:'Guest speakers from CSU Guidance Office on coping with academic stress.',category:'Seminar',date:future(4),time:'10:00',venue:'CAS Function Hall',capacity:150,organizerId:'u_org',status:'approved',icon:'💚',img:'gold'},
    {id:'e6',title:'Community Outreach: Tree Planting',desc:'Join Forestry students in restoring 500 trees in Mt. Diwata watershed.',category:'Community',date:future(28),time:'06:00',venue:'Mt. Diwata, Agusan del Sur',capacity:80,organizerId:'u_org',status:'pending',icon:'🌱',img:'light'},
  ];
  DB.regs=[{id:'r1',userId:'u_stu',eventId:'e1',date:new Date().toISOString()}];
  DB.announcements=[];
  // mark a few as featured by default
  DB.events[0].featured=true;DB.events[1].featured=true;DB.events[3].featured=true;
  // Seed organizations
  DB.organizations=[
    {id:'org_eng',name:'CSU Engineering Society',description:'Building innovators, shaping the future. Home of CSU\u2019s engineering students.',logo:'🔧',coverPhoto:'',organizerId:'u_org',createdDate:'2025-01-15',category:'Academic',socialLinks:{facebook:'',instagram:''}},
    {id:'org_cultural',name:'Golden Paddlers Cultural Troupe',description:'Preserving Caraga heritage through music, dance, and arts.',logo:'🎭',coverPhoto:'',organizerId:'u_org',createdDate:'2025-01-20',category:'Cultural',socialLinks:{facebook:'',instagram:''}}
  ];
  DB.organizationPosts=[
    {id:'post_1',organizationId:'org_eng',type:'text',content:'Welcome to the CSU Engineering Society page! Stay tuned for our upcoming Innovation Summit. 🎓',mediaUrl:'',createdAt:new Date().toISOString(),likes:12,likedBy:[],comments:[]},
    {id:'post_2',organizationId:'org_cultural',type:'text',content:'Auditions for the Cultural Night are open! DM us to join the troupe. 🎭✨',mediaUrl:'',createdAt:new Date().toISOString(),likes:8,likedBy:[],comments:[]}
  ];
  DB.organizationFollows=[];
  saveDB();
}

/* ============================ NAV/UI ============================ */
function renderNav(){
  const el=document.getElementById('navActions');
  if(!CU){
    // Public: Home, Sign In, Sign Up only
    el.innerHTML=`<button class="nav-link" onclick="showPage('home')">Home</button>
      <button class="btn btn-ghost" onclick="openLogin('login')">Sign In</button>
      <button class="btn btn-primary" onclick="openLogin('signup')">Sign Up</button>`;
  }else{
    const init=CU.name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase();
    const dashLabel=CU.role==='admin'?'Admin':CU.role==='organizer'?'Organizer':'Dashboard';
    const dashPage=CU.role==='admin'?'admin':CU.role==='organizer'?'organizer':'dashboard';
    // Build middle links based on role
    let midLinks=`<button class="nav-link" onclick="showPage('home')">Home</button>
      <button class="nav-link" onclick="showPage('browse')">Events</button>`;
    midLinks+=`<button class="nav-link" onclick="showPage('${dashPage}')">${dashLabel}</button>`;
    el.innerHTML=`${midLinks}
      <span class="role-badge ${CU.role}">${CU.role}</span>
      <div class="user-menu-wrap">
        <div class="user-avatar" onclick="toggleUserMenu()">${init}</div>
        <div class="user-dropdown" id="userDrop">
          <div class="user-dropdown-head"><div class="user-dropdown-name">${escapeHtml(CU.name)}</div><div class="user-dropdown-email">${escapeHtml(CU.email)}</div></div>
          <div class="user-dropdown-item" onclick="showPage('${dashPage}');toggleUserMenu()">📊 ${dashLabel}</div>
          <div class="user-dropdown-divider"></div>
          <div class="user-dropdown-item" onclick="logout()" style="color:var(--danger)">🚪 Sign Out</div>
        </div>
      </div>`;
  }
}
function toggleUserMenu(){document.getElementById('userDrop').classList.toggle('open')}
document.addEventListener('click',e=>{if(!e.target.closest('.user-menu-wrap')){const d=document.getElementById('userDrop');if(d)d.classList.remove('open')}if(!e.target.closest('.nav-search')){document.getElementById('searchDrop').classList.remove('show')}});

function userHasAccess(p){
  if(!CU)return['home','browse'].includes(p);
  if(p==='dashboard')return CU.role==='student';
  if(p==='organizer')return CU.role==='organizer';
  if(p==='admin')return CU.role==='admin';
  if(p==='orgs'||p==='orgprofile')return !!CU;
  return true;
}
function showPage(p){
  if(p==='dashboard'&&(!CU||CU.role!=='student')){return openLogin()}
  if(p==='organizer'&&(!CU||CU.role!=='organizer')){return openLogin()}
  if(p==='admin'&&(!CU||CU.role!=='admin')){return openLogin()}
  if((p==='orgs'||p==='orgprofile')&&!CU){openLogin();return}
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  const pg=document.getElementById('page-'+p);if(pg)pg.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
  localStorage.setItem('cems_current_page',p);
  if(p==='home')renderHome();
  if(p==='browse')renderBrowseEvents();
  if(p==='dashboard')renderStudentDash();
  if(p==='organizer')renderOrganizerDash();
  if(p==='admin')renderAdminDash();
  if(p==='orgs')renderOrgsPage();
  if(p==='orgprofile')renderOrgProfile();
}

function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c])}
function toast(msg,type='success'){
  const t=document.createElement('div');t.className='toast-msg '+type;t.textContent=msg;
  document.getElementById('toast').appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(120%)';t.style.transition='all .3s';setTimeout(()=>t.remove(),300)},3200);
}

/* ============================ AUTH ============================ */
function openLogin(mode='login'){authMode=mode;renderAuthMode();document.getElementById('loginModal').classList.add('open')}
function toggleAuthMode(){authMode=authMode==='login'?'signup':'login';renderAuthMode()}
function renderAuthMode(){
  document.getElementById('authTitle').textContent=authMode==='login'?'Sign in to CEMS':'Create your CEMS account';
  document.getElementById('signupOnly').style.display=authMode==='signup'?'block':'none';
  document.getElementById('authSubmitBtn').textContent=authMode==='login'?'Sign In':'Create Account';
  document.getElementById('switchAuthTxt').textContent=authMode==='login'?"Don't have an account?":'Already have an account?';
  document.getElementById('switchAuthLink').textContent=authMode==='login'?'Sign up':'Sign in';
}
function submitAuth(){
  const email=document.getElementById('auEmail').value.trim().toLowerCase();
  const pass=document.getElementById('auPass').value;
  if(!email||!pass)return toast('Please fill in all fields','error');
  if(authMode==='login'){
    let u=DB.users.find(x=>x.email===email);
    if(!u){return toast('No account found with that email','error')}
    CU=u;localStorage.setItem(LS_KEY+'_cu',u.id);
    closeModal('loginModal');toast(`Welcome back, ${u.name}!`);renderNav();
    showPage(u.role==='admin'?'admin':u.role==='organizer'?'organizer':'dashboard');
  }else{
    const name=document.getElementById('auFull').value.trim();
    const sid=document.getElementById('auId').value.trim();
    const dept=document.getElementById('auDept').value;
    if(!name||!sid)return toast('Please complete all fields','error');
    if(DB.users.find(x=>x.email===email))return toast('Email already registered','error');
    const u={id:uid('u'),name,email,role:'student',dept,sid};
    DB.users.push(u);
    toast(`Welcome to CEMS, ${name}!`);
    CU=u;localStorage.setItem(LS_KEY+'_cu',u.id);saveDB();
    closeModal('loginModal');renderNav();showPage('dashboard');
  }
}
function logout(){CU=null;localStorage.removeItem(LS_KEY+'_cu');localStorage.removeItem('cems_current_page');renderNav();showPage('home');toast('Signed out')}
function hardResetDB(){
  if(!confirm('This will clear all app data and restore demo accounts. Continue?'))return;
  localStorage.removeItem(LS_KEY);localStorage.removeItem(LS_KEY+'_cu');
  DB={users:[],events:[],regs:[],announcements:[],feedbacks:[],attendance:{},certificates:{}};
  CU=null;seed();renderNav();renderHome();
  closeModal('loginModal');toast('App data reset. Demo accounts restored!');
}
function closeModal(id){document.getElementById(id).classList.remove('open')}
document.addEventListener('click',e=>{if(e.target.classList.contains('modal'))e.target.classList.remove('open')});

/* ============================ HOME ============================ */
function eventStatus(ev){
  const today=new Date().toISOString().slice(0,10);
  if(ev.date<today)return 'past';
  if(ev.date===today)return 'ongoing';
  return 'upcoming';
}

let feedTab='feed'; // 'feed' or 'discover'
function setFeedTab(t,el){
  feedTab=t;
  document.querySelectorAll('#feedTabs .tab').forEach(x=>x.classList.remove('active'));
  if(el)el.classList.add('active');
  renderFeedPosts();
}

function renderHome(){
  const publicDiv=document.getElementById('home-public');
  const feedDiv=document.getElementById('home-feed');
  if(!CU){
    // Public landing
    publicDiv.style.display='';
    feedDiv.style.display='none';
    renderFeatured();
    renderHomeEvents();
    renderPastEvents();
  } else {
    // Logged-in: news feed
    publicDiv.style.display='none';
    feedDiv.style.display='';
    document.getElementById('feedGreetName').textContent=CU.name.split(' ')[0];
    renderFeedComposer();
    renderFeedPosts();
    renderFeedSidebar();
  }
}

function renderFeatured(){
  const el=document.getElementById('featuredStrip');if(!el)return;
  const evts=DB.events.filter(e=>e.status==='approved'&&e.featured).slice(0,4);
  if(!evts.length){el.innerHTML='<div class="featured-empty">No featured events yet. Admins can mark events as featured from the admin panel.</div>';return}
  el.innerHTML=evts.map(e=>`<div class="featured-card" onclick="viewEvent('${e.id}')">
    <div class="ph">${e.photo?`<img src="${e.photo}" alt="">`:(e.icon||'🎉')}<span class="star">⭐ Featured</span></div>
    <div class="body"><h4>${escapeHtml(e.title)}</h4><div class="m">📅 ${formatDate(e.date)} · 📍 ${escapeHtml(e.venue)}</div></div>
  </div>`).join('');
}
function renderHomeEvents(){
  // Public: show max 6 upcoming events
  const el=document.getElementById('homeEvents');if(!el)return;
  let evts=DB.events.filter(e=>e.status==='approved'&&eventStatus(e)!=='past')
    .sort((a,b)=>a.date.localeCompare(b.date)).slice(0,6);
  const ctaEl=document.getElementById('homeSignInCta');
  if(!evts.length){el.innerHTML='<div class="empty-state" style="grid-column:1/-1"><span class="ico">📭</span><h4>No events yet</h4><p>Check back soon for upcoming campus events.</p></div>';}
  else{el.innerHTML=evts.map(e=>eventCard(e)).join('');}
  if(ctaEl)ctaEl.style.display='block';
}
function renderPastEvents(){
  const el=document.getElementById('pastEvents');if(!el)return;
  const evts=DB.events.filter(e=>e.status==='approved'&&eventStatus(e)==='past')
    .sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
  if(!evts.length){el.innerHTML='<div class="empty-state" style="grid-column:1/-1"><span class="ico">📜</span><h4>No past events</h4><p>Past events will appear here once they have ended.</p></div>';return}
  el.innerHTML=evts.map(e=>eventCard(e)).join('');
}

/* ---- Feed composer (organizers only) ---- */
function renderFeedComposer(){
  const wrap=document.getElementById('feedComposer');if(!wrap)return;
  const o=ownedOrg();
  if(!CU||CU.role==='student'||!o){wrap.style.display='none';return;}
  wrap.style.display='block';
  const init=CU.name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase();
  wrap.innerHTML=`<div class="fb-composer">
    <div class="fb-composer-row">
      <div class="fb-composer-avatar">${init}</div>
      <div class="fb-composer-input" style="cursor:text;user-select:none" onclick="openOrgPostModal('${o.id}')">
        What's happening at ${escapeHtml(o.name)}?
      </div>
    </div>
    <div class="fb-composer-btns">
      <button class="fb-composer-btn" onclick="openOrgPostModal('${o.id}')">📸 Photo/Video</button>
      <button class="fb-composer-btn" onclick="openOrgPostModal('${o.id}')">📝 Post Update</button>
    </div>
  </div>`;
}

/* ---- Feed posts ---- */
function renderFeedPosts(){
  const wrap=document.getElementById('feedPostsWrap');if(!wrap)return;
  let posts=[];
  if(feedTab==='feed'){
    // Posts from orgs the user follows (students) or all orgs (others)
    let orgIds;
    if(CU.role==='student'){
      orgIds=new Set((DB.organizationFollows||[]).filter(f=>f.userId===CU.id).map(f=>f.organizationId));
    } else {
      orgIds=new Set((DB.organizations||[]).map(o=>o.id));
    }
    posts=(DB.organizationPosts||[]).filter(p=>orgIds.has(p.organizationId));
    if(!posts.length&&CU.role==='student'){
      // Show discover encouragement
      wrap.innerHTML=`<div class="empty-state" style="background:#fff;border:1px solid var(--border);border-radius:16px;padding:48px 24px">
        <span class="ico">📰</span>
        <h4>Your feed is empty</h4>
        <p>Follow organizations to see their posts here. Check out <strong>Discover</strong> to find organizations.</p>
        <button class="btn btn-primary" style="margin-top:18px" onclick="setFeedTab('discover',document.querySelectorAll('#feedTabs .tab')[1])">🔍 Discover Organizations</button>
      </div>`;
      return;
    }
  } else {
    // Discover: all posts from all orgs
    posts=(DB.organizationPosts||[]).slice();
  }
  posts=posts.slice().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')).slice(0,20);
  if(!posts.length){
    wrap.innerHTML='<div class="empty-state" style="background:#fff;border:1px solid var(--border);border-radius:16px;padding:48px 24px"><span class="ico">📭</span><h4>No posts yet</h4><p>Organizations haven\'t posted anything yet.</p></div>';
    return;
  }
  const getIsOwner=p=>{const o=getOrgById(p.organizationId);return CU&&o&&o.organizerId===CU.id};
  wrap.innerHTML=posts.map(p=>renderFbPostHtml(p,getIsOwner(p))).join('');
}

/* ---- Feed sidebar ---- */
function renderFeedSidebar(){
  // Upcoming events
  const evEl=document.getElementById('feedUpcomingEvents');
  if(evEl){
    const upcoming=DB.events.filter(e=>e.status==='approved'&&eventStatus(e)!=='past')
      .sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4);
    if(!upcoming.length){evEl.innerHTML='<div style="padding:16px;color:var(--text-muted);font-size:13px">No upcoming events.</div>'}
    else{evEl.innerHTML=upcoming.map(e=>`
      <div onclick="viewEvent('${e.id}')" style="display:flex;gap:12px;align-items:center;padding:12px 18px;cursor:pointer;border-bottom:1px solid var(--border);transition:background .15s" onmouseenter="this.style.background='var(--csu-green-soft)'" onmouseleave="this.style.background=''">
        <div style="width:42px;height:42px;border-radius:10px;background:var(--grad-hero);color:var(--csu-gold);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${e.icon||'🎉'}</div>
        <div style="min-width:0">
          <div style="font-weight:600;font-size:13px;color:var(--csu-green-dark);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(e.title)}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px">📅 ${formatDate(e.date)}</div>
        </div>
      </div>`).join('')+'<div style="padding:10px 18px"><button class="btn btn-outline btn-sm" onclick="showPage(\'browse\')" style="width:100%;justify-content:center">View All Events →</button></div>'}
  }
  // Orgs sidebar
  const orgEl=document.getElementById('feedSuggestedOrgs');
  if(orgEl){
    const orgs=(DB.organizations||[]).slice(0,5);
    if(!orgs.length){orgEl.innerHTML='<div style="color:var(--text-muted);font-size:13px">No organizations yet.</div>'}
    else{orgEl.innerHTML=orgs.map(o=>{
      const following=isFollowing(o.id);
      const isOwn=CU&&CU.id===o.organizerId;
      return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
        <div onclick="openOrgProfile('${o.id}')" style="cursor:pointer;flex-shrink:0">${orgLogoHtml(o,38)}</div>
        <div onclick="openOrgProfile('${o.id}')" style="flex:1;min-width:0;cursor:pointer">
          <div style="font-weight:600;font-size:13px;color:var(--csu-green-dark);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(o.name)}</div>
          <div style="font-size:11px;color:var(--text-muted)">${orgFollowerCount(o.id)} followers</div>
        </div>
        ${isOwn?`<span style="font-size:10px;color:var(--csu-green-dark);font-weight:700">Your Org</span>`:
         `<button class="btn btn-sm ${following?'btn-outline':'btn-primary'}" style="font-size:11px;padding:4px 10px" onclick="toggleFollow('${o.id}')">${following?'✓':'+'}</button>`}
      </div>`;
    }).join('')+'<div style="margin-top:10px"><button class="btn btn-outline btn-sm" onclick="showPage(\'orgs\')" style="width:100%;justify-content:center">All Organizations →</button></div>'}
  }
}

function setHomeFilter(c,el){homeFilter=c;document.querySelectorAll('#homeFilters .filter-chip').forEach(x=>x.classList.remove('active'));if(el)el.classList.add('active');renderHomeEvents()}
function regCount(eid){return DB.regs.filter(r=>r.eventId===eid).length}
function isReg(eid){return CU&&DB.regs.find(r=>r.userId===CU.id&&r.eventId===eid)}

/* ===== FEEDBACK HELPERS ===== */
function eventFeedbacks(eid){return DB.feedbacks.filter(f=>f.eventId===eid)}
function avgRating(eid){const fs=eventFeedbacks(eid);if(!fs.length)return 0;return fs.reduce((s,f)=>s+f.rating,0)/fs.length}
function userFeedback(eid){return CU&&DB.feedbacks.find(f=>f.eventId===eid&&f.userId===CU.id)}
function starsHtml(rating,size){const r=Math.round(rating);size=size||14;let h=`<span class="stars" style="font-size:${size}px">`;for(let i=1;i<=5;i++)h+=`<span class="st ${i<=r?'on':''}">★</span>`;h+='</span>';return h}
function ratingLine(eid){const fs=eventFeedbacks(eid);if(!fs.length)return '';const avg=avgRating(eid);return `<div class="rating-line">${starsHtml(avg,13)} ${avg.toFixed(1)} (${fs.length} review${fs.length===1?'':'s'})</div>`}

function goBrowseEvents(){
  if(CU){showPage('browse')}
  else{openLogin('login')}
}
function setBrowseFilter(c,el){browseFilter=c;document.querySelectorAll('#browseFilters .filter-chip').forEach(x=>x.classList.remove('active'));el.classList.add('active');renderBrowseEvents()}
function renderBrowseEvents(){
  const el=document.getElementById('browseEvents');if(!el)return;
  let evts=DB.events.filter(e=>e.status==='approved');
  if(browseFilter!=='all')evts=evts.filter(e=>e.category===browseFilter);
  const q=(document.getElementById('browseSearch').value||'').toLowerCase().trim();
  if(q)evts=evts.filter(e=>e.title.toLowerCase().includes(q)||e.desc.toLowerCase().includes(q)||e.venue.toLowerCase().includes(q));
  const sort=document.getElementById('browseSort').value;
  if(sort==='date')evts.sort((a,b)=>a.date.localeCompare(b.date));
  if(sort==='name')evts.sort((a,b)=>a.title.localeCompare(b.title));
  if(sort==='popular')evts.sort((a,b)=>regCount(b.id)-regCount(a.id));
  if(sort==='rating')evts.sort((a,b)=>avgRating(b.id)-avgRating(a.id));
  if(!evts.length){el.innerHTML='<div class="empty-state" style="grid-column:1/-1"><span class="ico">🔎</span><h4>No events match</h4><p>Try a different filter or search term.</p></div>';return}
  el.innerHTML=evts.map(e=>eventCard(e)).join('');
}
function eventCard(e){
  const cnt=regCount(e.id),pct=Math.min(100,Math.round(cnt/e.capacity*100));
  const status=eventStatus(e);
  const imgClass=e.img||'';
  const ufb=status==='past'?userFeedback(e.id):null;
  let pastBtn='<button class="btn btn-outline btn-sm" disabled>Ended</button>';
  if(status==='past'&&CU&&CU.role==='student'&&isReg(e.id)){
    pastBtn=ufb
      ?`<button class="btn btn-outline btn-sm" disabled>You rated ${ufb.rating}★</button>`
      :`<button class="btn btn-gold btn-sm" onclick="event.stopPropagation();openFeedback('${e.id}')">⭐ Leave Feedback</button>`;
  }
  return `<div class="event-card" onclick="viewEvent('${e.id}')">
    <div class="event-img ${imgClass} ${e.photo?'has-photo':''}">${e.photo?`<img src="${e.photo}" alt="${escapeHtml(e.title)}">`:(e.icon||'🎉')}
      <span class="event-cat-badge">${e.category}</span>
      <span class="event-status-badge evt-status-${status}">${status}</span>
    </div>
    <div class="event-body">
      <div class="event-title">${escapeHtml(e.title)}</div>
      <div class="event-desc">${escapeHtml(e.desc)}</div>
      ${ratingLine(e.id)}
      <div class="event-meta">
        <div class="event-meta-row"><span class="ico">📅</span>${formatDate(e.date)} · ${e.time}</div>
        <div class="event-meta-row"><span class="ico">📍</span>${escapeHtml(e.venue)}</div>
        <div class="event-meta-row"><span class="ico">👥</span>${cnt} / ${e.capacity} registered</div>
      </div>
      <div class="event-progress"><div class="event-progress-bar" style="width:${pct}%"></div></div>
      <div class="event-actions">
        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();viewEvent('${e.id}')">Details</button>
        ${status==='past'?pastBtn:
          isReg(e.id)?'<button class="btn btn-outline btn-sm" onclick="event.stopPropagation();unregister(\''+e.id+'\')">Unregister</button>':
          '<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();register(\''+e.id+'\')">Register</button>'}
      </div>
    </div>
  </div>`;
}
function formatDate(d){const dt=new Date(d+'T00:00');return dt.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}

/* ============================ REGISTER ============================ */
function register(eid){
  if(!CU)return openLogin();
  if(CU.role!=='student')return toast('Only students can register for events','error');
  const ev=DB.events.find(e=>e.id===eid);if(!ev)return;
  if(eventStatus(ev)==='past')return toast('This event has ended','error');
  if(isReg(eid))return toast('Already registered','warning');
  if(regCount(eid)>=ev.capacity)return toast('Event is at full capacity','error');
  DB.regs.push({id:uid('r'),userId:CU.id,eventId:eid,date:new Date().toISOString()});saveDB();
  toast(`Registered for "${ev.title}"!`);refreshAll();
}
function unregister(eid){
  if(!CU)return;DB.regs=DB.regs.filter(r=>!(r.userId===CU.id&&r.eventId===eid));saveDB();toast('Registration cancelled');refreshAll();
}

/* ============================ EVENT DETAILS ============================ */
function viewEvent(eid){
  const e=DB.events.find(x=>x.id===eid);if(!e)return;
  const org=DB.users.find(u=>u.id===e.organizerId);
  const cnt=regCount(eid),pct=Math.min(100,Math.round(cnt/e.capacity*100));
  const status=eventStatus(e);const imgClass=e.img||'';
  const fbs=eventFeedbacks(eid);const avg=avgRating(eid);
  const ufb=userFeedback(eid);
  const showFbSummary=CU&&(CU.role==='admin'||CU.id===e.organizerId);
  let actionBtn;
  if(status==='past'){
    if(CU&&CU.role==='student'&&isReg(eid)){
      actionBtn=ufb
        ?`<button class="btn btn-outline" disabled>You rated ${ufb.rating}★</button>`
        :`<button class="btn btn-gold" onclick="openFeedback('${eid}')">⭐ Leave Feedback</button>`;
    }else{actionBtn='<button class="btn btn-outline" disabled>Event Ended</button>'}
  }else{
    actionBtn=isReg(eid)
      ?`<button class="btn btn-outline" onclick="unregister('${eid}');viewEvent('${eid}')">Unregister</button>`
      :`<button class="btn btn-primary" onclick="register('${eid}');viewEvent('${eid}')">🎟️ Register Now</button>`;
  }
  document.getElementById('eventDetailsBody').innerHTML=`
    <button class="btn btn-outline" onclick="showPage('home')" style="margin-bottom:24px">← Back to Events</button>
    <div class="panel">
      <div class="event-img ${imgClass} ${e.photo?'has-photo':''}" style="height:280px;border-radius:16px 16px 0 0;font-size:96px">${e.photo?`<img src="${e.photo}" alt="${escapeHtml(e.title)}">`:(e.icon||'🎉')}
        <span class="event-cat-badge">${e.category}</span>
        <span class="event-status-badge evt-status-${status}">${status}</span>
      </div>
      <div class="panel-body">
        <h1 class="serif" style="font-size:36px;color:var(--csu-green-dark);margin-bottom:12px">${escapeHtml(e.title)}</h1>
        ${fbs.length?`<div class="rating-line" style="font-size:14px;margin-bottom:14px">${starsHtml(avg,16)} <strong style="color:var(--csu-green-dark)">${avg.toFixed(1)}</strong> · ${fbs.length} review${fbs.length===1?'':'s'}</div>`:''}
        <p style="color:var(--text-muted);font-size:16px;line-height:1.7;margin-bottom:24px">${escapeHtml(e.desc)}</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:18px;margin-bottom:24px">
          <div><div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:4px">📅 Date & Time</div><div style="font-weight:600;color:var(--csu-green-dark)">${formatDate(e.date)}<br>${e.time}</div></div>
          <div><div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:4px">📍 Venue</div><div style="font-weight:600;color:var(--csu-green-dark)">${escapeHtml(e.venue)}</div></div>
          <div><div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:4px">👥 Capacity</div><div style="font-weight:600;color:var(--csu-green-dark)">${cnt} / ${e.capacity}</div><div class="event-progress" style="margin-top:6px"><div class="event-progress-bar" style="width:${pct}%"></div></div></div>
          <div><div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:4px">🛡️ Organizer</div><div style="font-weight:600;color:var(--csu-green-dark)">${escapeHtml(org?org.name:'CSU')}</div></div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${actionBtn}
          <button class="btn btn-outline" onclick="shareEvent('${eid}')">🔗 Share</button>
        </div>
        ${showFbSummary?renderFeedbackSection(eid):''}
      </div>
    </div>`;
  showPage('event');
}

function renderFeedbackSection(eid){
  const fbs=eventFeedbacks(eid).slice().sort((a,b)=>b.date.localeCompare(a.date));
  const avg=avgRating(eid);
  let body='';
  if(!fbs.length){body='<div class="empty-state"><span class="ico">💬</span><h4>No feedback yet</h4><p>Feedback appears once attendees submit reviews.</p></div>'}
  else{body=fbs.slice(0,8).map(f=>{const u=DB.users.find(x=>x.id===f.userId);return `<div class="fb-item">
    <div class="fb-head"><strong>${escapeHtml(u?u.name:'Student')}</strong> ${starsHtml(f.rating,14)} <span class="date">${formatDate(f.date.slice(0,10))}</span></div>
    <div class="fb-comment">${escapeHtml(f.comment)}</div></div>`}).join('')}
  return `<div style="margin-top:32px;padding-top:24px;border-top:1px solid var(--border)">
    <h3 class="serif" style="font-size:22px;color:var(--csu-green-dark);margin-bottom:8px">Feedback Summary</h3>
    <div class="rating-line" style="font-size:14px;margin-bottom:16px">${starsHtml(avg,16)} <strong style="color:var(--csu-green-dark)">${avg.toFixed(1)}</strong> avg · ${fbs.length} response${fbs.length===1?'':'s'}</div>
    ${body}
  </div>`;
}

/* ============================ FEEDBACK ============================ */
function openFeedback(eid){
  if(!CU)return openLogin();
  if(CU.role!=='student')return toast('Only students can leave feedback','error');
  const ev=DB.events.find(e=>e.id===eid);if(!ev)return;
  if(eventStatus(ev)!=='past')return toast('Feedback opens after the event has ended','warning');
  if(!isReg(eid))return toast('Only registered participants can leave feedback','error');
  if(userFeedback(eid))return toast('You already submitted feedback','warning');
  pendingFbEventId=eid;pendingFbRating=0;
  document.getElementById('fbEventTitle').textContent=ev.title;
  document.getElementById('fbComment').value='';
  renderFbStarPicker();
  document.getElementById('feedbackModal').classList.add('open');
}
function renderFbStarPicker(){
  const el=document.getElementById('fbStarPicker');
  let h='';for(let i=1;i<=5;i++)h+=`<span class="st input ${i<=pendingFbRating?'on':''}" onclick="setFbRating(${i})">★</span>`;
  el.innerHTML=h;
}
function setFbRating(n){pendingFbRating=n;renderFbStarPicker()}
function submitFeedback(){
  if(!pendingFbRating)return toast('Please select a star rating','error');
  const c=document.getElementById('fbComment').value.trim();
  if(c.length<10)return toast('Review must be at least 10 characters','error');
  if(userFeedback(pendingFbEventId))return toast('You already submitted feedback','warning');
  DB.feedbacks.push({id:uid('f'),eventId:pendingFbEventId,userId:CU.id,rating:pendingFbRating,comment:c,date:new Date().toISOString()});
  saveDB();closeModal('feedbackModal');toast('Thanks for your feedback!');refreshAll();
}
function viewEventFeedback(eid){
  const e=DB.events.find(x=>x.id===eid);if(!e)return;
  const fbs=eventFeedbacks(eid).slice().sort((a,b)=>b.date.localeCompare(a.date));
  const avg=avgRating(eid);
  document.getElementById('vfbTitle').textContent='Feedback — '+e.title;
  let body=`<div class="rating-line" style="font-size:15px;margin-bottom:18px">${starsHtml(avg,18)} <strong style="color:var(--csu-green-dark)">${avg.toFixed(1)}</strong> avg · ${fbs.length} response${fbs.length===1?'':'s'}</div>`;
  if(!fbs.length)body+='<div class="empty-state"><span class="ico">💬</span><h4>No feedback yet</h4></div>';
  else body+=fbs.map(f=>{const u=DB.users.find(x=>x.id===f.userId);return `<div class="fb-item">
    <div class="fb-head"><strong>${escapeHtml(u?u.name:'Student')}</strong> ${starsHtml(f.rating,14)} <span class="date">${formatDate(f.date.slice(0,10))}</span></div>
    <div class="fb-comment">${escapeHtml(f.comment)}</div></div>`}).join('');
  document.getElementById('vfbBody').innerHTML=body;
  document.getElementById('viewFeedbackModal').classList.add('open');
}
function shareEvent(eid){
  const e=DB.events.find(x=>x.id===eid);
  if(navigator.share){navigator.share({title:e.title,text:e.desc}).catch(()=>{})}
  else{navigator.clipboard.writeText(e.title+' — '+e.desc).then(()=>toast('Event copied to clipboard'))}
}

/* ============================ STUDENT DASH ============================ */
function renderStudentDash(){
  if(!CU)return;
  document.getElementById('dashName').textContent=CU.name.split(' ')[0];
  const myRegs=DB.regs.filter(r=>r.userId===CU.id);
  const myEvents=myRegs.map(r=>DB.events.find(e=>e.id===r.eventId)).filter(Boolean);
  const upcoming=myEvents.filter(e=>eventStatus(e)!=='past').sort((a,b)=>a.date.localeCompare(b.date));
  const attended=myEvents.filter(e=>{
    if(!DB.attendance)return false;
    return DB.attendance[e.id+'_'+CU.id]===true;
  });
  const certsCount=myRegs.filter(r=>{
    if(!DB.certificates)return false;
    return !!DB.certificates[r.eventId+'_'+CU.id];
  }).length;
  document.getElementById('ds1').textContent=myRegs.length;
  document.getElementById('ds2').textContent=upcoming.length;
  document.getElementById('ds3').textContent=attended.length;
  document.getElementById('ds4').textContent=certsCount;
  // upcoming
  if(upcoming.length){
    const e=upcoming[0];
    document.getElementById('upcomingBody').innerHTML=`
      <div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
        <div style="width:90px;height:90px;border-radius:14px;background:var(--grad-hero);color:var(--csu-gold);display:flex;align-items:center;justify-content:center;font-size:42px;flex-shrink:0">${e.icon||'🎉'}</div>
        <div style="flex:1;min-width:240px">
          <div style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--csu-green-dark);margin-bottom:6px">${escapeHtml(e.title)}</div>
          <div style="color:var(--text-muted);font-size:14px">📅 ${formatDate(e.date)} · ${e.time}<br>📍 ${escapeHtml(e.venue)}</div>
        </div>
        <button class="btn btn-primary" onclick="viewEvent('${e.id}')">View Details</button>
      </div>`;
  }else{document.getElementById('upcomingBody').innerHTML='<div class="empty-state"><span class="ico">📭</span><h4>No upcoming events</h4><p>Browse events and register for one!</p></div>'}
  // table
  if(myRegs.length){
    document.getElementById('myRegsTbl').innerHTML=`<table class="tbl"><thead><tr><th>Event</th><th>Category</th><th>Date</th><th>Status</th><th>Attendance</th><th>Certificate</th><th>Action</th></tr></thead><tbody>
      ${myRegs.map(r=>{const e=DB.events.find(x=>x.id===r.eventId);if(!e)return'';const s=eventStatus(e);
        const attKey=e.id+'_'+CU.id;
        const attended=DB.attendance&&DB.attendance[attKey];
        let attBadge='<span style="color:var(--text-muted);font-size:12px">—</span>';
        if(attended===true)attBadge='<span style="background:#dcfce7;color:#166534;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700">✅ Attended</span>';
        if(attended===false)attBadge='<span style="background:var(--danger-soft);color:var(--danger);padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700">❌ Absent</span>';
        const cert=DB.certificates&&DB.certificates[attKey];
        let certBtn='<span style="color:var(--text-muted);font-size:12px">—</span>';
        if(cert){
          if(cert.type==='text'){
            const u=DB.users.find(x=>x.id===CU.id);
            const certText=cert.content.replace(/\[Student Name\]/g,u?u.name:CU.name);
            certBtn=`<button class="btn btn-outline btn-sm" onclick="showTextCert('${e.id}','${CU.id}')">📜 View</button>`;
          }else{
            certBtn=`<a href="${cert.data}" download="${cert.name}" class="btn btn-outline btn-sm">📎 Download</a>`;
          }
        }
        return `<tr><td><strong>${escapeHtml(e.title)}</strong></td><td>${e.category}</td><td>${formatDate(e.date)}</td><td><span class="status-pill ${s==='past'?'s-rejected':s==='ongoing'?'s-active':'s-approved'}">${s}</span></td>
        <td>${attBadge}</td><td>${certBtn}</td>
        <td><div class="tbl-actions"><button class="btn btn-outline btn-sm" onclick="viewEvent('${e.id}')">View</button>${s!=='past'?`<button class="btn btn-outline btn-sm" onclick="unregister('${e.id}');renderStudentDash()">Cancel</button>`:''}</div></td></tr>`}).join('')}
      </tbody></table>`;
  }else{document.getElementById('myRegsTbl').innerHTML='<div class="empty-state"><span class="ico">🎟️</span><h4>No registrations yet</h4><p>Start exploring events to join!</p></div>'}
}


/* ============================ ORGANIZER DASH ============================ */
function renderOrganizerDash(){
  if(!CU)return;
  document.getElementById('orgName').textContent=CU.name;
  // Show/hide create org button
  const o=ownedOrg();
  const createBtn=document.getElementById('createOrgPageBtn');
  if(createBtn)createBtn.style.display=o?'none':'flex';
  const mine=DB.events.filter(e=>e.organizerId===CU.id);
  const totalRegs=mine.reduce((s,e)=>s+regCount(e.id),0);
  const mineIds=new Set(mine.map(e=>e.id));
  const myFbs=(DB.feedbacks||[]).filter(f=>mineIds.has(f.eventId));
  const totalRatings=myFbs.reduce((s,f)=>s+f.rating,0);
  const reviewCount=myFbs.length;
  const avgSat=reviewCount?totalRatings/reviewCount:0;
  const posReviews=myFbs.filter(f=>f.rating>=4).length;
  const posPercent=reviewCount?Math.round(posReviews/reviewCount*100):0;
  document.getElementById('os1').textContent=mine.length;
  document.getElementById('os2').textContent=totalRegs;
  if(reviewCount){
    document.getElementById('os3').textContent='⭐ '+avgSat.toFixed(1)+' / 5.0';
    document.getElementById('os3sub').textContent='(from '+reviewCount+' review'+(reviewCount===1?'':'s')+' · '+posPercent+'% positive)';
  }else{
    document.getElementById('os3').textContent='⭐ No reviews yet';
    document.getElementById('os3sub').textContent='';
  }
  document.getElementById('os4').textContent=mine.filter(e=>e.status==='pending').length;
  renderOrgEventsTbl();
}
function switchOrgTab(t,el){orgTab=t;document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));el.classList.add('active');renderOrgEventsTbl()}
function renderOrgEventsTbl(){
  let evts=DB.events.filter(e=>e.organizerId===CU.id);
  if(orgTab!=='all')evts=evts.filter(e=>e.status===orgTab);
  evts=evts.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  if(!evts.length){document.getElementById('orgEventsTbl').innerHTML='<div class="empty-state"><span class="ico">📅</span><h4>No events yet</h4><p>Click "Create New Event" to get started.</p></div>';return}
  document.getElementById('orgEventsTbl').innerHTML=`<table class="tbl"><thead><tr><th>Event</th><th>Date</th><th>Venue</th><th>Registrations</th><th>Status</th><th>Actions</th></tr></thead><tbody>
    ${evts.map(e=>`<tr><td><strong>${escapeHtml(e.title)}</strong><br><span style="font-size:12px;color:var(--text-muted)">${e.category}</span></td><td>${formatDate(e.date)}</td><td>${escapeHtml(e.venue)}</td><td>${regCount(e.id)} / ${e.capacity}</td><td><span class="status-pill s-${e.status}">${e.status}</span></td>
    <td><div class="tbl-actions">
      <button class="btn btn-outline btn-sm" onclick="viewEvent('${e.id}')">View</button>
      <button class="btn btn-outline btn-sm" onclick="editEvent('${e.id}')">Edit</button>
      <button class="btn btn-outline btn-sm" onclick="viewEventFeedback('${e.id}')">⭐ Feedback (${eventFeedbacks(e.id).length})</button>
      <button class="btn btn-primary btn-sm" onclick="openViewStudents('${e.id}')">👥 View Students</button>
      <button class="btn btn-danger btn-sm" onclick="deleteEvent('${e.id}')">Delete</button>
    </div></td></tr>`).join('')}
    </tbody></table>`;
}
function openCreateEvent(){editingEventId=null;pendingEventPhoto=null;document.getElementById('evModalTitle').textContent='Create New Event';document.getElementById('evSubmitBtn').textContent='Create Event';
  ['evTitle','evDesc','evVenue','evDate','evTime'].forEach(i=>document.getElementById(i).value='');document.getElementById('evCap').value=100;
  clearEventImage();
  document.getElementById('eventModal').classList.add('open');
}
function editEvent(eid){
  const e=DB.events.find(x=>x.id===eid);if(!e)return;editingEventId=eid;
  document.getElementById('evModalTitle').textContent='Edit Event';document.getElementById('evSubmitBtn').textContent='Save Changes';
  document.getElementById('evTitle').value=e.title;document.getElementById('evDesc').value=e.desc;document.getElementById('evCat').value=e.category;
  document.getElementById('evCap').value=e.capacity;document.getElementById('evDate').value=e.date;document.getElementById('evTime').value=e.time;document.getElementById('evVenue').value=e.venue;
  pendingEventPhoto=e.photo||null;
  if(pendingEventPhoto){document.getElementById('evImagePreviewImg').src=pendingEventPhoto;document.getElementById('evImagePreview').style.display='block'}
  else{clearEventImage()}
  document.getElementById('eventModal').classList.add('open');
}
function submitEventForm(){
  const title=document.getElementById('evTitle').value.trim();
  const desc=document.getElementById('evDesc').value.trim();
  const cat=document.getElementById('evCat').value;
  const cap=parseInt(document.getElementById('evCap').value);
  const date=document.getElementById('evDate').value;
  const time=document.getElementById('evTime').value;
  const venue=document.getElementById('evVenue').value.trim();
  if(!title||!desc||!date||!time||!venue)return toast('Please fill all fields','error');
  if(cap<1)return toast('Capacity must be at least 1','error');
  const today=new Date().toISOString().slice(0,10);
  if(date<today)return toast('Event date cannot be in the past','error');
  if(editingEventId){
    const e=DB.events.find(x=>x.id===editingEventId);
    Object.assign(e,{title,desc,category:cat,capacity:cap,date,time,venue,status:'pending',photo:pendingEventPhoto||null});
    toast('Event updated and resubmitted for approval');
  }else{
    DB.events.push({id:uid('e'),title,desc,category:cat,capacity:cap,date,time,venue,organizerId:CU.id,status:'pending',icon:'🎉',photo:pendingEventPhoto||null,featured:false});
    toast('Event submitted for admin approval!');
  }
  saveDB();closeModal('eventModal');refreshAll();
}
function deleteEvent(eid){
  if(!confirm('Delete this event? All registrations will be removed.'))return;
  DB.events=DB.events.filter(e=>e.id!==eid);DB.regs=DB.regs.filter(r=>r.eventId!==eid);saveDB();toast('Event deleted');refreshAll();
}
/* ============================ VIEW STUDENTS ============================ */
let vsCurrentEventId=null;
let certPendingUserId=null;
let certPendingEventId=null;
let pendingCertFile=null;

function openViewStudents(eid){
  vsCurrentEventId=eid;
  renderViewStudents();
  document.getElementById('viewStudentsModal').classList.add('open');
}

function renderViewStudents(){
  const eid=vsCurrentEventId;
  const e=DB.events.find(x=>x.id===eid);if(!e)return;
  if(!DB.attendance)DB.attendance={};
  if(!DB.certificates)DB.certificates={};
  document.getElementById('vsModalTitle').textContent='👥 Participants — '+escapeHtml(e.title);
  const regs=DB.regs.filter(r=>r.eventId===eid);
  if(!regs.length){
    document.getElementById('vsModalBody').innerHTML='<div class="empty-state"><span class="ico">🎟️</span><h4>No registrations yet</h4><p>Students who register for this event will appear here.</p></div>';
    return;
  }
  const isPast=eventStatus(e)==='past';
  const rows=regs.map(r=>{
    const u=DB.users.find(x=>x.id===r.userId);if(!u)return'';
    const attKey=eid+'_'+u.id;
    const attended=DB.attendance[attKey];
    const cert=DB.certificates[attKey];
    let attBtns='';
    if(isPast||true){// allow marking attendance any time
      attBtns=`<button class="btn btn-sm ${attended===true?'btn-primary':'btn-outline'}" onclick="markAttendance('${eid}','${u.id}',true)" title="Attended" style="${attended===true?'':'opacity:.7'}">✅ Attended</button>
               <button class="btn btn-sm ${attended===false?'btn-danger':'btn-outline'}" onclick="markAttendance('${eid}','${u.id}',false)" title="Absent" style="${attended===false?'':'opacity:.7'}">❌ Absent</button>`;
    }
    let certBadge='';
    if(cert){
      if(cert.type==='text')certBadge=`<span style="background:var(--csu-green-soft);color:var(--csu-green-dark);border-radius:6px;padding:3px 8px;font-size:11px;font-weight:700">📜 Text Cert</span>`;
      else certBadge=`<span style="background:var(--csu-green-soft);color:var(--csu-green-dark);border-radius:6px;padding:3px 8px;font-size:11px;font-weight:700">📎 File Cert</span>`;
    }
    const certBtn=`<button class="btn btn-outline btn-sm" onclick="openCertUpload('${eid}','${u.id}')" title="Upload/Edit Certificate">📜 ${cert?'Edit':'Add'} Cert</button>`;
    return `<tr>
      <td><strong>${escapeHtml(u.name)}</strong><br><span style="font-size:12px;color:var(--text-muted)">${escapeHtml(u.sid)} · ${escapeHtml(u.dept)}</span></td>
      <td>${escapeHtml(u.email)}</td>
      <td><div style="display:flex;gap:6px;flex-wrap:wrap">${attBtns}</div></td>
      <td><div style="display:flex;align-items:center;gap:6px">${certBadge}${certBtn}</div></td>
    </tr>`;
  }).join('');
  document.getElementById('vsModalBody').innerHTML=`
    <div style="margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div style="font-size:13px;color:var(--text-muted)">${regs.length} participant${regs.length===1?'':'s'} registered</div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-outline btn-sm" onclick="markAllAttendance('${eid}',true)">✅ Mark All Attended</button>
        <button class="btn btn-outline btn-sm" onclick="markAllAttendance('${eid}',false)">❌ Mark All Absent</button>
      </div>
    </div>
    <div style="overflow-x:auto">
    <table class="tbl"><thead><tr><th>Student</th><th>Email</th><th>Attendance</th><th>Certificate</th></tr></thead><tbody>${rows}</tbody></table>
    </div>`;
}

function markAttendance(eid,uid,val){
  if(!DB.attendance)DB.attendance={};
  const key=eid+'_'+uid;
  DB.attendance[key]=val;
  saveDB();
  // Update student dash certificate count and attended count via refreshAll after closing
  refreshAll();
  renderViewStudents();
  toast(val?'Marked as attended':'Marked as absent');
}

function markAllAttendance(eid,val){
  if(!DB.attendance)DB.attendance={};
  const regs=DB.regs.filter(r=>r.eventId===eid);
  regs.forEach(r=>{DB.attendance[eid+'_'+r.userId]=val});
  saveDB();refreshAll();renderViewStudents();
  toast(val?'All marked as attended':'All marked as absent');
}

/* ============================ CERTIFICATE UPLOAD ============================ */
function openCertUpload(eid,userId){
  certPendingEventId=eid;certPendingUserId=userId;pendingCertFile=null;
  const e=DB.events.find(x=>x.id===eid);
  const u=DB.users.find(x=>x.id===userId);
  if(!DB.certificates)DB.certificates={};
  const existingCert=DB.certificates[eid+'_'+userId];
  document.getElementById('certUploadTarget').textContent='For: '+(u?u.name:'Student')+' · '+(e?e.title:'Event');
  document.getElementById('certFileInput').value='';
  document.getElementById('certFilePreview').style.display='none';
  document.getElementById('certTextInput').value=existingCert&&existingCert.type==='text'?existingCert.content:'';
  document.getElementById('certType').value=existingCert?existingCert.type==='text'?'text':'file':'file';
  toggleCertType();
  document.getElementById('certUploadModal').classList.add('open');
}

function toggleCertType(){
  const t=document.getElementById('certType').value;
  document.getElementById('certFileSection').style.display=t==='file'?'block':'none';
  document.getElementById('certTextSection').style.display=t==='text'?'block':'none';
}

function handleCertFile(ev){
  const f=ev.target.files&&ev.target.files[0];if(!f)return;
  if(f.size>5*1024*1024)return toast('File too large (max 5MB)','error');
  const r=new FileReader();
  r.onload=e=>{
    pendingCertFile={name:f.name,data:e.target.result,mimeType:f.type};
    const prev=document.getElementById('certFilePreview');
    prev.textContent='📎 '+f.name;prev.style.display='block';
  };
  r.readAsDataURL(f);
}

function saveCertificate(){
  if(!DB.certificates)DB.certificates={};
  const t=document.getElementById('certType').value;
  const key=certPendingEventId+'_'+certPendingUserId;
  if(t==='file'){
    if(!pendingCertFile)return toast('Please select a file','error');
    DB.certificates[key]={type:'file',name:pendingCertFile.name,data:pendingCertFile.data,mimeType:pendingCertFile.mimeType};
  }else{
    const txt=document.getElementById('certTextInput').value.trim();
    if(!txt)return toast('Please enter certificate text','error');
    DB.certificates[key]={type:'text',content:txt};
  }
  saveDB();closeModal('certUploadModal');
  toast('Certificate saved!');
  refreshAll();renderViewStudents();
}

/* ============================ STUDENT DASH CERT/ATTENDANCE UPDATE ============================ */
function showTextCert(eid,userId){
  if(!DB.certificates)return;
  const cert=DB.certificates[eid+'_'+userId];
  if(!cert||cert.type!=='text')return;
  const u=DB.users.find(x=>x.id===userId);
  const certText=cert.content.replace(/\[Student Name\]/g,u?u.name:'Student');
  const e=DB.events.find(x=>x.id===eid);
  const w=window.open('','_blank','width=600,height=500');
  w.document.write(`<!DOCTYPE html><html><head><title>Certificate</title><style>
    body{font-family:'Georgia',serif;padding:40px;background:#fffdf5;color:#1a2a1f;text-align:center}
    h1{color:#0a5d2a;font-size:28px;margin-bottom:10px}
    .border{border:6px double #f5c518;padding:40px;border-radius:12px;max-width:520px;margin:0 auto}
    p{font-size:16px;line-height:1.8;white-space:pre-wrap}
    .event{font-size:13px;color:#5b6b60;margin-top:20px}
  </style></head><body>
    <div class="border">
      <h1>🎓 Certificate</h1>
      <hr style="border:1px solid #f5c518;margin:16px 0">
      <p>${escapeHtml(certText).replace(/\n/g,'<br>')}</p>
      <div class="event" style="margin-top:24px;font-size:12px;color:#7d8b80">Issued for: ${e?escapeHtml(e.title):''}</div>
    </div>
  </body></html>`);
  w.document.close();
}

/* ============================ ADMIN DASH ============================ */
function renderAdminDash(){
  document.getElementById('as1').textContent=DB.events.length;
  document.getElementById('as2').textContent=DB.events.filter(e=>e.status==='pending').length;
  document.getElementById('as3').textContent=DB.users.length;
  document.getElementById('as4').textContent=(DB.organizations||[]).length;
  renderAdminTab();
}
function switchAdminTab(t,el){adminTab=t;document.querySelectorAll('#page-admin .tabs .tab').forEach(x=>x.classList.remove('active'));el.classList.add('active');renderAdminTab()}
function renderAdminTab(){
  const c=document.getElementById('adminTabContent');
  if(adminTab==='pending'||adminTab==='all'){
    let evts=adminTab==='pending'
      ?DB.events.filter(e=>e.status==='pending')
      :DB.events.filter(e=>e.status==='approved'||e.status==='rejected');
    evts=evts.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||''));
    if(!evts.length){c.innerHTML='<div class="empty-state"><span class="ico">✅</span><h4>Nothing here</h4><p>No events to display.</p></div>';return}
    c.innerHTML=`<table class="tbl"><thead><tr><th>Event</th><th>Organizer</th><th>Date</th><th>Status</th><th>Featured</th><th>Actions</th></tr></thead><tbody>
      ${evts.map(e=>{const o=DB.users.find(u=>u.id===e.organizerId);return `<tr><td><strong>${escapeHtml(e.title)}</strong><br><span style="font-size:12px;color:var(--text-muted)">${e.category} · ${e.venue}</span></td><td>${escapeHtml(o?o.name:'—')}</td><td>${formatDate(e.date)}</td><td><span class="status-pill s-${e.status}">${e.status}</span></td>
      <td>${e.featured?'<span style="color:var(--csu-gold-dark);font-weight:700">⭐ Yes</span>':'<span style="color:var(--text-muted)">No</span>'}</td>
      <td><div class="tbl-actions"><button class="btn btn-outline btn-sm" onclick="viewEvent('${e.id}')">View</button>
        <button class="btn btn-outline btn-sm" onclick="toggleFeatured('${e.id}')">${e.featured?'Unfeature':'⭐ Feature'}</button>
        ${e.status==='pending'?`<button class="btn btn-primary btn-sm" onclick="adminApprove('${e.id}')">Approve</button><button class="btn btn-danger btn-sm" onclick="adminReject('${e.id}')">Reject</button>`:''}
        <button class="btn btn-danger btn-sm" onclick="deleteEvent('${e.id}')">Delete</button>
      </div></td></tr>`}).join('')}
      </tbody></table>`;
  }else if(adminTab==='users'){
    c.innerHTML=`<table class="tbl"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Actions</th></tr></thead><tbody>
      ${DB.users.map(u=>{
        if(u.role==='admin')return `<tr><td><strong>${escapeHtml(u.name)}</strong><br><span style="font-size:12px;color:var(--text-muted)">${u.sid}</span></td><td>${escapeHtml(u.email)}</td><td><span class="role-badge admin">admin</span></td><td>${escapeHtml(u.dept)}</td><td><em style="color:var(--text-muted)">protected</em></td></tr>`;
        const promoteBtn=u.role==='student'
          ?`<button class="btn btn-primary btn-sm" onclick="setUserRole('${u.id}','organizer')">🛡️ Make Organizer</button>`
          :`<button class="btn btn-outline btn-sm" onclick="setUserRole('${u.id}','student')">↩ Demote to Student</button>`;
        return `<tr><td><strong>${escapeHtml(u.name)}</strong><br><span style="font-size:12px;color:var(--text-muted)">${u.sid}</span></td><td>${escapeHtml(u.email)}</td><td><span class="role-badge ${u.role}">${u.role}</span></td><td>${escapeHtml(u.dept)}</td>
        <td><div class="tbl-actions">${promoteBtn}<button class="btn btn-danger btn-sm" onclick="deleteUser('${u.id}')">Remove</button></div></td></tr>`;
      }).join('')}
      </tbody></table>`;
  }else if(adminTab==='regs'){
    const approvedEvts=DB.events.filter(e=>e.status==='approved');
    if(!approvedEvts.length){c.innerHTML='<div class="empty-state"><span class="ico">📊</span><h4>No approved events</h4><p>Only approved events appear in the registrations report.</p></div>';return}
    const rows=approvedEvts.map(e=>{const cnt=regCount(e.id);const pct=Math.round(cnt/e.capacity*100);return {e,cnt,pct}});
    c.innerHTML=`<table class="tbl"><thead><tr><th>Event</th><th>Date</th><th>Registered</th><th>Capacity</th><th>Fill Rate</th><th>Action</th></tr></thead><tbody>
      ${rows.map(({e,cnt,pct})=>`<tr><td><strong>${escapeHtml(e.title)}</strong><br><span style="font-size:12px;color:var(--text-muted)">${e.category}</span></td><td>${formatDate(e.date)}</td><td>${cnt}</td><td>${e.capacity}</td>
      <td><div style="display:flex;align-items:center;gap:10px"><span style="font-weight:700;min-width:42px">${pct}%</span><div class="event-progress" style="flex:1;min-width:80px"><div class="event-progress-bar" style="width:${Math.min(100,pct)}%"></div></div></div></td>
      <td><button class="btn btn-outline btn-sm" onclick="viewRegistrants('${e.id}')">View Students</button></td></tr>`).join('')}
      </tbody></table>
      <div id="regDetailWrap" style="margin-top:24px"></div>`;
  }else if(adminTab==='orgs'){
    renderAdminOrgsTab();return;
  }else if(adminTab==='feedback'){
    const approvedEvts=DB.events.filter(e=>e.status==='approved');
    if(!approvedEvts.length){c.innerHTML='<div class="empty-state"><span class="ico">⭐</span><h4>No approved events</h4><p>Only approved events appear in the feedback report.</p></div>';return}
    const rows=approvedEvts.map(e=>({e,fbs:eventFeedbacks(e.id),avg:avgRating(e.id)})).sort((a,b)=>b.fbs.length-a.fbs.length);
    c.innerHTML=`<table class="tbl"><thead><tr><th>Event</th><th>Date</th><th>Avg Rating</th><th>Responses</th><th>Action</th></tr></thead><tbody>
      ${rows.map(({e,fbs,avg})=>`<tr><td><strong>${escapeHtml(e.title)}</strong><br><span style="font-size:12px;color:var(--text-muted)">${e.category}</span></td><td>${formatDate(e.date)}</td>
      <td>${fbs.length?`${starsHtml(avg,13)} <strong>${avg.toFixed(1)}</strong>`:'<span style="color:var(--text-muted)">—</span>'}</td>
      <td>${fbs.length}</td>
      <td><button class="btn btn-outline btn-sm" onclick="viewEventFeedback('${e.id}')">View Feedback</button></td></tr>`).join('')}
      </tbody></table>`;
  }
}
function viewRegistrants(eid){
  const e=DB.events.find(x=>x.id===eid);if(!e)return;
  const regs=DB.regs.filter(r=>r.eventId===eid).map(r=>DB.users.find(u=>u.id===r.userId)).filter(Boolean);
  const w=document.getElementById('regDetailWrap');
  if(!regs.length){w.innerHTML=`<div class="panel"><div class="panel-head"><div class="panel-title">Registrants — ${escapeHtml(e.title)}</div></div><div class="panel-body"><div class="empty-state"><span class="ico">🎟️</span><h4>No registrations yet</h4></div></div></div>`;return}
  w.innerHTML=`<div class="panel"><div class="panel-head"><div class="panel-title">Registrants — ${escapeHtml(e.title)} (${regs.length})</div></div><div class="panel-body tight">
    <table class="tbl"><thead><tr><th>Name</th><th>Email</th><th>Student ID</th><th>Department</th></tr></thead><tbody>
    ${regs.map(u=>`<tr><td><strong>${escapeHtml(u.name)}</strong></td><td>${escapeHtml(u.email)}</td><td>${escapeHtml(u.sid)}</td><td>${escapeHtml(u.dept)}</td></tr>`).join('')}
    </tbody></table></div></div>`;
  w.scrollIntoView({behavior:'smooth',block:'start'});
}
function toggleFeatured(eid){const e=DB.events.find(x=>x.id===eid);if(!e)return;e.featured=!e.featured;saveDB();toast(e.featured?'Marked as featured':'Removed from featured');refreshAll()}
function setUserRole(uid,role){const u=DB.users.find(x=>x.id===uid);if(!u||u.role==='admin')return;u.role=role;saveDB();toast(role==='organizer'?`${u.name} promoted to organizer`:`${u.name} demoted to student`);renderAdminTab()}
function adminApprove(eid){const e=DB.events.find(x=>x.id===eid);if(e){e.status='approved';saveDB();toast('Event approved');refreshAll()}}
function adminReject(eid){const e=DB.events.find(x=>x.id===eid);if(e){e.status='rejected';saveDB();toast('Event rejected','warning');refreshAll()}}
function deleteUser(uid){if(!confirm('Remove this user? Their registrations will be deleted.'))return;DB.users=DB.users.filter(u=>u.id!==uid);DB.regs=DB.regs.filter(r=>r.userId!==uid);saveDB();toast('User removed');refreshAll()}
function openAnnouncement(){document.getElementById('annInput').value='';document.getElementById('annModal').classList.add('open')}
function submitAnnouncement(){
  const v=document.getElementById('annInput').value.trim();if(!v)return toast('Please enter a message','error');
  document.getElementById('annText').textContent=v;document.getElementById('annBar').classList.remove('hidden');
  DB.announcements.unshift({id:uid('a'),text:v,date:new Date().toISOString()});saveDB();
  closeModal('annModal');toast('Announcement published');
}


/* ============================ EVENT IMAGE UPLOAD ============================ */
let pendingEventPhoto=null;
function handleEventImage(ev){
  const f=ev.target.files&&ev.target.files[0];if(!f)return;
  if(f.size>2*1024*1024)return toast('Image too large (max 2MB)','error');
  const r=new FileReader();
  r.onload=e=>{pendingEventPhoto=e.target.result;document.getElementById('evImagePreviewImg').src=pendingEventPhoto;document.getElementById('evImagePreview').style.display='block'};
  r.readAsDataURL(f);
}
function clearEventImage(){pendingEventPhoto=null;const el=document.getElementById('evImage');if(el)el.value='';const p=document.getElementById('evImagePreview');if(p)p.style.display='none'}

/* ============================ SEARCH ============================ */
function globalSearch(q){
  const drop=document.getElementById('searchDrop');q=(q||'').toLowerCase().trim();
  if(!q){drop.classList.remove('show');return}
  const evts=DB.events.filter(e=>e.status==='approved'&&(e.title.toLowerCase().includes(q)||e.desc.toLowerCase().includes(q)||e.category.toLowerCase().includes(q))).slice(0,4);
  const orgs=CU?(DB.organizations||[]).filter(o=>o.name.toLowerCase().includes(q)||(o.description||'').toLowerCase().includes(q)||(o.category||'').toLowerCase().includes(q)).slice(0,3):[];
  const results=[
    ...evts.map(e=>({type:'event',id:e.id,icon:e.icon||'🎉',title:e.title,meta:e.category+' · '+formatDate(e.date)})),
    ...orgs.map(o=>({type:'org',id:o.id,icon:(o.logo&&!o.logo.startsWith('data:'))?o.logo:'🏢',title:o.name,meta:'Organization · '+orgFollowerCount(o.id)+' followers'}))
  ];
  if(!results.length){drop.innerHTML='<div class="search-result-item"><div class="search-result-info"><div class="search-result-meta">No results found</div></div></div>';drop.classList.add('show');return}
  drop.innerHTML=results.map(r=>`<div class="search-result-item" onclick="${r.type==='event'?`viewEvent('${r.id}')`:(`openOrgProfile('${r.id}');`)}document.getElementById('globalSearchInput').value='';document.getElementById('searchDrop').classList.remove('show')">
    <div class="search-result-thumb">${r.icon}</div>
    <div class="search-result-info">
      <div class="search-result-title">${escapeHtml(r.title)}</div>
      <div class="search-result-meta">${r.meta}</div>
    </div>
    <span style="font-size:10px;padding:2px 6px;border-radius:4px;font-weight:700;text-transform:uppercase;background:${r.type==='event'?'var(--csu-green-soft)':'var(--csu-gold-soft)'};color:${r.type==='event'?'var(--csu-green-dark)':'var(--csu-gold-dark)'}">${r.type==='event'?'Event':'Org'}</span>
  </div>`).join('');
  drop.classList.add('show');
}

function refreshAll(){
  if(document.getElementById('page-home').classList.contains('active'))renderHome();
  if(document.getElementById('page-dashboard').classList.contains('active'))renderStudentDash();
  if(document.getElementById('page-organizer').classList.contains('active'))renderOrganizerDash();
  if(document.getElementById('page-admin').classList.contains('active'))renderAdminDash();
  if(document.getElementById('page-orgs').classList.contains('active'))renderOrgsPage();
  if(document.getElementById('page-orgprofile').classList.contains('active'))renderOrgProfile();
}

/* ============================ ORGANIZATIONS ============================ */
function orgPostCount(oid){return (DB.organizationPosts||[]).filter(p=>p.organizationId===oid).length}
function orgFollowerCount(oid){return (DB.organizationFollows||[]).filter(f=>f.organizationId===oid).length}
function isFollowing(oid){return CU&&(DB.organizationFollows||[]).some(f=>f.userId===CU.id&&f.organizationId===oid)}
function getOrgById(oid){return (DB.organizations||[]).find(o=>o.id===oid)}
function ownedOrg(){return CU?(DB.organizations||[]).find(o=>o.organizerId===CU.id):null}
function orgLogoHtml(o,size=56){
  const s=`width:${size}px;height:${size}px;border-radius:14px;background:var(--csu-green-soft);display:flex;align-items:center;justify-content:center;font-size:${Math.floor(size*0.55)}px;overflow:hidden;border:2px solid #fff;box-shadow:var(--shadow-sm);flex-shrink:0`;
  if(o.logo&&o.logo.startsWith('data:'))return `<div style="${s}"><img src="${o.logo}" style="width:100%;height:100%;object-fit:cover"></div>`;
  return `<div style="${s}">${escapeHtml(o.logo||'🏢')}</div>`;
}
function orgCoverStyle(o){
  if(o.coverPhoto)return `background:linear-gradient(rgba(6,61,28,.45),rgba(6,61,28,.65)),url('${o.coverPhoto}') center/cover`;
  return `background:var(--grad-hero)`;
}

/* ----- Student/public Orgs browse ----- */

function openOrgProfile(oid){viewingOrgId=oid;showPage('orgprofile')}
function renderOrgProfile(){
  const o=getOrgById(viewingOrgId);
  const body=document.getElementById('orgProfileBody');
  if(!o){body.innerHTML='<div class="container" style="padding:60px 0"><div class="empty-state"><span class="ico">🏢</span><h4>Organization not found</h4><button class="btn btn-primary" onclick="showPage(\'orgs\')">← Back</button></div></div>';return}
  const owner=DB.users.find(u=>u.id===o.organizerId);
  const posts=(DB.organizationPosts||[]).filter(p=>p.organizationId===o.id).sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  const photos=posts.filter(p=>p.type==='photo'&&p.mediaUrl);
  const isOwner=CU&&CU.id===o.organizerId;
  const following=isFollowing(o.id);
  body.innerHTML=`
    <div style="height:280px;${orgCoverStyle(o)};display:flex;align-items:flex-end;padding:0">
      <div class="container" style="padding-bottom:28px;color:#fff">
        <button class="btn btn-outline" style="background:rgba(255,255,255,.95);color:var(--text);margin-bottom:16px" onclick="showPage('orgs')">← All Organizations</button>
      </div>
    </div>
    <div class="container" style="padding-top:0;margin-top:-50px;position:relative">
      <div class="panel">
        <div class="panel-body" style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap">
          ${orgLogoHtml(o,96)}
          <div style="flex:1;min-width:240px">
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
              <h2 class="serif" style="font-size:28px">${escapeHtml(o.name)}</h2>
              <span class="role-badge organizer">${escapeHtml(o.category||'General')}</span>
            </div>
            <p style="color:var(--text-muted);margin-top:8px;max-width:680px">${escapeHtml(o.description||'')}</p>
            <div style="display:flex;gap:16px;margin-top:12px;font-size:13px;color:var(--text-soft);font-weight:600">
              <span>👥 ${orgFollowerCount(o.id)} followers</span>
              <span>📝 ${posts.length} posts</span>
              ${owner?`<span>🛡️ Managed by ${escapeHtml(owner.name)}</span>`:''}
            </div>
          </div>
          <div style="display:flex;gap:8px">
            ${isOwner?`<button class="btn btn-outline" onclick="showPage('organizer');setTimeout(()=>switchOrgMainTab('myorg',document.querySelectorAll('#orgDashTabs .tab')[1]),100)">⚙️ Manage Page</button>`:''}
            ${!isOwner&&CU?`<button class="btn ${following?'btn-outline':'btn-primary'}" onclick="toggleFollow('${o.id}')">${following?'✓ Following':'+ Follow'}</button>`:''}
            ${!CU?`<button class="btn btn-primary" onclick="openLogin('login')">Sign in to follow</button>`:''}
          </div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:24px;margin-top:24px" id="orgProfileGrid">
        <div>
          <div class="panel"><div class="panel-head"><div class="panel-title">Posts</div></div>
            <div class="panel-body">${posts.length?posts.map(p=>renderPostHtml(p,isOwner)).join(''):'<div class="empty-state"><span class="ico">📝</span><h4>No posts yet</h4><p>This organization has no posts yet.</p></div>'}</div>
          </div>
        </div>
        <div>
          <div class="panel"><div class="panel-head"><div class="panel-title">Photo Gallery</div></div>
            <div class="panel-body">${photos.length?`<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px">${photos.map(p=>`<img src="${p.mediaUrl}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;cursor:pointer" onclick="window.open('${p.mediaUrl}','_blank')">`).join('')}</div>`:'<p style="color:var(--text-muted);font-size:13px">No photos uploaded yet.</p>'}</div>
          </div>
          ${o.socialLinks&&(o.socialLinks.facebook||o.socialLinks.instagram)?`<div class="panel" style="margin-top:18px"><div class="panel-head"><div class="panel-title">Social</div></div><div class="panel-body" style="display:flex;flex-direction:column;gap:8px;font-size:14px">
            ${o.socialLinks.facebook?`<a href="${o.socialLinks.facebook}" target="_blank" style="color:var(--csu-green-dark);font-weight:600">📘 Facebook</a>`:''}
            ${o.socialLinks.instagram?`<a href="${o.socialLinks.instagram}" target="_blank" style="color:var(--csu-green-dark);font-weight:600">📸 Instagram</a>`:''}
          </div></div>`:''}
        </div>
      </div>
    </div>
    <style>@media(max-width:780px){#orgProfileGrid{grid-template-columns:1fr!important}}</style>
  `;
}
function timeAgo(dateString){
  if(!dateString)return '';
  const diff=Date.now()-new Date(dateString).getTime();
  const m=Math.floor(diff/60000);
  if(m<1)return 'just now';
  if(m<60)return m+'m ago';
  const h=Math.floor(m/60);
  if(h<24)return h+'h ago';
  const d=Math.floor(h/24);
  if(d<7)return d+'d ago';
  return formatDate(dateString.slice(0,10));
}

/* ----- See more/less toggle ----- */
function toggleSeeMore(pid){
  const p=DB.organizationPosts.find(x=>x.id===pid);if(!p)return;
  p._expanded=!p._expanded;
  const el=document.getElementById('post_text_'+pid);
  const btn=document.getElementById('post_seemore_'+pid);
  if(!el||!btn)return;
  if(p._expanded){
    el.textContent=p.content;
    btn.textContent=' See less';
  }else{
    el.textContent=p.content.slice(0,100)+'…';
    btn.textContent=' See more';
  }
}

/* ----- FB Post HTML renderer ----- */
function renderFbPostHtml(p,isOwner){
  const o=getOrgById(p.organizationId);
  const liked=CU&&(p.likedBy||[]).includes(CU.id);
  const comments=p.comments||[];
  const showAll=p._showAllComments||false;
  const displayComments=showAll?comments:comments.slice(-3);
  // Media
  let media='';
  const urls=Array.isArray(p.mediaUrls)&&p.mediaUrls.length?p.mediaUrls:(p.type==='photo'&&p.mediaUrl?[p.mediaUrl]:[]);
  const urlsJson=JSON.stringify(urls);
  if(urls.length===1){
    media=`<div class="fb-post-media"><img src="${urls[0]}" style="width:100%;max-height:520px;object-fit:cover;display:block;cursor:pointer" onclick="openLightbox(${urlsJson},0)"></div>`;
  }else if(urls.length===2){
    media=`<div class="fb-post-media"><div style="display:grid;grid-template-columns:1fr 1fr;gap:3px">${urls.map((u,i)=>`<img src="${u}" style="width:100%;aspect-ratio:1;object-fit:cover;cursor:pointer" onclick="openLightbox(${urlsJson},${i})">`).join('')}</div></div>`;
  }else if(urls.length===3){
    media=`<div class="fb-post-media"><div style="display:grid;grid-template-columns:1fr 1fr;gap:3px"><img src="${urls[0]}" style="width:100%;object-fit:cover;cursor:pointer;grid-row:span 2;min-height:200px" onclick="openLightbox(${urlsJson},0)"><img src="${urls[1]}" style="width:100%;aspect-ratio:1;object-fit:cover;cursor:pointer" onclick="openLightbox(${urlsJson},1)"><img src="${urls[2]}" style="width:100%;aspect-ratio:1;object-fit:cover;cursor:pointer" onclick="openLightbox(${urlsJson},2)"></div></div>`;
  }else if(urls.length>=4){
    const extra=urls.length>4;
    media=`<div class="fb-post-media"><div style="display:grid;grid-template-columns:1fr 1fr;gap:3px">
      <img src="${urls[0]}" style="width:100%;max-height:260px;object-fit:cover;cursor:pointer;grid-column:span 2" onclick="openLightbox(${urlsJson},0)">
      <img src="${urls[1]}" style="width:100%;aspect-ratio:1;object-fit:cover;cursor:pointer" onclick="openLightbox(${urlsJson},1)">
      ${extra?`<div style="position:relative;cursor:pointer" onclick="openLightbox(${urlsJson},2)"><img src="${urls[2]}" style="width:100%;aspect-ratio:1;object-fit:cover;filter:brightness(.45)"><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;font-weight:700">+${urls.length-3}</div></div>`:`<img src="${urls[2]}" style="width:100%;aspect-ratio:1;object-fit:cover;cursor:pointer" onclick="openLightbox(${urlsJson},2)">`}
    </div></div>`;
  }else if(p.type==='video'&&p.mediaUrl){
    const yt=getYoutubeId(p.mediaUrl);
    media=yt?`<div class="fb-post-media"><div style="position:relative;padding-top:56.25%"><iframe src="https://www.youtube.com/embed/${yt}" style="position:absolute;inset:0;width:100%;height:100%;border:0" allowfullscreen></iframe></div></div>`
          :`<div class="fb-post-media"><video src="${p.mediaUrl}" controls style="width:100%;max-height:480px;display:block"></video></div>`;
  }
  const avatarHtml=o?(o.logo&&o.logo.startsWith('data:')?`<div class="fb-post-org-avatar"><img src="${o.logo}"></div>`:`<div class="fb-post-org-avatar">${escapeHtml(o.logo||'🏢')}</div>`):'<div class="fb-post-org-avatar">🏢</div>';
  const commentsHtml=displayComments.map(c=>{
    const canDel=isOwner||(CU&&CU.id===c.userId);
    return `<div class="fb-comment-item">
      <div class="fb-comment-avatar">${(c.userName||'?').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase()}</div>
      <div class="fb-comment-bubble">
        <div class="fb-comment-author">${escapeHtml(c.userName||'User')}</div>
        <div class="fb-comment-text">${escapeHtml(c.text)}</div>
        <div class="fb-comment-meta">${timeAgo(c.createdAt)}${canDel?` · <span style="color:var(--danger);cursor:pointer;font-weight:600" onclick="deleteComment('${p.id}','${c.id}')">Delete</span>`:''}</div>
      </div>
    </div>`;
  }).join('');
  const commentInput=CU?`<div class="fb-comment-input-row">
    <div class="fb-comment-avatar">${CU.name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase()}</div>
    <input id="ci_${p.id}" class="fb-comment-input" placeholder="Write a comment…" onkeydown="if(event.key==='Enter')addComment('${p.id}')">
    <button class="btn btn-primary btn-sm" onclick="addComment('${p.id}')">Post</button>
  </div>`:'';
  const likeCount=p.likes||0;const commentCount=comments.length;
  // See more/less for post text
  const MAX_LEN=100;
  const needsTruncate=p.content&&p.content.length>MAX_LEN;
  const isExpanded=p._expanded||false;
  let postTextHtml='';
  if(p.content){
    const displayText=needsTruncate&&!isExpanded?p.content.slice(0,MAX_LEN)+'…':p.content;
    postTextHtml=`<div class="fb-post-text"><span id="post_text_${p.id}">${escapeHtml(displayText)}</span>${needsTruncate?`<span id="post_seemore_${p.id}" onclick="toggleSeeMore('${p.id}')" style="color:var(--csu-green-dark);font-weight:600;cursor:pointer;font-size:13px;white-space:nowrap"> ${isExpanded?'See less':'See more'}</span>`:''}</div>`;
  }
  // Owner action buttons (edit + delete)
  const ownerBtns=isOwner?`<div style="display:flex;gap:6px;flex-shrink:0">
    <button class="btn btn-outline btn-sm" onclick="openEditPost('${p.id}')" style="padding:5px 10px;font-size:12px">✏️ Edit</button>
    <button class="btn btn-danger btn-sm" onclick="deleteOrgPost('${p.id}')" style="padding:5px 10px;font-size:12px">🗑️</button>
  </div>`:'';
  // Edited badge
  const editedBadge=p.editedAt?` · <span style="font-size:11px;color:var(--text-soft);font-style:italic">Edited</span>`:'';
  return `<div class="fb-post" id="post_${p.id}">
    <div class="fb-post-header">
      ${avatarHtml}
      <div style="flex:1"><div class="fb-post-orgname">${escapeHtml(o?o.name:'Organization')}</div><div class="fb-post-time">${timeAgo(p.createdAt)}${editedBadge}</div></div>
      ${ownerBtns}
    </div>
    ${postTextHtml}
    ${media}
    ${(likeCount||commentCount)?`<div class="fb-post-reactions"><span class="fb-reaction-count">${likeCount?'❤️ '+likeCount:''}</span><span class="fb-reaction-count" style="cursor:pointer" onclick="toggleComments('${p.id}')">${commentCount?'💬 '+commentCount+' comment'+(commentCount===1?'':'s'):''}</span></div>`:''}
    <div class="fb-post-actions">
      <button class="fb-action-btn ${liked?'liked':''}" onclick="likePost('${p.id}')">${liked?'❤️':'🤍'} Like</button>
      <button class="fb-action-btn" onclick="toggleComments('${p.id}')">💬 Comment</button>
      <button class="fb-action-btn" onclick="sharePost('${p.id}')">↗ Share</button>
    </div>
    <div id="comments_${p.id}" style="display:none" class="fb-comments-wrap">
      ${comments.length>3&&!showAll?`<div style="font-size:13px;color:var(--csu-green-dark);font-weight:600;cursor:pointer;margin-bottom:8px" onclick="showAllComments('${p.id}')">View all ${comments.length} comments</div>`:''}
      ${commentsHtml}${commentInput}
    </div>
  </div>`;
}
function renderPostHtml(p,isOwner){return renderFbPostHtml(p,isOwner)}

function toggleComments(pid){const el=document.getElementById('comments_'+pid);if(el)el.style.display=el.style.display==='none'?'block':'none'}
function showAllComments(pid){const p=DB.organizationPosts.find(x=>x.id===pid);if(!p)return;p._showAllComments=true;refreshPost(pid)}
function refreshPost(pid){
  const p=DB.organizationPosts.find(x=>x.id===pid);if(!p)return;
  const el=document.getElementById('post_'+pid);if(!el)return;
  const isOwner=CU&&(()=>{const o=getOrgById(p.organizationId);return o&&o.organizerId===CU.id})();
  const newEl=document.createElement('div');newEl.innerHTML=renderFbPostHtml(p,isOwner);
  el.replaceWith(newEl.firstChild);
  const cd=document.getElementById('comments_'+pid);if(cd)cd.style.display='block';
}
function addComment(pid){
  if(!CU)return openLogin('login');
  const inp=document.getElementById('ci_'+pid);if(!inp)return;
  const text=inp.value.trim();if(!text)return;
  const p=DB.organizationPosts.find(x=>x.id===pid);if(!p)return;
  if(!p.comments)p.comments=[];
  p.comments.push({id:uid('c'),userId:CU.id,userName:CU.name,text,createdAt:new Date().toISOString()});
  saveDB();inp.value='';refreshPost(pid);
  const cd=document.getElementById('comments_'+pid);if(cd)cd.style.display='block';
}
function deleteComment(pid,cid){
  const p=DB.organizationPosts.find(x=>x.id===pid);if(!p||!p.comments)return;
  p.comments=p.comments.filter(c=>c.id!==cid);
  saveDB();refreshPost(pid);const cd=document.getElementById('comments_'+pid);if(cd)cd.style.display='block';
}
function sharePost(pid){
  const p=DB.organizationPosts.find(x=>x.id===pid);if(!p)return;
  const o=getOrgById(p.organizationId);
  const text=(o?o.name+': ':'')+p.content;
  if(navigator.share){navigator.share({title:o?o.name:'Post',text}).catch(()=>{})}
  else{navigator.clipboard.writeText(text).then(()=>toast('Copied to clipboard!'))}
}
let _lbUrls=[],_lbIdx=0;
function openLightbox(urls,idx){
  _lbUrls=urls;_lbIdx=idx;
  let lb=document.getElementById('photoLightbox');
  if(!lb){lb=document.createElement('div');lb.id='photoLightbox';lb.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column';
    lb.innerHTML=`<button onclick="document.getElementById('photoLightbox').remove()" style="position:absolute;top:20px;right:24px;font-size:36px;color:#fff;background:none;border:none;cursor:pointer;line-height:1">×</button>
      <img id="lbImg" style="max-width:92vw;max-height:82vh;object-fit:contain;border-radius:8px">
      <div style="display:flex;gap:24px;margin-top:18px">
        <button onclick="lbNav(-1)" style="color:#fff;font-size:28px;background:rgba(255,255,255,.15);border:none;cursor:pointer;padding:8px 18px;border-radius:8px">‹</button>
        <span id="lbCount" style="color:#fff;font-size:14px;align-self:center"></span>
        <button onclick="lbNav(1)" style="color:#fff;font-size:28px;background:rgba(255,255,255,.15);border:none;cursor:pointer;padding:8px 18px;border-radius:8px">›</button>
      </div>`;
    lb.addEventListener('click',e=>{if(e.target===lb)lb.remove()});document.body.appendChild(lb);
  }lbShow();
}
function lbShow(){const img=document.getElementById('lbImg');const cnt=document.getElementById('lbCount');if(img)img.src=_lbUrls[_lbIdx];if(cnt)cnt.textContent=`${_lbIdx+1} / ${_lbUrls.length}`}
function lbNav(dir){_lbIdx=(_lbIdx+dir+_lbUrls.length)%_lbUrls.length;lbShow()}
function getYoutubeId(url){const m=String(url||'').match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);return m?m[1]:null}

function toggleFollow(oid){
  if(!CU)return openLogin('login');
  if(CU.role!=='student')return toast('Only students can follow organizations','warning');
  const i=DB.organizationFollows.findIndex(f=>f.userId===CU.id&&f.organizationId===oid);
  if(i>=0){DB.organizationFollows.splice(i,1);toast('Unfollowed')}
  else{DB.organizationFollows.push({id:uid('f'),userId:CU.id,organizationId:oid,followedDate:new Date().toISOString()});toast('Following!')}
  saveDB();if(document.getElementById('page-orgprofile').classList.contains('active'))renderOrgProfile();else renderOrgsDiscover();
}
function likePost(pid){
  if(!CU)return openLogin('login');
  const p=DB.organizationPosts.find(x=>x.id===pid);if(!p)return;
  if(!p.likedBy)p.likedBy=[];
  const i=p.likedBy.indexOf(CU.id);
  if(i>=0){p.likedBy.splice(i,1);p.likes=Math.max(0,(p.likes||1)-1)}
  else{p.likedBy.push(CU.id);p.likes=(p.likes||0)+1}
  saveDB();refreshPost(pid);
}

/* ----- Orgs page tab switching ----- */
function setOrgsPageTab(t,el){
  orgsPageTab=t;
  document.querySelectorAll('#orgsBrowseTabs .tab').forEach(x=>x.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('orgsFeedPane').style.display=t==='feed'?'block':'none';
  document.getElementById('orgsDiscoverPane').style.display=t==='discover'?'block':'none';
  if(t==='feed')renderOrgsFeed();else renderOrgsDiscover();
}
function renderOrgsPage(){
  const isFeed=orgsPageTab==='feed';
  document.getElementById('orgsFeedPane').style.display=isFeed?'block':'none';
  document.getElementById('orgsDiscoverPane').style.display=isFeed?'none':'block';
  // sync tab active state
  document.querySelectorAll('#orgsBrowseTabs .tab').forEach((el,i)=>{
    el.classList.toggle('active',(i===0&&isFeed)||(i===1&&!isFeed));
  });
  if(isFeed)renderOrgsFeed();else renderOrgsDiscover();
}
function renderOrgsFeed(){
  const el=document.getElementById('orgsFeedContent');if(!el)return;
  if(!CU){el.innerHTML='<div class="empty-state"><span class="ico">🔒</span><h4>Sign in to see your feed</h4><p>Follow organizations to see their posts here.</p></div>';return}
  let followedIds;
  if(CU.role==='student'){
    followedIds=new Set((DB.organizationFollows||[]).filter(f=>f.userId===CU.id).map(f=>f.organizationId));
    if(!followedIds.size){
      el.innerHTML=`<div class="empty-state"><span class="ico">📰</span><h4>Your feed is empty</h4><p>Discover and follow organizations to see their posts here.</p>
        <button class="btn btn-primary" style="margin-top:14px" onclick="setOrgsPageTab('discover',document.querySelectorAll('#orgsBrowseTabs .tab')[1])">🔍 Discover Organizations</button></div>`;return;
    }
  }else{
    followedIds=new Set((DB.organizations||[]).map(o=>o.id));
  }
  let posts=(DB.organizationPosts||[]).filter(p=>followedIds.has(p.organizationId)).sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  if(!posts.length){el.innerHTML='<div class="empty-state"><span class="ico">📭</span><h4>No posts yet</h4><p>Organizations you follow haven\'t posted anything yet.</p></div>';return}
  const getIsOwner=p=>{const o=getOrgById(p.organizationId);return CU&&o&&o.organizerId===CU.id};
  el.innerHTML=posts.map(p=>renderFbPostHtml(p,getIsOwner(p))).join('');
}
function renderOrgsDiscover(){
  const grid=document.getElementById('orgsGrid');if(!grid)return;
  const q=(document.getElementById('orgSearchInput')?.value||'').toLowerCase().trim();
  let list=(DB.organizations||[]).slice();
  if(q)list=list.filter(o=>o.name.toLowerCase().includes(q)||(o.description||'').toLowerCase().includes(q));
  if(!list.length){grid.innerHTML='<div class="empty-state" style="grid-column:1/-1"><span class="ico">🏢</span><h4>No organizations found</h4></div>';return}
  grid.innerHTML=list.map(o=>{
    const following=isFollowing(o.id);
    const isOwn=CU&&CU.id===o.organizerId;
    return `<div class="panel" style="cursor:pointer;transition:transform .15s,box-shadow .15s" onmouseenter="this.style.transform='translateY(-3px)';this.style.boxShadow='var(--shadow-lg)'" onmouseleave="this.style.transform='';this.style.boxShadow=''">
      <div style="height:110px;border-radius:12px 12px 0 0;${orgCoverStyle(o)}" onclick="openOrgProfile('${o.id}')"></div>
      <div class="panel-body" style="padding-top:0">
        <div style="margin-top:-32px;margin-bottom:12px;display:flex;align-items:flex-end;justify-content:space-between">
          <div onclick="openOrgProfile('${o.id}')">${orgLogoHtml(o,64)}</div>
          ${!isOwn&&CU?`<button class="btn btn-sm ${following?'btn-outline':'btn-primary'}" onclick="toggleFollow('${o.id}')" style="margin-bottom:4px">${following?'✓ Following':'+ Follow'}</button>`:''}
          ${isOwn?`<span class="role-badge organizer" style="margin-bottom:4px">Your Org</span>`:''}
          ${!CU?`<button class="btn btn-primary btn-sm" onclick="openLogin('login')" style="margin-bottom:4px">Follow</button>`:''}
        </div>
        <div onclick="openOrgProfile('${o.id}')">
          <h3 style="font-size:16px;margin-bottom:4px;color:var(--csu-green-dark)">${escapeHtml(o.name)}</h3>
          <p style="color:var(--text-muted);font-size:13px;line-height:1.5;min-height:38px">${escapeHtml((o.description||'').slice(0,100))}${(o.description||'').length>100?'…':''}</p>
          <div style="display:flex;gap:14px;margin-top:12px;font-size:12px;color:var(--text-soft);font-weight:600">
            <span>📝 ${orgPostCount(o.id)}</span><span>👥 ${orgFollowerCount(o.id)}</span>
            <span class="role-badge" style="margin-left:auto">${escapeHtml(o.category||'General')}</span>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ----- Organizer "My Organization Page" - Facebook style ----- */
let _pendingPostPhotos=[]; // array of base64 strings for multi-photo
let _pendingPostVideoData=null;
let _pendingPostOrgId=null;

function switchOrgMainTab(t,el){
  orgMainTab=t;
  document.querySelectorAll('#orgDashTabs .tab').forEach(x=>x.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('orgDashEventsSection').style.display=t==='events'?'block':'none';
  document.getElementById('orgDashMyOrgSection').style.display=t==='myorg'?'block':'none';
  if(t==='myorg')renderOrgMyOrgContent();
}

function renderOrgMyOrgContent(){
  const wrap=document.getElementById('orgMyOrgContent');
  const o=ownedOrg();
  if(!o){
    wrap.innerHTML=`<div class="panel-body" style="padding:40px;text-align:center">
      <div style="font-size:56px;margin-bottom:16px">🏢</div>
      <h3 style="font-family:'Playfair Display',serif;color:var(--csu-green-dark);margin-bottom:10px">No Organization Page Yet</h3>
      <p style="color:var(--text-muted);margin-bottom:20px">Create your organization's page to share posts, photos, and updates with students.</p>
      <button class="btn btn-primary" onclick="openCreateOrgModal()">🏢 Create Organization Page</button>
    </div>`;
    return;
  }
  _pendingPostOrgId=o.id;
  const posts=(DB.organizationPosts||[]).filter(p=>p.organizationId===o.id).sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  const init=CU.name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase();
  wrap.innerHTML=`
    <!-- Cover + Header -->
    <div style="position:relative;height:200px;${orgCoverStyle(o)};border-radius:0;display:flex;align-items:flex-end">
      <div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent 40%,rgba(6,61,28,.5));border-radius:0"></div>
    </div>
    <div style="display:flex;align-items:flex-end;justify-content:space-between;padding:0 24px 20px;border-bottom:1px solid var(--border);flex-wrap:wrap;gap:12px">
      <div style="display:flex;align-items:flex-end;gap:16px">
        <div style="width:96px;height:96px;border-radius:50%;border:4px solid #fff;background:var(--csu-green-soft);display:flex;align-items:center;justify-content:center;font-size:44px;margin-top:-48px;box-shadow:0 4px 16px rgba(0,0,0,.15);overflow:hidden;flex-shrink:0">${o.logo&&o.logo.startsWith('data:')?`<img src="${o.logo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`:(escapeHtml(o.logo||'🏢'))}</div>
        <div>
          <h2 style="font-family:'Playfair Display',serif;font-size:24px;color:var(--csu-green-dark)">${escapeHtml(o.name)}</h2>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px">
            <span class="role-badge organizer" style="margin-right:8px">${escapeHtml(o.category||'General')}</span>
            👥 ${orgFollowerCount(o.id)} followers · 📝 ${posts.length} posts
          </div>
        </div>
      </div>
      <div style="display:flex;gap:8px;padding-bottom:4px">
        <button class="btn btn-outline btn-sm" onclick="openOrgProfile('${o.id}')">👁️ View Public Page</button>
        <button class="btn btn-primary btn-sm" onclick="openOrgPageSettings('${o.id}')">⚙️ Edit Page</button>
      </div>
    </div>
    <!-- Main content -->
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;padding:20px 24px" id="orgDashMainGrid">
      <div>
        <!-- Composer -->
        <div class="fb-composer">
          <div class="fb-composer-row">
            <div class="fb-composer-avatar">${init}</div>
            <div class="fb-composer-input" onclick="focusPostComposer('${o.id}')" style="display:flex;align-items:center;color:var(--text-muted);user-select:none">What's on your mind?</div>
          </div>
          <div id="postComposerExpanded_${o.id}" style="display:none">
            <textarea id="postTextInput_${o.id}" class="fb-composer-input" style="width:100%;min-height:80px;resize:none;border-radius:10px;padding:12px;font-size:14px;margin-bottom:10px;display:block" placeholder="Write something to share with your followers…"></textarea>
            <div id="postPhotosPreview_${o.id}" class="post-photo-thumbs"></div>
            <div id="postVideoPreviewWrap_${o.id}" style="display:none;margin-top:8px"></div>
          </div>
          <div class="fb-composer-btns">
            <button class="fb-composer-btn" onclick="triggerPhotoUpload('${o.id}')">📷 Photo</button>
            <button class="fb-composer-btn" onclick="triggerVideoUpload('${o.id}')">🎥 Video</button>
            <button class="fb-composer-btn" onclick="focusPostComposer('${o.id}')">📝 Text</button>
            <button class="btn btn-primary btn-sm" style="margin-left:auto" onclick="submitOrgPost('${o.id}')">Post</button>
          </div>
          <input type="file" id="photoUploadInput_${o.id}" accept="image/*" multiple style="display:none" onchange="handleMultiPhoto(event,'${o.id}')">
          <input type="file" id="videoUploadInput_${o.id}" accept="video/*" style="display:none" onchange="handleVideoUpload(event,'${o.id}')">
        </div>
        <!-- Posts feed -->
        <div id="orgDashPostsFeed_${o.id}">
          ${posts.length?posts.map(p=>renderFbPostHtml(p,true)).join(''):'<div class="empty-state"><span class="ico">📝</span><h4>No posts yet</h4><p>Use the composer above to publish your first post.</p></div>'}
        </div>
      </div>
      <div>
        <!-- About panel -->
        <div class="panel" style="margin-bottom:18px">
          <div class="panel-head"><div class="panel-title">About</div></div>
          <div class="panel-body">
            <p style="font-size:13px;color:var(--text-muted);line-height:1.6">${escapeHtml(o.description||'No description yet. Click "Edit Page" to add one.')}</p>
            ${(o.socialLinks?.facebook||o.socialLinks?.instagram)?`<div style="margin-top:14px;display:flex;flex-direction:column;gap:8px">
              ${o.socialLinks.facebook?`<a href="${o.socialLinks.facebook}" target="_blank" style="color:var(--csu-green-dark);font-weight:600;font-size:13px">📘 Facebook</a>`:''}
              ${o.socialLinks.instagram?`<a href="${o.socialLinks.instagram}" target="_blank" style="color:var(--csu-green-dark);font-weight:600;font-size:13px">📸 Instagram</a>`:''}
            </div>`:''}
          </div>
        </div>
        <!-- Photo gallery panel -->
        <div class="panel">
          <div class="panel-head"><div class="panel-title">Photos</div></div>
          <div class="panel-body">
            ${(()=>{const photos=[];posts.forEach(p=>{if(p.mediaUrls&&p.mediaUrls.length)photos.push(...p.mediaUrls);else if(p.type==='photo'&&p.mediaUrl)photos.push(p.mediaUrl)});return photos.length?`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px">${photos.slice(0,9).map(u=>`<img src="${u}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:6px;cursor:pointer" onclick="openLightbox(['${u}'],0)">`).join('')}</div>`:'<p style="color:var(--text-muted);font-size:13px">No photos yet.</p>'})()}
          </div>
        </div>
      </div>
    </div>
    <style>@media(max-width:760px){#orgDashMainGrid{grid-template-columns:1fr!important}}</style>
  `;
}

function openOrgPostModal(oid){
  // Navigate to organizer dash → My Organization Page tab (which has full composer)
  showPage('organizer');
  setTimeout(()=>{
    const tab=document.querySelectorAll('#orgDashTabs .tab')[1];
    if(tab)switchOrgMainTab('myorg',tab);
    setTimeout(()=>{
      const ta=document.getElementById('postTextInput_'+oid);
      if(ta){ta.focus();document.getElementById('postComposerExpanded_'+oid).style.display='block';}
    },200);
  },100);
}
function focusPostComposer(oid){
  document.getElementById('postComposerExpanded_'+oid).style.display='block';
  const ta=document.getElementById('postTextInput_'+oid);
  if(ta)ta.focus();
}
function triggerPhotoUpload(oid){
  focusPostComposer(oid);
  document.getElementById('photoUploadInput_'+oid).click();
}
function triggerVideoUpload(oid){
  focusPostComposer(oid);
  document.getElementById('videoUploadInput_'+oid).click();
}
function handleMultiPhoto(ev,oid){
  const files=Array.from(ev.target.files||[]);
  if(!files.length)return;
  const remaining=5-_pendingPostPhotos.length;
  if(remaining<=0)return toast('Max 5 photos per post','warning');
  const toLoad=files.slice(0,remaining);
  let loaded=0;
  toLoad.forEach(f=>{
    if(f.size>5*1024*1024){toast('One image is too large (max 5MB)','warning');loaded++;if(loaded===toLoad.length)renderPhotoThumbs(oid);return}
    const r=new FileReader();
    r.onload=e=>{_pendingPostPhotos.push(e.target.result);loaded++;if(loaded===toLoad.length)renderPhotoThumbs(oid)};
    r.readAsDataURL(f);
  });
}
function renderPhotoThumbs(oid){
  const wrap=document.getElementById('postPhotosPreview_'+oid);if(!wrap)return;
  wrap.innerHTML=_pendingPostPhotos.map((u,i)=>`<div class="post-photo-thumb"><img src="${u}"><button class="post-photo-thumb-del" onclick="removePostPhoto(${i},'${oid}')">×</button></div>`).join('');
}
function removePostPhoto(idx,oid){_pendingPostPhotos.splice(idx,1);renderPhotoThumbs(oid)}
function handleVideoUpload(ev,oid){
  const f=ev.target.files&&ev.target.files[0];if(!f)return;
  if(f.size>50*1024*1024)return toast('Video too large (max 50MB)','error');
  const r=new FileReader();
  r.onload=e=>{
    _pendingPostVideoData=e.target.result;
    const wrap=document.getElementById('postVideoPreviewWrap_'+oid);
    if(wrap){wrap.style.display='block';wrap.innerHTML=`<video src="${_pendingPostVideoData}" controls style="width:100%;max-height:200px;border-radius:8px"></video><button class="btn btn-outline btn-sm" style="margin-top:6px" onclick="removePostVideo('${oid}')">Remove Video</button>`}
  };
  r.readAsDataURL(f);
}
function removePostVideo(oid){
  _pendingPostVideoData=null;
  const wrap=document.getElementById('postVideoPreviewWrap_'+oid);
  if(wrap){wrap.style.display='none';wrap.innerHTML=''}
  const inp=document.getElementById('videoUploadInput_'+oid);
  if(inp)inp.value='';
}
function submitOrgPost(oid){
  const ta=document.getElementById('postTextInput_'+oid);
  const text=(ta?ta.value.trim():'');
  const photos=[..._pendingPostPhotos];
  const video=_pendingPostVideoData;
  if(!text&&!photos.length&&!video)return toast('Add some content first','error');
  const type=photos.length?'photo':video?'video':'text';
  const post={id:uid('post'),organizationId:oid,type,content:text,mediaUrls:photos,mediaUrl:video||'',createdAt:new Date().toISOString(),likes:0,likedBy:[],comments:[]};
  DB.organizationPosts.push(post);
  _pendingPostPhotos=[];_pendingPostVideoData=null;
  saveDB();toast('Post published!');renderOrgMyOrgContent();
}

// Open org page settings modal
function openOrgPageSettings(oid){
  const o=getOrgById(oid);if(!o)return;
  document.getElementById('opsOrgId').value=oid;
  document.getElementById('opsName').value=o.name||'';
  document.getElementById('opsCat').value=o.category||'Academic';
  document.getElementById('opsDesc').value=o.description||'';
  document.getElementById('opsFb').value=o.socialLinks?.facebook||'';
  document.getElementById('opsIg').value=o.socialLinks?.instagram||'';
  document.getElementById('opsEmoji').value=o.logo&&!o.logo.startsWith('data:')?o.logo:'';
  document.getElementById('opsLogoData').value=o.logo&&o.logo.startsWith('data:')?o.logo:'';
  document.getElementById('opsCoverData').value=o.coverPhoto||'';
  document.getElementById('opsLogoFile').value='';
  document.getElementById('opsCoverFile').value='';
  document.getElementById('opsLogoPreview').style.display='none';
  document.getElementById('opsCoverPreview').style.display='none';
  if(o.logo&&o.logo.startsWith('data:')){document.getElementById('opsLogoPreviewImg').src=o.logo;document.getElementById('opsLogoPreview').style.display='block'}
  if(o.coverPhoto){document.getElementById('opsCoverPreviewImg').src=o.coverPhoto;document.getElementById('opsCoverPreview').style.display='block'}
  document.getElementById('orgPageSettingsModal').classList.add('open');
}
function saveOrgPageSettings(){
  const oid=document.getElementById('opsOrgId').value;
  const o=getOrgById(oid);if(!o)return;
  const name=document.getElementById('opsName').value.trim();
  if(!name)return toast('Name is required','error');
  o.name=name;
  o.category=document.getElementById('opsCat').value;
  o.description=document.getElementById('opsDesc').value.trim();
  const logoData=document.getElementById('opsLogoData').value;
  const logoEmoji=document.getElementById('opsEmoji').value.trim();
  if(logoData)o.logo=logoData;
  else if(logoEmoji)o.logo=logoEmoji;
  const cover=document.getElementById('opsCoverData').value;
  if(cover)o.coverPhoto=cover;
  o.socialLinks={facebook:document.getElementById('opsFb').value.trim(),instagram:document.getElementById('opsIg').value.trim()};
  saveDB();closeModal('orgPageSettingsModal');toast('Page updated!');renderOrgMyOrgContent();
}
// File readers for settings modal
document.addEventListener('change',function(ev){
  if(ev.target.id==='opsLogoFile'){
    const f=ev.target.files&&ev.target.files[0];if(!f)return;
    const r=new FileReader();r.onload=e=>{document.getElementById('opsLogoData').value=e.target.result;document.getElementById('opsLogoPreviewImg').src=e.target.result;document.getElementById('opsLogoPreview').style.display='block'};r.readAsDataURL(f);
  }
  if(ev.target.id==='opsCoverFile'){
    const f=ev.target.files&&ev.target.files[0];if(!f)return;
    const r=new FileReader();r.onload=e=>{document.getElementById('opsCoverData').value=e.target.result;document.getElementById('opsCoverPreviewImg').src=e.target.result;document.getElementById('opsCoverPreview').style.display='block'};r.readAsDataURL(f);
  }
  if(ev.target.id==='coCoverFile'){
    const f=ev.target.files&&ev.target.files[0];if(!f)return;
    const r=new FileReader();r.onload=e=>{document.getElementById('coCoverData').value=e.target.result;document.getElementById('coCoverPreviewImg').src=e.target.result;document.getElementById('coCoverPreview').style.display='block'};r.readAsDataURL(f);
  }
});

// Create org (organizer-initiated)
function openCreateOrgModal(){document.getElementById('createOrgModal').classList.add('open')}
function submitCreateOrg(){
  const name=document.getElementById('coName').value.trim();
  const cat=document.getElementById('coCat').value;
  const desc=document.getElementById('coDesc').value.trim();
  const emoji=document.getElementById('coEmoji').value.trim();
  const logoData=document.getElementById('coLogoData').value;
  const cover=document.getElementById('coCoverData').value;
  if(!name)return toast('Please enter an organization name','error');
  if(ownedOrg())return toast('You already have an organization page','warning');
  const logo=logoData||emoji||'🏢';
  DB.organizations.push({id:uid('org'),name,description:desc,category:cat,organizerId:CU.id,logo,coverPhoto:cover,createdDate:new Date().toISOString().slice(0,10),socialLinks:{facebook:'',instagram:''}});
  saveDB();closeModal('createOrgModal');toast('Organization page created!');renderOrganizerDash();
  setTimeout(()=>{const t=document.querySelectorAll('#orgDashTabs .tab')[1];if(t)switchOrgMainTab('myorg',t)},100);
}

function readImgTo(input,targetId){
  const f=input.files&&input.files[0];if(!f)return;
  const r=new FileReader();r.onload=()=>{document.getElementById(targetId).value=r.result;toast('Image attached')};r.readAsDataURL(f);
}
function deleteOrgPost(pid){
  if(!confirm('Delete this post?'))return;
  DB.organizationPosts=DB.organizationPosts.filter(p=>p.id!==pid);
  saveDB();toast('Post deleted');
  if(document.getElementById('page-orgprofile').classList.contains('active'))renderOrgProfile();
  else if(document.getElementById('page-home').classList.contains('active'))renderFeedPosts();
  else renderOrgMyOrgContent();
}

/* ----- Edit Post ----- */
let _editPostPhotos=[]; // working copy of photos during edit
function openEditPost(pid){
  if(!CU)return;
  const p=DB.organizationPosts.find(x=>x.id===pid);if(!p)return;
  const o=getOrgById(p.organizationId);
  if(!o||o.organizerId!==CU.id)return toast('You can only edit your own organization\'s posts','error');
  _editPostPhotos=Array.isArray(p.mediaUrls)&&p.mediaUrls.length?[...p.mediaUrls]:(p.mediaUrl?[p.mediaUrl]:[]);
  // Build modal
  let modal=document.getElementById('editPostModal');
  if(!modal){
    modal=document.createElement('div');modal.id='editPostModal';modal.className='modal';
    modal.innerHTML=`<div class="modal-card" style="max-width:560px">
      <div class="modal-head"><div class="modal-title">✏️ Edit Post</div><span class="modal-close" onclick="closeModal('editPostModal')">×</span></div>
      <div class="modal-body">
        <div class="field"><label>Post Text</label><textarea id="editPostText" class="field" style="width:100%;min-height:100px;resize:vertical;border:1.5px solid var(--border);border-radius:9px;padding:11px 14px;font-family:inherit;font-size:14px;outline:none" placeholder="What's on your mind?"></textarea></div>
        <div class="field" style="margin-top:4px">
          <label>Images</label>
          <div id="editPostPhotoThumbs" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px"></div>
          <label style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border:1.5px dashed var(--border2);border-radius:8px;cursor:pointer;font-size:13px;color:var(--text-muted);font-weight:600;transition:border-color .15s" onmouseenter="this.style.borderColor='var(--csu-green)'" onmouseleave="this.style.borderColor='var(--border2)'">
            📸 Add Photos
            <input type="file" accept="image/*" multiple style="display:none" onchange="handleEditPostPhotos(event)">
          </label>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('editPostModal')">Cancel</button>
        <button class="btn btn-primary" onclick="saveEditPost()">Save Changes</button>
      </div>
    </div>`;
    document.body.appendChild(modal);
  }
  document.getElementById('editPostText').value=p.content||'';
  modal.dataset.pid=pid;
  renderEditPostThumbs();
  modal.classList.add('open');
}
function renderEditPostThumbs(){
  const wrap=document.getElementById('editPostPhotoThumbs');if(!wrap)return;
  if(!_editPostPhotos.length){wrap.innerHTML='<span style="font-size:12px;color:var(--text-muted)">No images</span>';return}
  wrap.innerHTML=_editPostPhotos.map((src,i)=>`
    <div style="position:relative;width:72px;height:72px;border-radius:8px;overflow:hidden;border:1px solid var(--border)">
      <img src="${src}" style="width:100%;height:100%;object-fit:cover">
      <button onclick="removeEditPostPhoto(${i})" style="position:absolute;top:3px;right:3px;width:20px;height:20px;border-radius:50%;background:rgba(0,0,0,.65);color:#fff;border:none;cursor:pointer;font-size:12px;line-height:1;display:flex;align-items:center;justify-content:center">×</button>
    </div>`).join('');
}
function removeEditPostPhoto(idx){
  _editPostPhotos.splice(idx,1);
  renderEditPostThumbs();
}
function handleEditPostPhotos(ev){
  const files=Array.from(ev.target.files||[]);
  const remaining=5-_editPostPhotos.length;
  if(remaining<=0)return toast('Max 5 photos per post','warning');
  let loaded=0;const toLoad=files.slice(0,remaining);
  toLoad.forEach(f=>{
    if(f.size>5*1024*1024){toast('Image too large (max 5MB)','warning');loaded++;if(loaded===toLoad.length)renderEditPostThumbs();return}
    const r=new FileReader();
    r.onload=e=>{_editPostPhotos.push(e.target.result);loaded++;if(loaded===toLoad.length)renderEditPostThumbs()};
    r.readAsDataURL(f);
  });
  ev.target.value='';
}
function saveEditPost(){
  const modal=document.getElementById('editPostModal');if(!modal)return;
  const pid=modal.dataset.pid;
  const p=DB.organizationPosts.find(x=>x.id===pid);if(!p)return;
  const text=document.getElementById('editPostText').value.trim();
  if(!text&&!_editPostPhotos.length)return toast('Post must have text or at least one image','error');
  p.content=text;
  if(_editPostPhotos.length){
    p.mediaUrls=[..._editPostPhotos];
    p.mediaUrl=_editPostPhotos[0];
    p.type='photo';
  }else{
    p.mediaUrls=[];p.mediaUrl='';p.type='text';
  }
  p.editedAt=new Date().toISOString();
  p._expanded=false; // reset see-more state after edit
  saveDB();closeModal('editPostModal');toast('Post updated!');
  refreshPost(pid);
  // Also refresh feed if visible
  if(document.getElementById('page-home').classList.contains('active'))renderFeedPosts();
}

/* ----- Admin: Organizations tab ----- */
function renderAdminOrgsTab(){
  const c=document.getElementById('adminTabContent');
  const orgs=DB.organizations||[];
  c.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;padding:6px 4px">
      <div style="font-weight:700;font-size:15px">All Organizations (${orgs.length})</div>
      <button class="btn btn-primary btn-sm" onclick="openAdminCreateOrg()">+ Create Organization</button>
    </div>
    ${orgs.length?`<table class="tbl"><thead><tr><th>Organization</th><th>Category</th><th>Manager</th><th>Posts</th><th>Followers</th><th>Actions</th></tr></thead><tbody>
      ${orgs.map(o=>{const u=DB.users.find(x=>x.id===o.organizerId);return `<tr>
        <td><div style="display:flex;gap:10px;align-items:center">${orgLogoHtml(o,36)}<div><strong>${escapeHtml(o.name)}</strong><br><span style="font-size:12px;color:var(--text-muted)">${escapeHtml((o.description||'').slice(0,60))}</span></div></div></td>
        <td>${escapeHtml(o.category||'—')}</td>
        <td>${u?escapeHtml(u.name):'<em>unassigned</em>'}</td>
        <td>${orgPostCount(o.id)}</td>
        <td>${orgFollowerCount(o.id)}</td>
        <td><div class="tbl-actions">
          <button class="btn btn-outline btn-sm" onclick="openOrgProfile('${o.id}')">View</button>
          <button class="btn btn-outline btn-sm" onclick="adminEditOrg('${o.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="adminDeleteOrg('${o.id}')">Delete</button>
        </div></td></tr>`}).join('')}
      </tbody></table>`:'<div class="empty-state"><span class="ico">🏢</span><h4>No organizations yet</h4><p>Create the first organization and assign it to a user.</p></div>'}
    <div id="adminOrgEditor"></div>
  `;
}
function openAdminCreateOrg(){adminOrgEditor(null)}
function adminEditOrg(oid){adminOrgEditor(oid)}
function adminOrgEditor(oid){
  const o=oid?getOrgById(oid):{id:'',name:'',description:'',logo:'🏢',coverPhoto:'',organizerId:'',category:'Academic',socialLinks:{facebook:'',instagram:''}};
  const candidates=DB.users.filter(u=>u.role!=='admin');
  const w=document.getElementById('adminOrgEditor');
  w.innerHTML=`<div class="panel" style="margin-top:18px"><div class="panel-head"><div class="panel-title">${oid?'Edit':'Create'} Organization</div></div>
    <div class="panel-body">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div><label style="font-size:12px;font-weight:600;color:var(--text-muted)">Name</label><input id="aoName" class="filter-select" style="width:100%;background:#fff" value="${escapeHtml(o.name)}"></div>
        <div><label style="font-size:12px;font-weight:600;color:var(--text-muted)">Category</label>
          <select id="aoCat" class="filter-select" style="width:100%;background:#fff">
            ${['Academic','Cultural','Sports','Seminar','Workshop','Community','General'].map(c=>`<option ${o.category===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
      </div>
      <div style="margin-top:10px"><label style="font-size:12px;font-weight:600;color:var(--text-muted)">Description</label><textarea id="aoDesc" class="filter-select" style="width:100%;background:#fff;min-height:70px;resize:vertical">${escapeHtml(o.description)}</textarea></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px">
        <div><label style="font-size:12px;font-weight:600;color:var(--text-muted)">Assign Organizer (User)</label>
          <select id="aoUser" class="filter-select" style="width:100%;background:#fff">
            <option value="">— Select user —</option>
            ${candidates.map(u=>`<option value="${u.id}" ${o.organizerId===u.id?'selected':''}>${escapeHtml(u.name)} · ${u.role} · ${escapeHtml(u.email)}</option>`).join('')}
          </select>
        </div>
        <div><label style="font-size:12px;font-weight:600;color:var(--text-muted)">Logo emoji (or upload below)</label>
          <input id="aoLogoEmoji" class="filter-select" style="width:100%;background:#fff" value="${o.logo&&!o.logo.startsWith('data:')?escapeHtml(o.logo):''}" placeholder="e.g. 🎭">
          <input type="file" accept="image/*" onchange="readImg(this,'aoLogoData')" style="margin-top:6px">
          <input type="hidden" id="aoLogoData" value="${o.logo&&o.logo.startsWith('data:')?o.logo:''}">
        </div>
      </div>
      <div style="margin-top:10px"><label style="font-size:12px;font-weight:600;color:var(--text-muted)">Cover photo</label>
        <input type="file" accept="image/*" onchange="readImg(this,'aoCoverData')">
        <input type="hidden" id="aoCoverData" value="${o.coverPhoto||''}">
      </div>
      <div style="margin-top:14px;display:flex;gap:8px">
        <button class="btn btn-primary" onclick="adminSaveOrg('${oid||''}')">${oid?'Save Changes':'Create Organization'}</button>
        <button class="btn btn-outline" onclick="document.getElementById('adminOrgEditor').innerHTML=''">Cancel</button>
      </div>
    </div></div>`;
  w.scrollIntoView({behavior:'smooth',block:'end'});
}
function adminSaveOrg(oid){
  const name=document.getElementById('aoName').value.trim();
  const cat=document.getElementById('aoCat').value;
  const desc=document.getElementById('aoDesc').value.trim();
  const userId=document.getElementById('aoUser').value;
  const logoData=document.getElementById('aoLogoData').value;
  const logoEmoji=document.getElementById('aoLogoEmoji').value.trim();
  const cover=document.getElementById('aoCoverData').value;
  if(!name||!userId)return toast('Name and assigned user are required','error');
  const logo=logoData||logoEmoji||'🏢';
  if(oid){
    const o=getOrgById(oid);if(!o)return;
    Object.assign(o,{name,category:cat,description:desc,organizerId:userId,logo,coverPhoto:cover||o.coverPhoto});
    toast('Organization updated');
  }else{
    DB.organizations.push({id:uid('org'),name,description:desc,category:cat,organizerId:userId,logo,coverPhoto:cover,createdDate:new Date().toISOString().slice(0,10),socialLinks:{facebook:'',instagram:''}});
    toast('Organization created');
  }
  // Promote assigned user to organizer
  const u=DB.users.find(x=>x.id===userId);if(u&&u.role==='student'){u.role='organizer';toast(`${u.name} promoted to organizer`)}
  saveDB();renderAdminTab();renderAdminDash();
}
function adminDeleteOrg(oid){
  if(!confirm('Delete this organization and all its posts?'))return;
  DB.organizations=DB.organizations.filter(o=>o.id!==oid);
  DB.organizationPosts=DB.organizationPosts.filter(p=>p.organizationId!==oid);
  DB.organizationFollows=DB.organizationFollows.filter(f=>f.organizationId!==oid);
  saveDB();toast('Organization deleted');renderAdminTab();renderAdminDash();
}

/* ============================ BOOT ============================ */
loadDB();renderNav();
(function(){
  const lastPage=localStorage.getItem('cems_current_page');
  if(CU){
    if(lastPage&&userHasAccess(lastPage)&&lastPage!=='orgprofile')showPage(lastPage);
    else showPage(CU.role==='admin'?'admin':CU.role==='organizer'?'organizer':'dashboard');
  }else{
    showPage('home');
  }
})();
