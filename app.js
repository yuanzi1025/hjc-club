// ============ 1. 基础配置 ============
const SUPABASE_URL = "https://wbusiwrpmiapgaximfkz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_97LWTArYb15xmnHNNI9sOQ_AP3NIwB1";
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SUPER_ADMIN_EMAIL = "zzy@hjc.club"; 
const SOUND_LIST = ["sound1.m4a", "sound2.m4a", "sound3.m4a", "sound4.m4a"];
let isAdmin = false;

// ============ 2. XSS 安全转义 ============
function escapeHTML(str) {
  if (!str) return '';
  return str.toString().replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// ============ 3. 路由 ============
const routes = ["home", "mascot", "history", "events", "leadership", "search", "model3d", "leaderboard", "login", "register", "settings", "admin"];

function navigate() {
  const hash = location.hash.replace("#/", "") || "home";
  const view = routes.includes(hash) ? hash : "home";

  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.dataset.view === view));
  document.querySelectorAll("[data-nav]").forEach(a => a.classList.toggle("active", a.dataset.nav === view));

  if (view === "search") setTimeout(() => document.getElementById("searchInput").focus(), 50);
  if (view === "admin") loadAdmin();
  if (view === "leaderboard") loadLeaderboard();
}
window.addEventListener("hashchange", navigate);

// ============ 4. 数据渲染 ============

// 历史
async function loadHistory() {
  const list = document.getElementById("historyList");
  list.innerHTML = '<p style="text-align:center;color:#888;">加载中...</p>';
  const { data } = await db.from('history').select('*').order('year', { ascending: false });
  list.innerHTML = '';
  if (data) data.forEach(h => {
    list.innerHTML += `<div class="timeline-item"><div class="timeline-year">${escapeHTML(h.year)}</div><div>${escapeHTML(h.text)}</div>${isAdmin ? `<button onclick="deleteItem('history', '${h.id}')" style="margin-left:10px; background:#ef4444; color:#fff; border:none; border-radius:4px; cursor:pointer;">❌ 删除</button>` : ''}</div>`;
  });
  if (isAdmin) list.innerHTML += `<button onclick="addHistory()" class="btn" style="width:100%; margin-top:20px; background:#10b981;">➕ 添加新历史</button>`;
}

// 事件
async function loadEvents() {
  const list = document.getElementById("eventsList");
  list.innerHTML = '<p style="text-align:center;color:#888;">加载中...</p>';
  const { data } = await db.from('events').select('*').order('created_at', { ascending: false });
  list.innerHTML = '';
  if (data) data.forEach(e => {
    list.innerHTML += `<div class="project"><h3>${escapeHTML(e.title)}</h3><p>${escapeHTML(e.desc)}</p><span class="tag">${escapeHTML(e.date)}</span>${isAdmin ? `<button onclick="deleteItem('events', '${e.id}')" style="position:absolute; top:15px; right:15px; background:#ef4444; color:#fff; border:none; border-radius:4px; cursor:pointer;">❌ 删除</button>` : ''}</div>`;
  });
  if (isAdmin) list.innerHTML += `<button onclick="addEvent()" class="btn" style="width:100%; margin-top:20px; background:#10b981;">➕ 添加重大事件</button>`;
}

// 吉祥物
async function loadMascots() {
  const list = document.getElementById("mascotList");
  list.innerHTML = '<p style="text-align:center;color:#888;">加载中...</p>';
  const { data } = await db.from('mascots').select('*').order('created_at', { ascending: true });
  list.innerHTML = '';
  if (data) data.forEach(m => {
    list.innerHTML += `<div class="mascot-card"><div class="m-name">${escapeHTML(m.name)}</div><div class="m-title">${escapeHTML(m.title)}</div>${isAdmin ? `<button onclick="deleteItem('mascots', '${m.id}')" style="margin-top:15px; background:#ef4444; color:#fff; border:none; border-radius:4px; cursor:pointer; padding:4px 10px;">❌ 删除</button>` : ''}</div>`;
  });
  if (isAdmin) list.innerHTML += `<div class="mascot-card" style="display:flex; align-items:center; justify-content:center; border:2px dashed #10b981; cursor:pointer;" onclick="addMascot()"><div style="color:#10b981; font-weight:bold; font-size:18px;">➕ 添加新图鉴</div></div>`;
}

