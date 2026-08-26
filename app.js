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

let auth, db, monthlyChartInstance;
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
      let data = doc.data();
      data.id = doc.id;
      notices.push(data);
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
  const newNotice = {
    title: title, content: content, tag: tagStr, tagColor: `${colorStr} text-white`,
    date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }), timestamp: Date.now()
  };
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
  if(!confirm("기본 공지를 복구하시겠습니까?")) return;
  const old1 = { title: "🛠️ 전적 데이터 연동 점검", content: "점검 중입니다.", tag: "점검중", tagColor: "bg-rose-600 text-white", date: "2026.08.19", timestamp: Date.now() - 1000 };
  await db.collection("notices").add(old1); alert("복구 완료!");
}

function renderDynamicNotices() {
  const container = document.getElementById('dynamicNoticeList');
  if (!container) return;
  container.innerHTML = '';
  if(notices.length === 0) {
    container.innerHTML = '<div class="text-center py-8 text-slate-500 text-sm">등록된 공지사항이 없습니다.</div>'; return;
  }
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
  if (tabId === 'tab-stats') renderStats();
  else if (tabId === 'tab-notice') renderDynamicNotices();
  else if (tabId === 'tab-input') renderDashboard();
}
