// ============ 1. Supabase 与基础配置 ============
const SUPABASE_URL = "https://wbusiwrpmiapgaximfkz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_97LWTArYb15xmnHNNI9sOQ_AP3NIwB1";

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SUPER_ADMIN_EMAIL = "zzy@hjc.club"; // 超级管理员邮箱
const SOUND_LIST = ["sound1.m4a", "sound2.m4a", "sound3.m4a", "sound4.m4a"];

let isAdmin = false;

// ============ 2. 防 XSS 安全转义函数 ============
function escapeHTML(str) {
  if (!str) return '';
  return str.toString().replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// ============ 3. 中英文字典 ============
const I18N = {
  zh: {
    home: "主页", mascot: "吉祥物", history: "发展历史", events: "重大事件",
    leadership: "管理层", search: "搜索", login: "登录", register: "注册",
    logout: "退出登录", settings: "设置",
    heroTitle: "欢迎来到谎精俱乐部官网！",
    heroSub: "谎精俱乐部成立于 2026 年 4 月，由朱老吉创建并发展。现有 6 名成员，总部位于西航四校成才楼北楼梯2.5层。",
    learnMore: "点击我了解更多 ↓",
    aboutTitle: "加入我们",
    about1: "加入前请认真阅读以下须知：",
    about2: "1. 必须做一个合格的谎精。",
    about3: "2. 禁止侮辱谎精俱乐部，违者将被踢出。",
    joinRule3: "3. 禁止内讧，友好相处。",
    joinContact: "请联系部长或拨打 138-1145-1145（孙部长）",
    seeHistory: "看发展历史", seeLeadership: "认识管理层",
    mascotTitle: "吉祥物", mascotDesc: "吉祥物真实存在。",
    historyTitle: "发展历史", historySub: "按时间顺序，真实性递减",
    eventsTitle: "重大事件", eventsSub: "以下项目均真实存在",
    leadershipTitle: "管理层", leadershipSub: "头衔均经本人同意（大概）",
    searchTitle: "搜索", searchPlaceholder: "搜成员、事件、历史……",
    searchEmpty: "没搜到。可能这个名字也是编的。",
    loginTitle: "登录 HJC谎精俱乐部", submit: "登录", noAccount: "还没有账号？去注册",
    registerTitle: "注册 HJC谎精俱乐部", registerSubmit: "注册", hasAccount: "已有账号？去登录",
    language: "语言", adminTitle: "管理后台", roleAdmin: "管理员", roleMember: "成员",
    promote: "设为管理员", demote: "降为成员",
    loginPromptTitle: "🔒 内容已隐藏",
    loginPromptDesc: "登录后即可解锁“谎精秘密实验室”及隐藏陷阱。",
    loginPromptBtn: "立即登录解锁",
  },
  en: {
    home: "Home", mascot: "Mascot", history: "History", events: "Events",
    leadership: "Leadership", search: "Search", login: "Login", register: "Sign up",
    logout: "Log out", settings: "Settings",
    heroTitle: "Welcome to HJC Liar Club!",
    heroSub: "Founded in April 2026 by Zhu Laoji. We have 6 members. HQ is at North Staircase 2.5F, Chengcai Bldg, Xihang No.4 School.",
    learnMore: "Click to learn more ↓",
    aboutTitle: "Join Us",
    about1: "Please read the following rules carefully before joining:",
    about2: "1. You must be a qualified liar.",
    about3: "2. No insulting the club. Violators will be kicked out.",
    joinRule3: "3. No internal conflicts. Be friendly.",
    joinContact: "Contact Minister Sun at 138-1145-1145.",
    seeHistory: "View history", seeLeadership: "Meet the leadership",
    mascotTitle: "Mascot", mascotDesc: "Our mascot and characters, chosen by internal vote.",
    historyTitle: "History", historySub: "In chronological order, truthfulness decreasing",
    eventsTitle: "Events", eventsSub: "All real, with limited exaggeration",
    leadershipTitle: "Leadership", leadershipSub: "Titles approved by themselves (probably)",
    searchTitle: "Search", searchPlaceholder: "Search members, events, history…",
    searchEmpty: "Nothing found. Maybe that name was made up too.",
    loginTitle: "Log in to HJC Liar Club", submit: "Log in", noAccount: "No account? Sign up",
    registerTitle: "Sign up for HJC Liar Club", registerSubmit: "Sign up", hasAccount: "Already have an account? Log in",
    language: "Language", adminTitle: "Admin", roleAdmin: "Admin", roleMember: "Member",
    promote: "Make admin", demote: "Demote",
    loginPromptTitle: "🔒 Content Hidden",
    loginPromptDesc: "Log in to unlock the Secret Lab and hidden traps.",
    loginPromptBtn: "Log in to Unlock",
  },
};

// ============ 4. 语言切换逻辑 ============
let lang = localStorage.getItem("lang") || "zh";
const t = key => (I18N[lang] && I18N[lang][key]) || key;

function applyLang() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-lang]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
}