// 管理层
async function loadMembers() {
  const list = document.getElementById("membersList");
  list.innerHTML = '<p style="text-align:center;color:#888; grid-column: 1 / -1;">加载中...</p>';
  const { data } = await db.from('members').select('*').order('created_at', { ascending: true });
  list.innerHTML = '';
  if (data) data.forEach(m => {
    list.innerHTML += `<div class="member"><div class="avatar">${escapeHTML(m.name[0])}</div><h3>${escapeHTML(m.name)}</h3><div class="role">${escapeHTML(m.role)}</div><div class="desc">${escapeHTML(m.desc)}</div>${isAdmin ? `<button onclick="deleteItem('members', '${m.id}')" style="margin-top:10px; background:#ef4444; color:#fff; border:none; border-radius:4px; cursor:pointer; padding:4px 10px;">❌ 踢出管理层</button>` : ''}</div>`;
  });
  if (isAdmin) list.innerHTML += `<div class="member" style="display:flex; flex-direction:column; align-items:center; justify-content:center; border:2px dashed #10b981; cursor:pointer;" onclick="addMember()"><div style="color:#10b981; font-weight:bold; font-size:18px; margin-top:20px;">➕ 添加新成员</div></div>`;
}

// 积分榜与接单大厅
async function loadLeaderboard() {
  const { data: { user } } = await db.auth.getUser();
  const isSuperAdmin = user && user.email === SUPER_ADMIN_EMAIL;

  // 排行榜
  const table = document.getElementById("leaderboardTable");
  table.innerHTML = `<tr style="text-align:left; border-bottom:1px solid #eee;"><th style="padding:10px;">排名</th><th style="padding:10px;">邮箱</th><th style="padding:10px;">积分</th></tr>`;
  const { data: users } = await db.from('profiles').select('email, points').order('points', { ascending: false }).limit(50);
  if (users) users.forEach((userInfo, index) => {
    let medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : (index + 1);
    table.innerHTML += `<tr style="border-bottom:1px solid #f3f3f5;"><td style="padding:10px; font-weight:bold;">${medal}</td><td style="padding:10px;">${escapeHTML(userInfo.email)}</td><td style="padding:10px; color:#10b981; font-weight:bold;">${userInfo.points || 0} 分</td></tr>`;
  });

  // 接单大厅
  const reqTable = document.getElementById("requestTable");
  reqTable.innerHTML = `<tr style="text-align:left; border-bottom:1px solid #eee;">
                          <th style="padding:10px;">需求人</th>
                          <th style="padding:10px;">类型</th>
                          <th style="padding:10px;">需求描述</th>
                          <th style="padding:10px;">状态</th>
                          ${isSuperAdmin ? '<th style="padding:10px;">操作</th>' : ''}
                        </tr>`;
                        
  const { data: reqs } = await db.from('model_requests').select('*').order('created_at', { ascending: false }).limit(20);
  
  if (reqs) reqs.forEach(r => {
    let statusTag = '';
    if (r.status === 'pending') statusTag = '<span class="tag" style="background:#fef08a; color:#78350f;">待接单</span>';
    if (r.status === 'accepted') statusTag = '<span class="tag" style="background:#bfdbfe; color:#1e3a8a;">已接单</span>';
    if (r.status === 'completed') statusTag = '<span class="tag" style="background:#bbf7d0; color:#166534;">已完成</span>';

    const typeText = r.request_type === 'new' ? '<span style="color:#7c3aed;">新建</span>' : '<span style="color:#10b981;">改进</span>';
    
    // 只有超级管理员才能看到“接单”和“标记完工”的按钮
    let actionBtn = '';
    if (isSuperAdmin) {
      if (r.status === 'pending') {
        actionBtn = `<button onclick="updateRequestStatus('${r.id}', 'accepted')" class="btn-small" style="background:#3b82f6;">一键接单</button>`;
      } else if (r.status === 'accepted') {
        actionBtn = `<button onclick="updateRequestStatus('${r.id}', 'completed')" class="btn-small" style="background:#10b981;">标记完工</button>`;
      } else {
        actionBtn = `<span style="color:#888; font-size:12px;">已完结</span>`;
      }
    }

    reqTable.innerHTML += `
      <tr style="border-bottom:1px solid #f3f3f5;">
        <td style="padding:10px;">${escapeHTML(r.user_email)}</td>
        <td style="padding:10px;">${typeText}</td>
        <td style="padding:10px;">${escapeHTML(r.description)}</td>
        <td style="padding:10px;">${statusTag}</td>
        ${isSuperAdmin ? `<td style="padding:10px;">${actionBtn}</td>` : ''}
      </tr>
    `;
  });
}

