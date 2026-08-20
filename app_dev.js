if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW Failed:', err));
  });
}

const ADMIN_EMAILS = ["junhoodemian@gmail.com"];

const firebaseConfig = {
  apiKey: "AIzaSyCjS6vsVVnscjBZufjbMcZnhGFIvyQa8VY",
  authDomain: "test-7595b.firebaseapp.com",
  projectId: "test-7595b",
  storageBucket: "test-7595b.firebasestorage.app",
  messagingSenderId: "1066933910880",
  appId: "1:1066933910880:web:a1ddbcfb455e7507c73205"
};

let auth, db, radarChartInstance, monthlyChartInstance;
let currentUser = null;
let isAdmin = false;
let logs = [];
let notices = [];
let favoriteArcades = JSON.parse(localStorage.getItem('rhythm_fav_arcades') || '["삼보", "짱오락실"]');
let quickPresets = JSON.parse(localStorage.getItem('rhythm_quick_presets') || '[]');

try {
  firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore();
} catch(e) { console.warn("Firebase Init", e); }

if(db) {
  db.collection("notices").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
    notices = [];
    snapshot.forEach((doc) => {
      let data = doc.data(); data.id = doc.id; notices.push(data);
    });
    if(document.getElementById('tab-notice').classList.contains('active')) renderDynamicNotices();
  });
}

async function addNotice() {
  if(!isAdmin) return alert("관리자 권한이 없습니다.");
  const title = document.getElementById('noticeTitle').value.trim();
  const content = document.getElementById('noticeContent').value.trim();
  const tagValue = document.getElementById('noticeTag').value;
  const [tagStr, colorStr] = tagValue.split('|');
  if(!title || !content) return alert("제목과 내용을 모두 입력해주세요!");

  const newNotice = { title: title, content: content, tag: tagStr, tagColor: `${colorStr} text-white`, date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }), timestamp: Date.now() };
  try {
    await db.collection("notices").add(newNotice);
    document.getElementById('noticeTitle').value = ''; document.getElementById('noticeContent').value = '';
    alert("공지가 등록되었습니다.");
  } catch(e) { alert("공지 등록 오류"); }
}

async function deleteNotice(docId) {
  if(!isAdmin) return;
  if(confirm("이 공지를 삭제하시겠습니까?")) {
    try { await db.collection("notices").doc(docId).delete(); alert("삭제되었습니다."); } catch(e) { alert("삭제 실패"); }
  }
}

async function seedOldNotices() {
  if(!isAdmin) return;
  if(!confirm("이전에 등록했던 기본 공지를 DB에 복구하시겠습니까?")) return;
  const old1 = { title: "🛠️ 전적 데이터 연동 점검", content: "점검 중입니다.", tag: "점검중", tagColor: "bg-rose-600 text-white", date: "2026.08.19", timestamp: Date.now() - 1000 };
  await db.collection("notices").add(old1); alert("복구 완료!");
}

function renderDynamicNotices() {
  const container = document.getElementById('dynamicNoticeList');
  if (!container) return;
  container.innerHTML = '';
  if(notices.length === 0) { container.innerHTML = '<div class="text-center py-8 text-slate-500 text-sm">등록된 공지사항이 없습니다.</div>'; return; }
  notices.forEach(notice => {
    const card = document.createElement('article'); card.className = 'bg-slate-800 p-4 rounded-2xl shadow-lg border border-slate-700 space-y-2 relative';
    let deleteBtn = isAdmin ? `<button onclick="deleteNotice('${notice.id}')" class="absolute top-4 right-4 text-[10px] bg-rose-900/50 text-rose-400 px-2 py-1 rounded">삭제</button>` : '';
    card.innerHTML = `<div class="flex items-center justify-between pr-10"><div><span class="text-xs px-2 py-0.5 rounded-md font-semibold ${notice.tagColor}">${notice.tag}</span><span class="text-xs text-slate-400 font-mono ml-1.5">${notice.date}</span></div></div>${deleteBtn}<h2 class="font-bold text-slate-200 text-base mt-2">${notice.title}</h2><p class="text-xs text-slate-300 whitespace-pre-line leading-relaxed">${notice.content}</p>`;
    container.appendChild(card);
  });
}

if (auth) {
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      isAdmin = ADMIN_EMAILS.includes(user.email);
      document.getElementById('adminNoticeForm').classList.toggle('hidden', !isAdmin);
      document.getElementById('statusDot').className = "w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]";
      document.getElementById('userStatusText').textContent = `${user.displayName || '유저'}님 연동됨 ${isAdmin ? '👑' : ''}`;
      document.getElementById('btnLogin').classList.add('hidden'); document.getElementById('btnLogout').classList.remove('hidden');
      db.collection("users").doc(user.uid).collection("logs").orderBy("id", "desc").onSnapshot((snapshot) => {
        logs = []; snapshot.forEach((doc) => logs.push(doc.data())); renderDashboard();
        if(document.getElementById('tab-stats').classList.contains('active')) renderStats();
      });
    } else {
      currentUser = null; isAdmin = false;
      document.getElementById('adminNoticeForm').classList.add('hidden');
      document.getElementById('statusDot').className = "w-2.5 h-2.5 rounded-full bg-slate-500";
      document.getElementById('userStatusText').textContent = "로그인되지 않음";
      document.getElementById('btnLogin').classList.remove('hidden'); document.getElementById('btnLogout').classList.add('hidden');
      logs = JSON.parse(localStorage.getItem('rhythm_logs_v3') || '[]');
      renderDashboard();
      if(document.getElementById('tab-stats').classList.contains('active')) renderStats();
    }
    if(document.getElementById('tab-notice').classList.contains('active')) renderDynamicNotices();
    if(document.getElementById('tab-profile').classList.contains('active')) loadSdvxData();
  });
}