document.querySelectorAll("[data-lang]").forEach(btn => {
  btn.addEventListener("click", () => {
    lang = btn.dataset.lang;
    localStorage.setItem("lang", lang);
    applyLang();
  });
});

// ============ 5. 路由与渲染 ============
const routes = ["home", "mascot", "history", "events", "leadership", "search", "login", "register", "settings", "admin"];

function navigate() {
  const hash = location.hash.replace("#/", "") || "home";
  const view = routes.includes(hash) ? hash : "home";

  document.querySelectorAll(".view").forEach(v => {
    v.classList.toggle("active", v.dataset.view === view);
  });
  document.querySelectorAll("[data-nav]").forEach(a => {
    a.classList.toggle("active", a.dataset.nav === view);
  });

  if (view === "search") setTimeout(() => document.getElementById("searchInput").focus(), 50);
  if (view === "admin") loadAdmin();
}

window.addEventListener("hashchange", navigate);

// ============ 6. 核心数据渲染逻辑（带 XSS 防御） ============

// 渲染历史
async function loadHistory() {
  const list = document.getElementById("historyList");
  list.innerHTML = '<p style="text-align:center;color:#888;">加载中...</p>';
  
  // 【修改这里】：按照 year 降序排列（最新的在最上面）
  const { data } = await db.from('history').select('*').order('year', { ascending: false });
  
  list.innerHTML = '';
  if (data) {
    data.forEach(h => {
      list.innerHTML += `
        <div class="timeline-item">
          <div class="timeline-year">${escapeHTML(h.year)}</div>
          <div>${escapeHTML(h.text)}</div>
          ${isAdmin ? `<button onclick="deleteItem('history', '${h.id}')" style="margin-left:10px; background:#ef4444; color:#fff; border:none; border-radius:4px; cursor:pointer;">❌ 删除</button>` : ''}
        </div>
      `;
    });
  }
  if (isAdmin) {
    list.innerHTML += `<button onclick="addHistory()" class="btn" style="width:100%; margin-top:20px; background:#10b981;">➕ 添加新历史</button>`;
  }
}

// 渲染事件
async function loadEvents() {
  const list = document.getElementById("eventsList");
  list.innerHTML = '<p style="text-align:center;color:#888;">加载中...</p>';
  const { data } = await db.from('events').select('*').order('created_at', { ascending: false });
  
  list.innerHTML = '';
  if (data) {
    data.forEach(e => {
      list.innerHTML += `
        <div class="project">
          <h3>${escapeHTML(e.title)}</h3>
          <p>${escapeHTML(e.desc)}</p>
          <span class="tag">${escapeHTML(e.date)}</span>
          ${isAdmin ? `<button onclick="deleteItem('events', '${e.id}')" style="position:absolute; top:15px; right:15px; background:#ef4444; color:#fff; border:none; border-radius:4px; cursor:pointer;">❌ 删除</button>` : ''}
        </div>
      `;
    });
  }
  if (isAdmin) {
    list.innerHTML += `<button onclick="addEvent()" class="btn" style="width:100%; margin-top:20px; background:#10b981;">➕ 添加重大事件</button>`;
  }
}