// 超级管理员更新订单状态
async function updateRequestStatus(id, newStatus) {
  const { error } = await db.from('model_requests').update({ status: newStatus }).eq('id', id);
  if (error) alert("更新失败：" + error.message);
  else loadLeaderboard();
}

// 3D 模型切换
function switchModel(url, element) {
  document.getElementById('main-model').src = url;
  document.querySelectorAll('.model-thumb').forEach(el => el.style.borderColor = '#eef0f4');
  element.style.borderColor = '#7c3aed';
}

// 用户下单函数
async function requestModel(type) {
  const desc = prompt(type === 'new' ? "请描述你需要定制的 3D 模型内容（扣除20积分）：" : "请描述你需要改进的具体细节（扣除15积分）：");
  if (!desc) return;
  const funcName = type === 'new' ? 'request_new_model' : 'request_improve_model';
  const { data, error } = await db.rpc(funcName, { desc_text: desc });
  if (error) return alert("下单失败：" + error.message);
  alert(data.message);
  if (data.success) { loadLeaderboard(); refreshAuth(); }
}

// 每日打卡
async function handleCheckIn() {
  const btn = document.getElementById("checkInBtn");
  btn.disabled = true; btn.textContent = "签到中...";
  const { data, error } = await db.rpc('daily_check_in');
  if (error) { alert("签到失败：" + error.message); btn.disabled = false; btn.textContent = "首页打卡 +10"; return; }
  alert(data.message);
  btn.textContent = "今日已签到"; btn.style.background = "#9ca3af";
  loadLeaderboard();
}

// 登录发分
async function claimLoginReward() {
  const { data, error } = await db.rpc('claim_login_reward');
  if (!error && data.success) {
    setTimeout(() => { alert(data.message); loadLeaderboard(); }, 1000);
  }
}

// ============ 5. 管理员 CRUD ============
async function deleteItem(table, id) {
  if (!confirm("确定要删除吗？此操作不可恢复！")) return;
  await db.from(table).delete().eq('id', id);
  if (table === 'history') loadHistory();
  if (table === 'events') loadEvents();
  if (table === 'mascots') loadMascots();
  if (table === 'members') loadMembers();
}
async function addHistory() { const year = prompt("年份:"); const text = prompt("描述:"); if(year && text) { await db.from('history').insert([{ year, text }]); loadHistory(); } }
async function addEvent() { const date = prompt("日期:"); const title = prompt("标题:"); const desc = prompt("描述:"); if(date && title && desc) { await db.from('events').insert([{ date, title, desc }]); loadEvents(); } }
async function addMascot() { const name = prompt("名字:"); const title = prompt("外号:"); if(name && title) { await db.from('mascots').insert([{ name, title }]); loadMascots(); } }
async function addMember() { const name = prompt("姓名:"); const role = prompt("职位:"); const desc = prompt("简介:") || '无'; if(name && role) { await db.from('members').insert([{ name, role, desc }]); loadMembers(); } }