function loginWithGoogle() {
  if (!auth) return alert("Firebase 인증 준비 중입니다.");
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch((error) => alert("로그인 오류: " + error.message));
}
function logoutGoogle() { if (auth) auth.signOut(); }

function saveQuickPreset() {
  const game = document.getElementById('gameInput').value.trim();
  if(!game) return alert('게임 이름을 입력해주세요!');
  const arcade = document.getElementById('arcadeInput').value.trim() || '이름 모를 오락실';
  const unitPrice = parseInt(document.getElementById('priceInput').value || 0);
  const count = parseInt(document.getElementById('countInput').value || 1);
  quickPresets.push({ id: Date.now(), arcade, game, unitPrice, count });
  localStorage.setItem('rhythm_quick_presets', JSON.stringify(quickPresets));
  renderQuickPresets(); alert("저장되었습니다!");
}

function deleteQuickPreset(id) {
  quickPresets = quickPresets.filter(p => p.id !== id);
  localStorage.setItem('rhythm_quick_presets', JSON.stringify(quickPresets));
  renderQuickPresets();
}

async function quickAddLog(id) {
  const preset = quickPresets.find(p => p.id === id);
  if(!preset) return;
  const now = new Date();
  const log = {
    id: Date.now(), date: now.toISOString(), dateStr: now.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }),
    timeStr: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }), arcade: preset.arcade, game: preset.game,
    mode: '일반', unitPrice: preset.unitPrice, count: preset.count, totalCost: preset.unitPrice * preset.count
  };
  if (currentUser && db) await db.collection("users").doc(currentUser.uid).collection("logs").doc(String(log.id)).set(log);
  else { logs.unshift(log); localStorage.setItem('rhythm_logs_v3', JSON.stringify(logs)); renderDashboard(); }
  alert(`⚡ [${preset.game}] 기록 완료!`);
}

function renderQuickPresets() {
  const container = document.getElementById('quickPresetList');
  if(!container) return;
  container.innerHTML = '';
  if(quickPresets.length === 0) { container.innerHTML = '<div class="text-[11px] text-slate-500 py-1">등록된 내역이 없습니다.</div>'; return; }
  quickPresets.forEach(preset => {
    const card = document.createElement('div'); card.className = 'flex items-center justify-between bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-xs gap-2';
    card.innerHTML = `<div class="flex-1 min-w-0"><div class="font-bold text-slate-200">${preset.game}</div><div class="text-[10px] text-slate-400 mt-0.5"><span class="text-indigo-300 font-medium">${preset.arcade}</span> · ${preset.unitPrice.toLocaleString()}원 (${preset.count}판)</div></div><div class="flex items-center gap-1.5 shrink-0"><button onclick="quickAddLog(${preset.id})" class="bg-indigo-600 px-3 py-1.5 rounded-lg text-white font-bold">⚡ 기록</button><button onclick="deleteQuickPreset(${preset.id})" class="text-slate-500 font-bold text-sm">×</button></div>`;
    container.appendChild(card);
  });
}

function toggleTimeInput() {
  const isUnknown = document.getElementById('unknownTime').checked;
  const dtInput = document.getElementById('customDatetime'); const dInput = document.getElementById('customDate');
  if (isUnknown) {
    dtInput.classList.add('hidden'); dtInput.classList.remove('block'); dInput.classList.remove('hidden'); dInput.classList.add('block');
    dInput.value = dtInput.value.split('T')[0] || new Date().toISOString().split('T')[0];
  } else {
    dtInput.classList.remove('hidden'); dtInput.classList.add('block'); dInput.classList.add('hidden'); dInput.classList.remove('block');
    if(dInput.value) dtInput.value = dInput.value + 'T' + new Date().toTimeString().slice(0,5);
  }
}

function resetDatetimeInput() {
  const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('customDatetime').value = now.toISOString().slice(0, 16); document.getElementById('customDate').value = now.toISOString().split('T')[0];
  document.getElementById('unknownTime').checked = false; toggleTimeInput();
}
resetDatetimeInput();

function setPrice(amount) { document.getElementById('priceInput').value = amount; }
function changeCount(val) { const input = document.getElementById('countInput'); const next = parseInt(input.value || 1) + val; if (next >= 1) input.value = next; }