// 渲染吉祥物
async function loadMascots() {
  const list = document.getElementById("mascotList");
  list.innerHTML = '<p style="text-align:center;color:#888;">加载中...</p>';
  const { data } = await db.from('mascots').select('*').order('created_at', { ascending: true });
  
  list.innerHTML = '';
  if (data) {
    data.forEach(m => {
      list.innerHTML += `
        <div class="mascot-card">
          <div class="m-name">${escapeHTML(m.name)}</div>
          <div class="m-title">${escapeHTML(m.title)}</div>
          ${isAdmin ? `<button onclick="deleteItem('mascots', '${m.id}')" style="margin-top:15px; background:#ef4444; color:#fff; border:none; border-radius:4px; cursor:pointer; padding:4px 10px;">❌ 删除</button>` : ''}
        </div>
      `;
    });
  }
  if (isAdmin) {
    list.innerHTML += `<div class="mascot-card" style="display:flex; align-items:center; justify-content:center; border:2px dashed #10b981; cursor:pointer;" onclick="addMascot()">
      <div style="color:#10b981; font-weight:bold; font-size:18px;">➕ 添加新图鉴</div>
    </div>`;
  }
}

// 渲染管理层
async function loadMembers() {
  const list = document.getElementById("membersList");
  list.innerHTML = '<p style="text-align:center;color:#888; grid-column: 1 / -1;">加载中...</p>';
  const { data } = await db.from('members').select('*').order('created_at', { ascending: true });
  
  list.innerHTML = '';
  if (data) {
    data.forEach(m => {
      list.innerHTML += `
        <div class="member">
          <div class="avatar">${escapeHTML(m.name[0])}</div>
          <h3>${escapeHTML(m.name)}</h3>
          <div class="role">${escapeHTML(m.role)}</div>
          <div class="desc">${escapeHTML(m.desc)}</div>
          ${isAdmin ? `<button onclick="deleteItem('members', '${m.id}')" style="margin-top:10px; background:#ef4444; color:#fff; border:none; border-radius:4px; cursor:pointer; padding:4px 10px;">❌ 踢出管理层</button>` : ''}
        </div>
      `;
    });
  }
  if (isAdmin) {
    list.innerHTML += `<div class="member" style="display:flex; flex-direction:column; align-items:center; justify-content:center; border:2px dashed #10b981; cursor:pointer;" onclick="addMember()">
      <div style="color:#10b981; font-weight:bold; font-size:18px; margin-top:20px;">➕ 添加新成员</div>
    </div>`;
  }
}

// ============ 7. 管理员 CRUD 操作 ============

async function deleteItem(table, id) {
  if (!confirm("确定要删除吗？此操作不可恢复！")) return;
  const { error } = await db.from(table).delete().eq('id', id);
  if (error) alert("删除失败: " + error.message);
  else {
    if (table === 'history') loadHistory();
    if (table === 'events') loadEvents();
    if (table === 'mascots') loadMascots();
    if (table === 'members') loadMembers();
  }
}

async function addHistory() {
  const year = prompt("请输入年份 (如 2026.11):");
  if (!year) return;
  const text = prompt("请输入历史事件描述:");
  if (!text) return;
  await db.from('history').insert([{ year, text }]);
  loadHistory();
}

async function addEvent() {
  const date = prompt("请输入日期 (如 2026.11.01):");
  if (!date) return;
  const title = prompt("请输入事件标题:");
  if (!title) return;
  const desc = prompt("请输入事件详细描述:");
  if (!desc) return;
  await db.from('events').insert([{ date, title, desc }]);
  loadEvents();
}