// ============ 6. 鉴权与状态控制 ============
async function refreshAuth() {
  const { data: { user } } = await db.auth.getUser();
  const authBtn = document.getElementById("authBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const vipContent = document.getElementById("vip-content");
  const loginPrompt = document.getElementById("login-prompt");
  const lockedContents = document.querySelectorAll('.locked-content');
  const realContents = document.querySelectorAll('.real-content');
  
  // 获取下单卡片元素
  const requestCard = document.getElementById("request-service-card");

  if (user) {
    authBtn.style.display = "none"; logoutBtn.style.display = "inline-block";
    if(vipContent) vipContent.style.display = "block"; if(loginPrompt) loginPrompt.style.display = "none";
    lockedContents.forEach(el => el.style.display = 'none'); realContents.forEach(el => el.style.display = 'block');
    
    const isSuper = (user.email === SUPER_ADMIN_EMAIL);
    
    // 【核心控制】如果是超级管理员，隐藏 3D 展厅的下单卡片；普通用户则显示
    if (requestCard) {
      requestCard.style.display = isSuper ? "none" : "block";
    }

    const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).single();
    isAdmin = isSuper || profile?.role === 'admin';
  } else {
    authBtn.style.display = "inline-block"; logoutBtn.style.display = "none";
    if(vipContent) vipContent.style.display = "none"; if(loginPrompt) loginPrompt.style.display = "block";
    lockedContents.forEach(el => el.style.display = 'block'); realContents.forEach(el => el.style.display = 'none');
    
    // 未登录时，也隐藏下单卡片
    if (requestCard) requestCard.style.display = "none";
    
    isAdmin = false;
  }
  loadHistory(); loadEvents(); loadMascots(); loadMembers();
}

// 监听登录状态改变
db.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN') claimLoginReward();
  refreshAuth();
});

document.getElementById("logoutBtn").onclick = async () => { await db.auth.signOut(); location.hash = "#/"; location.reload(); };

document.getElementById("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const errEl = document.getElementById("loginError"); errEl.textContent = "";
  let inputVal = document.getElementById("loginEmail").value.trim();
  let email = inputVal.includes("@") ? inputVal : inputVal + "@hjc.club";
  const { error } = await db.auth.signInWithPassword({ email, password: document.getElementById("loginPassword").value });
  if (error) errEl.textContent = error.message; else location.hash = "#/";
});

document.getElementById("registerForm").addEventListener("submit", async e => {
  e.preventDefault();
  const errEl = document.getElementById("registerError"); errEl.textContent = "";
  let inputVal = document.getElementById("registerEmail").value.trim();
  let email = inputVal.includes("@") ? inputVal : inputVal + "@hjc.club";
  const { error } = await db.auth.signUp({ email, password: document.getElementById("registerPassword").value });
  if (error) errEl.textContent = error.message; else { alert("注册成功，请登录"); location.hash = "#/login"; }
});

// ============ 7. 管理后台 ============
async function loadAdmin() {
  const table = document.getElementById("adminTable");
  const count = document.getElementById("adminCount");
  const { data: { user } } = await db.auth.getUser();
  if (!user) { location.hash = "#/login"; return; }
  
  const isSuperAdmin = (user.email === SUPER_ADMIN_EMAIL);
  const { data: me } = await db.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin" && !isSuperAdmin) { location.hash = "#/leadership"; return; }

  const { data } = await db.from("profiles").select("*").order("created_at", { ascending: false });
  count.textContent = `共 ${(data || []).length} 名注册用户`;
  
  table.innerHTML = `<tr style="text-align:left;border-bottom:1px solid #eee"><th style="padding:8px">邮箱</th><th style="padding:8px">角色</th><th style="padding:8px">操作</th></tr>` + 
    (data || []).map(p => {
      const isTargetSuper = (p.email === SUPER_ADMIN_EMAIL);
      const roleDisplay = isTargetSuper ? `<span class="tag" style="background:linear-gradient(135deg, #fef08a, #f59e0b); color:#78350f;">👑 超级管理员</span>` : `<span class="tag">${p.role === "admin" ? "管理员" : "成员"}</span>`;
      let btnHtml = `<button class="btn-small" data-id="${p.id}" data-role="${p.role}" data-email="${p.email}">${p.role === "admin" ? "降为成员" : "设为管理员"}</button>`;
      if (isTargetSuper) btnHtml = `<button class="btn-small" style="background:#ccc;" disabled>不可操作</button>`;
      return `<tr style="border-bottom:1px solid #f3f3f5"><td style="padding:8px">${p.email || ""}</td><td style="padding:8px">${roleDisplay}</td><td style="padding:8px">${btnHtml}</td></tr>`;
    }).join("");

  table.querySelectorAll("button[data-id]:not([disabled])").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (btn.dataset.email === SUPER_ADMIN_EMAIL) return alert("🚨 无权修改超管！");
      const next = btn.dataset.role === "admin" ? "member" : "admin";
      await db.from("profiles").update({ role: next }).eq("id", btn.dataset.id);
      loadAdmin();
    });
  });
}