function renderFavoriteArcades() {
  const container = document.getElementById('favoriteArcadeList'); container.innerHTML = '';
  favoriteArcades.forEach(arc => {
    const chip = document.createElement('div'); chip.className = 'flex items-center bg-slate-700/80 text-slate-200 text-xs px-2.5 py-1 rounded-lg cursor-pointer';
    chip.innerHTML = `<span onclick="selectArcade('${arc}')" class="font-medium mr-1.5">📍 ${arc}</span><span onclick="removeFavoriteArcade('${arc}')" class="text-slate-400 font-bold">×</span>`;
    container.appendChild(chip);
  });
}
function selectArcade(name) { document.getElementById('arcadeInput').value = name; }
function saveFavoriteArcade() {
  const name = document.getElementById('arcadeInput').value.trim();
  if (name && !favoriteArcades.includes(name)) { favoriteArcades.push(name); localStorage.setItem('rhythm_fav_arcades', JSON.stringify(favoriteArcades)); renderFavoriteArcades(); }
}
function removeFavoriteArcade(name) { favoriteArcades = favoriteArcades.filter(a => a !== name); localStorage.setItem('rhythm_fav_arcades', JSON.stringify(favoriteArcades)); renderFavoriteArcades(); }
renderFavoriteArcades(); renderQuickPresets();

async function addLog() {
  const isUnknown = document.getElementById('unknownTime').checked; let targetDate, timeStrVal;
  const gameInputVal = document.getElementById('gameInput').value.trim();
  if (!gameInputVal) return alert("플레이 게임 입력!");
  if (isUnknown) { targetDate = new Date((document.getElementById('customDate').value || new Date().toISOString().split('T')[0]) + 'T00:00:00'); timeStrVal = '시간 모름'; } 
  else { targetDate = new Date(document.getElementById('customDatetime').value || new Date()); timeStrVal = targetDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }); }
  const log = { id: Date.now(), date: targetDate.toISOString(), dateStr: targetDate.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }), timeStr: timeStrVal, arcade: document.getElementById('arcadeInput').value.trim() || '이름 모를 오락실', game: gameInputVal, mode: '일반', unitPrice: parseInt(document.getElementById('priceInput').value || 0), count: parseInt(document.getElementById('countInput').value || 1) };
  log.totalCost = log.unitPrice * log.count;
  if (currentUser && db) await db.collection("users").doc(currentUser.uid).collection("logs").doc(String(log.id)).set(log);
  else { logs.unshift(log); localStorage.setItem('rhythm_logs_v3', JSON.stringify(logs)); renderDashboard(); }
  document.getElementById('countInput').value = 1; document.getElementById('gameInput').value = ''; resetDatetimeInput(); alert('기록 완료!');
}

async function deleteLog(id) {
  if(confirm('삭제할까요?')) {
    if (currentUser && db) await db.collection("users").doc(currentUser.uid).collection("logs").doc(String(id)).delete();
    else { logs = logs.filter(l => l.id !== id); localStorage.setItem('rhythm_logs_v3', JSON.stringify(logs)); renderDashboard(); renderStats(); }
  }
}

function renderDashboard() {
  const todayStr = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  let todayCost = 0, todayCount = 0;
  logs.forEach(log => { if (log.dateStr === todayStr) { todayCost += log.totalCost; todayCount += log.count; } });
  document.getElementById('todayCost').textContent = `${todayCost.toLocaleString()}원`; document.getElementById('todayCount').textContent = `${todayCount}판`;
}