async function addMascot() {
  const name = prompt("请输入名字及编号 (如 7. 张三):");
  if (!name) return;
  const title = prompt("请输入专属外号 (如 睡觉大王):");
  if (!title) return;
  await db.from('mascots').insert([{ name, title }]);
  loadMascots();
}

async function addMember() {
  const name = prompt("请输入成员真实姓名:");
  if (!name) return;
  const role = prompt("请输入成员职位 (如 部长 / 摸鱼专员):");
  if (!role) return;
  const desc = prompt("请输入成员简介 (可选，直接回车默认'无'):") || '无';
  await db.from('members').insert([{ name, role, desc }]);
  loadMembers();
}

// ============ 8. 登录状态控制与页面限制 ============
async function refreshAuth() {
  const { data: { user } } = await db.auth.getUser();
  const authBtn = document.getElementById("authBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const vipContent = document.getElementById("vip-content");
  const loginPrompt = document.getElementById("login-prompt");
  const lockedContents = document.querySelectorAll('.locked-content');
  const realContents = document.querySelectorAll('.real-content');

  if (user) {
    authBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    if(vipContent) vipContent.style.display = "block";
    if(loginPrompt) loginPrompt.style.display = "none";

    lockedContents.forEach(el => el.style.display = 'none');
    realContents.forEach(el => el.style.display = 'block');

    const isSuper = (user.email === SUPER_ADMIN_EMAIL);
    const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).single();
    isAdmin = isSuper || profile?.role === 'admin';
  } else {
    authBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    if(vipContent) vipContent.style.display = "none";
    if(loginPrompt) loginPrompt.style.display = "block";

    lockedContents.forEach(el => el.style.display = 'block');
    realContents.forEach(el => el.style.display = 'none');

    isAdmin = false;
  }

  // 登录状态变化时，重新渲染所有动态板块（应用管理按钮）
  loadHistory();
  loadEvents();
  loadMascots();
  loadMembers();
}

db.auth.onAuthStateChange(() => refreshAuth());

document.getElementById("logoutBtn").onclick = async () => {
  if (confirm("确定要退出登录吗？")) {
    await db.auth.signOut();
    alert("已退出登录");
    location.hash = "#/";
    location.reload();
  }
};

document.getElementById("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const btn = e.target.querySelector("button");
  const errEl = document.getElementById("loginError");
  errEl.textContent = "";
  btn.disabled = true;
  try {
    let inputVal = document.getElementById("loginEmail").value.trim();
    let email = inputVal.includes("@") ? inputVal : inputVal + "@hjc.club";

    const { data, error } = await db.auth.signInWithPassword({
      email: email,
      password: document.getElementById("loginPassword").value,
    });
    if (error) throw error;
    location.hash = "#/";
  } catch (err) {
    errEl.textContent = err.message || "登录失败，请检查名字和密码";
  } finally {
    btn.disabled = false;
  }
});

document.getElementById("registerForm").addEventListener("submit", async e => {
  e.preventDefault();
  const btn = e.target.querySelector("button");
  const errEl = document.getElementById("registerError");
  errEl.textContent = "";
  btn.disabled = true;
  try {
    let inputVal = document.getElementById("registerEmail").value.trim();
    let email = inputVal.includes("@") ? inputVal : inputVal + "@hjc.club";

    const { error } = await db.auth.signUp({ email, password: document.getElementById("registerPassword").value });
    if (error) throw error;
    alert("注册成功，请登录");
    location.hash = "#/login";
  } catch (err) {
    errEl.textContent = err.message || "注册失败";
  } finally { btn.disabled = false; }
});