// ============ 8. 启动与弹窗逻辑 ============
async function initApp() {
  const disclaimer = document.getElementById("disclaimer-overlay");
  const agreeBtn = document.getElementById("agreeBtn");
  if (localStorage.getItem("hjc_disclaimer_agreed")) {
    disclaimer.style.display = "none";
  } else {
    disclaimer.style.display = "flex";
    let countdown = 5;
    const timer = setInterval(() => {
      countdown--;
      if (countdown > 0) agreeBtn.textContent = `请阅读 (${countdown}s)`;
      else { clearInterval(timer); agreeBtn.textContent = "我已阅读并同意"; agreeBtn.disabled = false; agreeBtn.style.background = "#7c3aed"; agreeBtn.style.cursor = "pointer"; }
    }, 1000);
    agreeBtn.addEventListener("click", () => {
      localStorage.setItem("hjc_disclaimer_agreed", "true"); disclaimer.style.display = "none";
      const randomFile = SOUND_LIST[Math.floor(Math.random() * SOUND_LIST.length)];
      new Audio(randomFile).play().catch(e => console.log(e));
    });
  }

  navigate();
  await Promise.race([refreshAuth(), new Promise(resolve => setTimeout(resolve, 3000))]);

  setTimeout(() => {
    const loader = document.getElementById("loading-screen");
    if (loader) {
      loader.style.opacity = "0";
      setTimeout(() => { loader.style.display = "none"; if (Math.random() < 0.1) triggerRickroll(); }, 500);
    }
  }, 600);
}

function triggerRickroll() {
  const overlay = document.getElementById("rickroll-overlay");
  const iframe = document.getElementById("rickroll-video");
  if (overlay && iframe) {
    iframe.src = `https://player.bilibili.com/player.html?bvid=BV1GJ411x7h7&page=1&high_quality=1&danmaku=1&autoplay=1&t=${Date.now()}`;
    overlay.style.display = "flex";
  }
}
document.getElementById("closeRickroll").onclick = () => { document.getElementById("rickroll-overlay").style.display = "none"; document.getElementById("rickroll-video").src = "about:blank"; };
document.getElementById("secretBtn").addEventListener("click", () => triggerRickroll());

// 搜索功能
document.getElementById("searchInput").addEventListener("input", async (e) => {
  const q = e.target.value.trim().toLowerCase();
  const resultsEl = document.getElementById("searchResults");
  const emptyEl = document.getElementById("searchEmpty");
  resultsEl.innerHTML = ''; emptyEl.style.display = 'none';
  if (!q) return;

  let results = [];
  const { data: mData } = await db.from('members').select('*');
  if (mData) mData.forEach(m => { if(`${m.name} ${m.role} ${m.desc}`.toLowerCase().includes(q)) results.push({ type: "成员", text: `${m.name} - ${m.role}` }); });
  const { data: hData } = await db.from('history').select('*');
  if (hData) hData.forEach(h => { if(`${h.year} ${h.text}`.toLowerCase().includes(q)) results.push({ type: "历史", text: `${h.year} - ${h.text}` }); });
  const { data: eData } = await db.from('events').select('*');
  if (eData) eData.forEach(e => { if(`${e.date} ${e.title} ${e.desc}`.toLowerCase().includes(q)) results.push({ type: "事件", text: `${e.title} - ${e.desc}` }); });
  const { data: mascotData } = await db.from('mascots').select('*');
  if (mascotData) mascotData.forEach(m => { if(`${m.name} ${m.title}`.toLowerCase().includes(q)) results.push({ type: "吉祥物", text: `${m.name} - ${m.title}` }); });

  if (results.length === 0) emptyEl.style.display = 'block';
  else resultsEl.innerHTML = results.map(r => `<li><span class="tag">${r.type}</span>${r.text}</li>`).join('');
});

initApp();