function renderStats() {
  const listEl = document.getElementById('fullLogList'); listEl.innerHTML = '';
  const now = new Date(); const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  let thisMonthTotal = 0;
  if (logs.length === 0) { listEl.innerHTML = '<div class="text-center py-8 text-slate-500">기록 없음</div>'; document.getElementById('thisMonthTotalCost').textContent = '0원'; if(monthlyChartInstance) monthlyChartInstance.destroy(); return; }
  const monthlyCosts = {};
  logs.forEach(log => { const mk = log.date.substring(0, 7); monthlyCosts[mk] = (monthlyCosts[mk] || 0) + log.totalCost; if (mk === currentMonthStr) thisMonthTotal += log.totalCost; });
  document.getElementById('thisMonthTotalCost').textContent = `${thisMonthTotal.toLocaleString()}원`;
  const sortedMonths = Object.keys(monthlyCosts).sort();
  const ctx = document.getElementById('monthlyChart').getContext('2d');
  if (monthlyChartInstance) monthlyChartInstance.destroy();
  monthlyChartInstance = new Chart(ctx, { type: 'bar', data: { labels: sortedMonths, datasets: [{ data: sortedMonths.map(m => monthlyCosts[m]), backgroundColor: '#4f46e5', borderRadius: 6 }] }, options: { plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#94a3b8' } }, x: { ticks: { color: '#cbd5e1' } } } } });
  logs.forEach(log => {
    const card = document.createElement('div'); card.className = 'bg-slate-900 border border-slate-700/60 p-3 rounded-xl flex justify-between items-center';
    let tDisp = log.timeStr && log.timeStr !== '시간 모름' ? `<span class="text-[10px] text-slate-500 ml-1">${log.timeStr}</span>` : '';
    card.innerHTML = `<div class="w-full"><div class="flex justify-between items-center mb-1"><span class="text-xs text-slate-400">${log.dateStr}${tDisp} <b class="text-indigo-300 ml-1">${log.arcade}</b></span><button onclick="deleteLog(${log.id})" class="text-slate-500 text-xs px-2 py-1 rounded bg-slate-800">삭제</button></div><div class="flex justify-between items-end mt-2"><div><span class="font-bold text-sm text-slate-200">${log.game}</span></div><div class="text-right"><span class="text-xs text-slate-400 mr-2">${log.count}판</span><span class="font-bold text-rose-400 text-sm">${log.totalCost.toLocaleString()}원</span></div></div></div>`;
    listEl.appendChild(card);
  });
}

function exportData() {
  if(logs.length === 0) return alert("데이터 없음");
  const url = URL.createObjectURL(new Blob([JSON.stringify({ logs }, null, 2)], { type: "application/json" }));
  const a = document.createElement('a'); a.href = url; a.download = `backup_${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0]; if (!file) return; const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const imp = JSON.parse(e.target.result);
      if(imp.logs && Array.isArray(imp.logs)) {
        if (currentUser && db) { for (const item of imp.logs) await db.collection("users").doc(currentUser.uid).collection("logs").doc(String(item.id)).set(item); }
        else { logs = [...imp.logs, ...logs]; localStorage.setItem('rhythm_logs_v3', JSON.stringify(logs)); renderDashboard(); }
        alert("복구 완료");
      }
    } catch (err) { alert("파일 오류"); }
  };
  reader.readAsText(file); event.target.value = '';
}

function clearAllLogs() {
  if (confirm('🚨 모든 데이터를 정말 삭제하시겠습니까?')) {
    if (currentUser && db) logs.forEach(l => db.collection("users").doc(currentUser.uid).collection("logs").doc(String(l.id)).delete());
    else { logs = []; localStorage.removeItem('rhythm_logs_v3'); renderDashboard(); }
    localStorage.removeItem('sdvx_data'); alert("초기화 됨"); location.reload();
  }
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active')); document.getElementById(tabId).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(btn => { btn.classList.remove('text-indigo-400'); btn.classList.add('text-slate-500'); });
  document.getElementById('btn-' + tabId).classList.add('text-indigo-400'); document.getElementById('btn-' + tabId).classList.remove('text-slate-500');
  if (tabId === 'tab-profile') loadSdvxData();
  else if (tabId === 'tab-stats') renderStats();
  else if (tabId === 'tab-notice') renderDynamicNotices();
  else if (tabId === 'tab-input') renderDashboard();
}

const SONG_DB = {
  "Who then no 灯_MXM": 19.7, "XELENOPHOEBEA_MXM": 19.5, "DANGER XLOZE_MXM": 19.4, "Ardenok_MXM": 19.4, "Titanomachia_MXM": 19.3,
  "神罰_MXM": 19.3, "華麗なる一撃_MXM": 19.2, "Zt!ri△_MXM": 19.5, "Quaint Echo_EXH": 18.8, "ミスクレイジースピード_MXM": 18.7,
  "ΕΛΠΙΣ_XCD": 19.2, "Xinca_MXM": 19.2, "Legendary Road_MXM": 18.8, "大宇宙ステージ_GRV": 19.2, "Sailing Force_MXM": 19.2,
  "Zany Arcadia \"E\"_MXM": 19.1, "神凪_EXH": 18.8, "準備運動_MXM": 18.8, "Innocent Azure_MXM": 18.0, "Distorted Floor -Boosted-_MXM": 18.0,
  "SuddeИDeath_EXH": 19.1, "Staring at star_MXM": 19.1, "I V A Z I L I S Q_MXM": 19.1, "BEMANI PRO LEAGUE -SEASON 2-_MXM": 19.0, "Macuilxochitl (Latin Jazz Mix)_MXM": 18.7,
  "Sayonara Planet Wars_EXH": 18.6, "L (SDVX ver.)_MXM": 18.6, "MeteorGlow Aftermath_MXM": 18.6, "WHITEOUT_MXM": 20.2, "オムニシエント・ゼロ_MXM": 19.4,
  "Immortal saga_MXM": 19.0, "FIN4LE ～終止線の彼方へ～_EXH": 18.7, "Almandite_MXM": 18.6, "MAYHEM_MXM": 20.0, "大宇宙ステージ奈落変_MXM": 18.6,
  "KINGDOM COME_EXH": 18.6, "火狐之舞_MXM": 18.5, "To:BrandNewDeadline_MXM": 18.5, "Astra Blaze_MXM": 18.5, "APØCALYPSE RAY_EXH": 18.5,
  "Fegrix_MXM": 18.5, "Across the Starlight_MXM": 18.5, "アイの雫_MXM": 18.5, "ULTIMATE INFLATION_MXM": 18.5, "Vividly Impromptu_MXM": 18.5,
  "随神_MXM": 18.5, "Bl∞min'_EXH": 18.5, "Everlasting Message_GRV": 19.3, "trea→journey_MXM": 18.9, "PHOTON BLAXT_MXM": 18.4,
  "サイハテ_MXM": 20.5, "サイハテ_EXH": 18.4, "覚帝神刻_EXH": 18.1, "Sakura Eyelen_MXM": 18.4, "Stellar Pilgrim_MXM": 18.6,
  "VIIIΧ_MXM": 18.5, "Raise the flag of victory!_MXM": 19.5, "ZILLION RAY_MXM": 17.0, "Faith of Frenzy_MXM": 18.5, "Little Prana_MXM": 18.2,
  "Melted Energy_MXM": 18.7, "ユニゾンなデイズ♪_MXM": 17.5, "Esperanza_MXM": 18.6, "Any％_MXM": 19.3, "Secret Raid_MXM": 18.4,
  "Smintheus_MXM": 19.5, "단罪のミメシス_MXM": 19.6, "ちくたく2ちく2ぱ_MXM": 18.6, "It's All Right_MXM": 17.0, "Dement ~After Legend~_MXM": 18.5,
  "Vanishment for reconstruction_MXM": 19.6, "Leflector_MXM": 19.4, "Smile & Go!!_MXM": 18.6, "Excelsia_MXM": 19.6, "cyanotype_MXM": 19.5,
  "G.L.I.T.C.H._MXM": 19.3, "ASTRL GG_MXM": 19.7, "COLOR BURST_MXM": 18.7, "KISKIL-LILLA_MXM": 20.5, "KISKIL-LILLA_EXH": 18.8,
  "King of Tribe_MXM": 19.2, "GO!_MXM": 19.2, "Thunderstorm_MXM": 19.5, "No→to_MXM": 19.5, "Meteor☆Shower_MXM": 19.3,
  "RIZING-GAMERS._MXM": 19.5, "Roar of Chronos_MXM": 19.4, "Dot to Dot_MXM": 19.4, "Circumzenith Arc_MXM": 19.7, "Down with your Love_MXM": 19.3,
  "えんじぇる☆てすと！_MXM": 18.5, "ShowDawn_MXM": 18.8, "Pick up, Me!_MXM": 18.8, "Anti-Matter_MXM": 19.6, "Glitch N Ride_EXH": 18.6,
  "9th Outburst_MXM": 19.6, "Votum stellarum -forest #25 RMX-_MXM": 18.9, "天鯨譚_MXM": 19.5, "Plan 8_MXM": 19.2, "CAKE,Cake'n Cake!_MXM": 18.5,
  "Blue Diamond_MXM": 19.6, "Blue Diamond_EXH": 18.5, "ИEXTAGE_MXM": 19.6, "L2 -Reminiscence- (SDVX ver.)_MXM": 19.4, "お返事まだカナ？おじさん構文！_MXM": 18.7,
  "Synthesis._MXM": 19.5, "snooze_MXM": 18.5, "777 (Vocal ver.)_EXH": 18.3, "Celestial Conquest_MXM": 19.8, "デッドライン症候群_MXM": 18.7,
  "Help me, ERINNNNNN!!_MXM": 18.6, "ンポロロッカ_MXM": 19.8, "双星の冒険録_MXM": 19.3, "天泣_MXM": 19.5, "Blessed Horizon_MXM": 19.4,
  "FLOOD_FLOOR_MXM": 19.6, "ハートビート×スラッガー_MXM": 18.6, "FLAVOR-G_MXM": 18.7, "カジノファイヤーことみちゃん_MXM": 18.6, "Shooting Star_MXM": 18.6,
  "オーバーライド_MXM": 18.6, "Timepiece phase Ⅱ_MXM": 19.5, "ライアーダンサー_MXM": 18.8, "// If Summer Ever Comes__MXM": 19.8, "// If Summer Ever Comes__EXH": 18.5,
  "ØVER《Δ》_MXM": 19.9, "XHRONOXAPSULΞ_MXM": 20.0, "Initiating League_MXM": 18.5, "最強女神†ウーサペコラ_MXM": 18.5, "perditus†paradisus_MXM": 19.8,
  "Black night_MXM": 18.5, "KINGWORLD_MXM": 18.5
};

window.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'SDVX_PARSE_DATA') {
    if(window._dataProcessed) return;
    window._dataProcessed = true;
    
    const rawData = event.data.payload;
    let parsedSongs = [];

    rawData.forEach(song => {
      let dbKey = `${song.title}_${song.diff}`;
      let level = SONG_DB[dbKey] || 18.0; 

      const gradeFactor = { 'S': 1.05, 'AAA+': 1.02, 'AAA': 1.00, 'AA+': 0.97, 'AA': 0.94, 'A+': 0.91, 'A': 0.88, 'B': 0.85, 'C': 0.82, 'D': 0.80 }[song.grade] || 0.80;
      let clearFactor = 0.5;
      if (song.lamp === 'PUC') clearFactor = 1.10;
      else if (song.lamp === 'UC') clearFactor = 1.05;
      else if (song.lamp === 'MXV' || song.lamp === 'EXC') clearFactor = 1.02;
      else if (song.lamp === 'COMP') clearFactor = 1.00;
      
      let vfBase = Math.floor(level * 20 * (song.score / 10000000) * gradeFactor * clearFactor);
      
      parsedSongs.push({
        title: song.title, level: `${song.diff} ${level.toFixed(1)}`, lamp: song.lamp, score: song.score, vfBase: vfBase, vf: (vfBase / 10).toFixed(3), jacket: 'https://via.placeholder.com/60/1e293b/94a3b8?text=Img'
      });
    });

    parsedSongs.sort((a,b) => b.vfBase - a.vfBase || b.score - a.score);
    let top50 = parsedSongs.slice(0, 50);
    let totalVfBase = top50.reduce((sum, s) => sum + s.vfBase, 0);
    let volforce = (totalVfBase / 1000).toFixed(3);

    let localData = localStorage.getItem('sdvx_data');
    let d = localData ? JSON.parse(localData) : { nickname: 'PLAYER', svId: 'SV-0000-0000' };
    
    d.volforce = parseFloat(volforce); d.vf50 = top50; d.lastUpdated = new Date().toISOString();
    let radarBase = Math.floor(d.volforce * 8);
    if(radarBase > 200) radarBase = 200;
    d.radar = [radarBase, radarBase-5, radarBase+10, radarBase-10, radarBase+5, radarBase];
    
    await saveSdvxData(d);
    alert("🎉 DEV 서버: 전적이 갱신되었습니다!\n(VOLFORCE: " + volforce + ")");
  }
});

function getLampColor(lamp) {
  if(lamp === 'PUC' || lamp === 'MXV' || lamp === 'EXC') return 'text-yellow-400';
  if(lamp === 'UC') return 'text-rose-400';
  return 'text-emerald-400';
}

async function loadSdvxData() {
  if (!currentUser) {
    const localData = localStorage.getItem('sdvx_data');
    if (localData) applySdvxUI(JSON.parse(localData));
    else showEmptyState();
    return;
  }
  try {
    const doc = await db.collection("users").doc(currentUser.uid).collection("profile").doc("sdvx").get();
    if (doc.exists) { applySdvxUI(doc.data()); localStorage.setItem('sdvx_data', JSON.stringify(doc.data())); } 
    else {
      const localData = localStorage.getItem('sdvx_data');
      if (localData) { const data = JSON.parse(localData); await saveSdvxData(data); applySdvxUI(data); } 
      else showEmptyState();
    }
  } catch (e) {
    const localData = localStorage.getItem('sdvx_data'); if (localData) applySdvxUI(JSON.parse(localData));
  }
}

async function saveSdvxData(data) {
  localStorage.setItem('sdvx_data', JSON.stringify(data));
  if (currentUser && db) await db.collection("users").doc(currentUser.uid).collection("profile").doc("sdvx").set(data);
  applySdvxUI(data);
}

function showEmptyState() {
  document.getElementById('sdvxEmptyState').classList.remove('hidden');
  document.getElementById('sdvxProfileState').classList.add('hidden');
}

function applySdvxUI(data) {
  document.getElementById('sdvxEmptyState').classList.add('hidden');
  document.getElementById('sdvxProfileState').classList.remove('hidden');
  document.getElementById('sdvxNickname').textContent = data.nickname;
  document.getElementById('sdvxId').textContent = data.svId;
  document.getElementById('sdvxVolforce').textContent = parseFloat(data.volforce).toFixed(3);
  const lastUp = new Date(data.lastUpdated);
  const dateString = `${lastUp.toLocaleDateString()} ${lastUp.toLocaleTimeString()}`;
  document.getElementById('sdvxLastUpdate').textContent = `LAST MODIFIED: ${dateString}`;
  document.getElementById('expName').textContent = data.nickname;
  document.getElementById('expId').textContent = data.svId;
  document.getElementById('expVolforce').textContent = parseFloat(data.volforce).toFixed(3);
  document.getElementById('expDate').textContent = dateString;
  renderRadarChart(data.radar);
  renderVF50(data.vf50);
}

function renderRadarChart(radarData) {
  const ctx = document.getElementById('sdvxRadarChart').getContext('2d');
  if(radarChartInstance) radarChartInstance.destroy();
  Chart.defaults.font.family = 'sans-serif';
  Chart.defaults.color = '#94a3b8';
  radarChartInstance = new Chart(ctx, {
    type: 'radar',
    data: { labels: ['NOTES', 'PEAK', 'TSUMAMI', 'TRICKY', 'HAND-TRIP', 'ONE-HAND'], datasets: [{ data: radarData, backgroundColor: 'rgba(217, 70, 239, 0.4)', borderColor: '#d946ef', borderWidth: 2 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { r: { angleLines: { color: 'rgba(255,255,255,0.1)' }, grid: { color: 'rgba(255,255,255,0.1)' }, pointLabels: { font: { size: 10, weight: 'bold' } }, ticks: { display: false, max: 200 } } } }
  });
}

function renderVF50(vf50Array) {
  const mobileEl = document.getElementById('vf50MobileList');
  const exportEl = document.getElementById('expGrid');
  mobileEl.innerHTML = ''; exportEl.innerHTML = '';
  
  vf50Array.forEach((song, index) => {
    const lampColor = getLampColor(song.lamp);
    const jacketUrl = song.jacket || 'https://via.placeholder.com/60/1e293b/94a3b8?text=Img';

    const mItem = document.createElement('div');
    mItem.className = 'bg-slate-900 border border-slate-700 p-1.5 rounded-lg flex items-center gap-2';
    mItem.innerHTML = `<img src="${jacketUrl}" class="w-10 h-10 rounded object-cover border border-slate-700 shrink-0"><div class="flex-1 min-w-0"><div class="flex justify-between items-end"><span class="text-xs font-black text-slate-100">${song.vf}</span><span class="text-[8px] text-indigo-400 font-bold bg-indigo-900/40 px-1 rounded">#${index + 1}</span></div><div class="text-[9px] text-slate-400 truncate mt-0.5 mb-0.5">${song.title}</div><div class="flex justify-between items-center text-[8px] font-bold"><span class="text-slate-300 bg-slate-800 px-1 rounded">${song.level}</span><span class="${lampColor}">${song.lamp}</span></div></div>`;
    mobileEl.appendChild(mItem);

    const eItem = document.createElement('div');
    eItem.className = 'bg-slate-800/80 border border-slate-700/80 p-3 rounded-lg flex items-center gap-3 relative';
    eItem.innerHTML = `<img src="${jacketUrl}" class="w-14 h-14 bg-slate-950 border border-slate-700 rounded object-cover shrink-0"><div class="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5"><div class="flex justify-between items-end"><span class="text-3xl font-black text-slate-100 leading-none">${song.vf}</span><span class="text-xs text-indigo-400 font-bold tracking-wider">Rank #${index + 1}</span></div><div class="flex items-center gap-2 mt-1.5"><span class="text-xs font-bold text-slate-300 bg-slate-900 border border-slate-700 px-1.5 rounded">${song.level}</span><span class="text-xs font-bold ${lampColor}">${song.lamp}</span><span class="text-xs font-mono text-slate-300 ml-auto tracking-tight">${song.score.toLocaleString()}</span></div><div class="text-sm text-slate-400 truncate mt-1 font-medium border-t border-slate-700/50 pt-1">${song.title}</div></div>`;
    exportEl.appendChild(eItem);
  });
}

function toggleVF50() {
  const container = document.getElementById('vf50Container');
  const chevron = document.getElementById('vf50Chevron');
  container.classList.toggle('hidden');
  chevron.style.transform = container.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
}

function copyBookmarklet() {
  const code = document.getElementById('bookmarkletCode').textContent.trim();
  navigator.clipboard.writeText(code).then(() => alert("데이터 갱신용 코드가 복사되었습니다!\n사볼 홈페이지 주소창에 붙여넣어 실행해보세요."));
}

function saveVF50Image() {
  const target = document.getElementById('exportScorecard');
  alert("성적표 이미지를 생성 중입니다.");
  html2canvas(target, { backgroundColor: '#0f172a', scale: 2, logging: false }).then(canvas => {
    const link = document.createElement('a');
    link.download = `VF_TARGET_DEV_${new Date().toISOString().slice(0,10)}.png`;
    link.href = canvas.toDataURL('image/png'); link.click();
  }).catch(err => alert('이미지 캡처 실패'));
}
// ==========================================
// SDVX 볼포스 계산 및 베딕트 렌더링 모듈
// ==========================================

let sdvxDatabase = null;

// 1. sdvx_db.json 데이터베이스 비동기 로드
async function loadSdvxDB() {
  if (sdvxDatabase) return sdvxDatabase;
  try {
    const res = await fetch('./sdvx_db.json');
    if (!res.ok) throw new Error("DB 로드 실패");
    sdvxDatabase = await res.json();
    console.log("✅ SDVX DB 로드 완료:", Object.keys(sdvxDatabase).length, "곡");
    return sdvxDatabase;
  } catch (err) {
    console.error("⚠️ sdvx_db.json을 불러올 수 없습니다:", err);
    return null;
  }
}

// 2. 단일 차보 볼포스(Volforce) 정밀 계산식
function calculateSingleVolforce(level, score) {
  if (!level || !score || score < 7000000) return 0;

  // 점수별 등급 배수
  let gradeMult = 0.8;
  if (score >= 9900000) gradeMult = 1.05;      // S
  else if (score >= 9800000) gradeMult = 1.02; // AAA+
  else if (score >= 9700000) gradeMult = 1.00; // AAA
  else if (score >= 9500000) gradeMult = 0.97; // AA+
  else if (score >= 9300000) gradeMult = 0.94; // AA
  else if (score >= 9000000) gradeMult = 0.91; // A+
  else if (score >= 8700000) gradeMult = 0.88; // A
  else if (score >= 7500000) gradeMult = 0.85; // B

  // 클리어 메달 배수 (일반 클리어 기준 1.00, PUC/UC시 소폭 상승)
  let clearMult = 1.00;
  if (score === 10000000) clearMult = 1.10; // PUC
  else if (score >= 9900000) clearMult = 1.02; // UC 추정 안전 배수

  // 공식 계산: (상수 * 2) * (점수 / 1000만) * 등급계수 * 클리어계수
  const vf = (level * 2) * (score / 10000000) * gradeMult * clearMult;
  return Math.floor(vf * 10) / 10; // 소수점 한 자리 버림 계산
}

// 3. 볼포스 총합에 따른 티어 계산
function getVolforceTier(totalVf) {
  if (totalVf >= 20.0) return { name: "IMPERIAL (임페리얼)", color: "text-rose-400" };
  if (totalVf >= 19.0) return { name: "CRIMSON (크림슨)", color: "text-red-500" };
  if (totalVf >= 18.0) return { name: "SCARLET (스칼렛)", color: "text-amber-500" };
  if (totalVf >= 17.0) return { name: "CORAL (코랄)", color: "text-pink-400" };
  if (totalVf >= 16.0) return { name: "ARGENTO (아르젠토)", color: "text-slate-300" };
  if (totalVf >= 15.0) return { name: "ELDORA (엘ドラ)", color: "text-yellow-400" };
  if (totalVf >= 14.0) return { name: "VOLTE (볼테)", color: "text-cyan-400" };
  return { name: "SIENNA (시에나)", color: "text-amber-700" };
}

// 4. 모달 열기/닫기
function openSdvxModal() {
  document.getElementById('sdvxModal').classList.remove('hidden');
}
function closeSdvxModal() {
  document.getElementById('sdvxModal').classList.add('hidden');
}

// 5. 성적 데이터 분석 및 TOP 50 렌더링
async function processSdvxScores() {
  const rawInput = document.getElementById('sdvxRawInput').value.trim();
  if (!rawInput) {
    alert("데이터를 붙여넣어 주세요!");
    return;
  }

  let scores = [];
  try {
    scores = JSON.parse(rawInput);
    if (!Array.isArray(scores)) throw new Error();
  } catch (e) {
    alert("올바른 JSON 데이터 형식이 아닙니다. 스크래퍼(scraper.js)에서 복사한 내용을 그대로 붙여넣어 주세요.");
    return;
  }

  const db = await loadSdvxDB();
  if (!db) {
    alert("sdvx_db.json 파일을 불러오지 못했습니다. 파일 위치를 확인해 주세요.");
    return;
  }

  // 데이터 매칭 및 볼포스 산출
  let calculatedList = [];

  scores.forEach(item => {
    const songInfo = db[item.title];
    const diff = item.diff || "EXH";
    let level = 0;
    let songId = "0000";

    if (songInfo) {
      songId = songInfo.id || "0000";
      // 난이도 매칭 (NOV, ADV, EXH, MXM, INF/GRV/HVN/VVD/XCD)
      level = songInfo.levels[diff] || songInfo.levels["MXM"] || songInfo.levels["EXH"] || 0;
    } else {
      // 신곡이라 DB에 없을 경우 기본값 세팅 (Fallback)
      level = 17.0;
    }

    const vf = calculateSingleVolforce(level, item.score);

    calculatedList.push({
      title: item.title,
      diff: diff,
      score: item.score,
      level: level,
      vf: vf,
      id: songId
    });
  });

  // 볼포스 높은 순서대로 내림차순 정렬 후 TOP 50 추출
  calculatedList.sort((a, b) => b.vf - a.vf);
  const top50 = calculatedList.slice(0, 50);

  // 총 볼포스 합산
  const totalVf = top50.reduce((acc, cur) => acc + cur.vf, 0);

  // 대시보드 UI 업데이트
  document.getElementById('vfSummaryCard').classList.remove('hidden');
  document.getElementById('totalVfDisplay').textContent = totalVf.toFixed(3);
  
  const tier = getVolforceTier(totalVf);
  const tierEl = document.getElementById('tierDisplay');
  tierEl.textContent = tier.name;
  tierEl.className = `text-xl sm:text-2xl font-black mt-1 ${tier.color}`;

  // TOP 50 리스트 렌더링
  const grid = document.getElementById('top50Grid');
  grid.innerHTML = top50.map((song, idx) => {
    // 난이도별 색상 뱃지
    let diffBadgeColor = "bg-red-500 text-white";
    if (song.diff === "NOV") diffBadgeColor = "bg-blue-500 text-white";
    else if (song.diff === "ADV") diffBadgeColor = "bg-yellow-500 text-slate-900";
    else if (song.diff === "EXH") diffBadgeColor = "bg-red-600 text-white";
    else if (song.diff === "MXM") diffBadgeColor = "bg-slate-100 text-slate-900";
    else diffBadgeColor = "bg-fuchsia-600 text-white"; // 특수 난이도

    return `
      <div class="flex items-center gap-3.5 p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/70 hover:border-fuchsia-500/50 transition shadow-sm">
        <span class="text-sm font-black text-slate-500 w-6 text-center">#${idx + 1}</span>
        
        <!-- 자켓 플레이스홀더 (ID 기반) -->
        <div class="w-14 h-14 bg-slate-800 rounded-lg flex-shrink-0 flex items-center justify-center border border-slate-700 overflow-hidden relative">
          <span class="text-[10px] font-bold text-slate-500">${song.id}</span>
        </div>

        <div class="flex-grow min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="px-1.5 py-0.5 text-[10px] font-black rounded ${diffBadgeColor}">${song.diff} ${song.level}</span>
            <h4 class="text-sm font-bold text-slate-100 truncate">${song.title}</h4>
          </div>
          <div class="flex justify-between items-center text-xs text-slate-400">
            <span class="font-mono">${song.score.toLocaleString()}</span>
            <span class="font-bold text-fuchsia-400">VF ${song.vf.toFixed(1)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  closeSdvxModal();
}