// ============ 9. 管理后台（含超级管理员保护） ============
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
  
  table.innerHTML = `
    <tr style="text-align:left;border-bottom:1px solid #eee">
      <th style="padding:8px">邮箱</th><th style="padding:8px">角色</th><th style="padding:8px">操作</th>
    </tr>
    ${(data || []).map(p => {
      const isTargetSuper = (p.email === SUPER_ADMIN_EMAIL);
      const roleDisplay = isTargetSuper ? `<span class="tag super-admin">👑 超级管理员</span>` : `<span class="tag">${p.role === "admin" ? t("roleAdmin") : t("roleMember")}</span>`;
      
      let btnHtml = `<button class="btn-small" data-id="${p.id}" data-role="${p.role}" data-email="${p.email}">
            ${p.role === "admin" ? t("demote") : t("promote")}
          </button>`;
      if (isTargetSuper) btnHtml = `<button class="btn-small" style="background:#ccc; cursor:not-allowed;" disabled>不可操作</button>`;

      return `<tr style="border-bottom:1px solid #f3f3f5">
        <td style="padding:8px">${p.email || ""}</td>
        <td style="padding:8px">${roleDisplay}</td>
        <td style="padding:8px">${btnHtml}</td>
      </tr>`;
    }).join("")}`;

  table.querySelectorAll("button[data-id]:not([disabled])").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (btn.dataset.email === SUPER_ADMIN_EMAIL) return alert("🚨 警告：无权修改超管！");
      const next = btn.dataset.role === "admin" ? "member" : "admin";
      await db.from("profiles").update({ role: next }).eq("id", btn.dataset.id);
      loadAdmin();
    });
  });
}

// ============ 10. 启动程序与弹窗逻辑 ============
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
      if (countdown > 0) { agreeBtn.textContent = `请阅读 (${countdown}s)`; } 
      else {
        clearInterval(timer);
        agreeBtn.textContent = "我已阅读并同意";
        agreeBtn.disabled = false;
        agreeBtn.style.background = "#7c3aed";
        agreeBtn.style.cursor = "pointer";
      }
    }, 1000);
    agreeBtn.addEventListener("click", () => {
      localStorage.setItem("hjc_disclaimer_agreed", "true");
      disclaimer.style.display = "none";
      playRandomSound();
    });
  }

  applyLang();
  navigate();
  
  await Promise.race([refreshAuth(), new Promise(resolve => setTimeout(resolve, 3000))]);

  setTimeout(() => {
    const loader = document.getElementById("loading-screen");
    if (loader) {
      loader.style.opacity = "0";
      setTimeout(() => {
        loader.style.display = "none";
        if (Math.random() < 0.1) triggerRickroll();
      }, 500);
    }
  }, 600);
}

function playRandomSound() {
  const randomFile = SOUND_LIST[Math.floor(Math.random() * SOUND_LIST.length)];
  new Audio(randomFile).play().catch(e => console.log("浏览器策略限制音效", e));
}

// ============ 11. Rickroll ============
function triggerRickroll() {
  const overlay = document.getElementById("rickroll-overlay");
  const iframe = document.getElementById("rickroll-video");
  if (overlay && iframe) {
    iframe.src = `https://player.bilibili.com/player.html?bvid=BV1GJ411x7h7&page=1&high_quality=1&danmaku=1&autoplay=1&t=${Date.now()}`;
    overlay.style.display = "flex";
  }
}

document.getElementById("closeRickroll").onclick = () => {
  document.getElementById("rickroll-overlay").style.display = "none";
  document.getElementById("rickroll-video").src = "about:blank";
};

document.getElementById("secretBtn").addEventListener("click", () => triggerRickroll());

// ============ 12. 其他弹窗 & 搜索 ============
function showCustomAlert(title, message, isSuccess = false) {
  if (!document.getElementById("custom-alert-overlay")) {
    const overlay = document.createElement("div");
    overlay.id = "custom-alert-overlay";
    overlay.innerHTML = `<div id="custom-alert-box"><h3 id="alert-title"></h3><p id="alert-msg"></p><button class="btn" id="alert-close-btn" style="width: 100%;">确定</button></div>`;
    document.body.appendChild(overlay);
    document.getElementById("alert-close-btn").onclick = () => {
      overlay.style.display = "none";
      document.body.classList.remove("shake-active");
    };
  }
  const overlay = document.getElementById("custom-alert-overlay");
  document.getElementById("alert-title").textContent = title;
  document.getElementById("alert-title").style.color = isSuccess ? "#10b981" : "#ef4444";
  document.getElementById("alert-msg").textContent = message;
  overlay.style.display = "flex";
}

document.getElementById("fortuneBtn").addEventListener("click", () => {
  const fortunes = ["今日宜：在楼梯间遇到睡精。", "大吉：今日谎言成功率 99%。", "小凶：建议今天不要点开链接。", "宜：逃课去操场数蚂蚁。", "大吉：你成功骗过了王盈。"];
  showCustomAlert("🔮 今日运势结果", fortunes[Math.floor(Math.random() * fortunes.length)], true);
});

document.getElementById("fakeDownloadBtn").addEventListener("click", (e) => {
  const btn = e.target;
  btn.disabled = true; btn.textContent = "正在下载...";
  let pc = btn.parentElement.querySelector(".fake-progress-container");
  if (!pc) {
    pc = document.createElement("div"); pc.className = "fake-progress-container"; pc.innerHTML = '<div class="fake-progress-bar"></div>';
    btn.parentElement.appendChild(pc);
  }
  const bar = pc.querySelector(".fake-progress-bar");
  pc.style.display = "block"; let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15; if (progress > 100) progress = 100;
    bar.style.width = progress + "%";
    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        btn.disabled = false; btn.textContent = "📥 下载入会申请表";
        pc.style.display = "none"; bar.style.width = "0%";
        showCustomAlert("⚠️ 下载失败", "哈哈，根本没有申请表！你被骗了！🤡");
      }, 500);
    }
  }, 200);
});

document.getElementById("lieDetectorBtn").addEventListener("click", () => {
  showCustomAlert("🩺 正在连接脑电波...", "请保持冷静...", true);
  setTimeout(() => {
    document.getElementById("alert-title").textContent = "🚨 警告：谎言检测失败！";
    document.getElementById("alert-title").style.color = "#ef4444";
    document.getElementById("alert-msg").textContent = "心率异常！你昨天绝对没有写作业！";
    document.body.classList.add("shake-active");
  }, 2000);
});

document.getElementById("searchInput").addEventListener("input", async (e) => {
  const q = e.target.value.trim().toLowerCase();
  const resultsEl = document.getElementById("searchResults");
  const emptyEl = document.getElementById("searchEmpty");
  resultsEl.innerHTML = ''; emptyEl.style.display = 'none';

  if (!q) return;

  let results = [];
  
  // 1. 搜索成员 (动态拉取)
  const { data: mData } = await db.from('members').select('*');
  if (mData) mData.forEach(m => { if(`${m.name} ${m.role} ${m.desc}`.toLowerCase().includes(q)) results.push({ type: "成员", text: `${m.name} - ${m.role}` }); });
  
  // 2. 搜索历史
  const { data: hData } = await db.from('history').select('*');
  if (hData) hData.forEach(h => { if(`${h.year} ${h.text}`.toLowerCase().includes(q)) results.push({ type: "历史", text: `${h.year} - ${h.text}` }); });

  // 3. 搜索事件
  const { data: eData } = await db.from('events').select('*');
  if (eData) eData.forEach(e => { if(`${e.date} ${e.title} ${e.desc}`.toLowerCase().includes(q)) results.push({ type: "事件", text: `${e.title} - ${e.desc}` }); });

  // 4. 搜索吉祥物
  const { data: mascotData } = await db.from('mascots').select('*');
  if (mascotData) mascotData.forEach(m => { if(`${m.name} ${m.title}`.toLowerCase().includes(q)) results.push({ type: "吉祥物", text: `${m.name} - ${m.title}` }); });

  if (results.length === 0) {
    emptyEl.style.display = 'block';
  } else {
    resultsEl.innerHTML = results.map(r => `<li><span class="tag">${r.type}</span>${r.text}</li>`).join('');
  }
});

initApp();