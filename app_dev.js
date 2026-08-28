// ==========================================
// SDVX 볼포스 정밀 계산 및 VF50 렌더링 모듈
// ==========================================

let sdvxDatabase = null;

// 1. sdvx_db.json 비동기 로드
async function loadSdvxDB() {
  if (sdvxDatabase) return sdvxDatabase;
  try {
    const res = await fetch('./sdvx_db.json');
    if (!res.ok) throw new Error("DB 로드 실패");
    sdvxDatabase = await res.json();
    return sdvxDatabase;
  } catch (err) {
    console.error("⚠️ sdvx_db.json 로드 실패:", err);
    return null;
  }
}

// 2. VF50 공식 규격 볼포스 계산식 (BEMANIWiki 및 EXCEED GEAR 공식 규격)
function calculateSingleVolforce(level, score, lamp) {
  if (level === null || !score || score < 7000000) return 0;

  // 점수 등급 계수 (Grade Multiplier)
  let gradeMult = 0.80;
  if (score >= 9900000) gradeMult = 1.05;      // S
  else if (score >= 9800000) gradeMult = 1.02; // AAA+
  else if (score >= 9700000) gradeMult = 1.00; // AAA
  else if (score >= 9500000) gradeMult = 0.97; // AA+
  else if (score >= 9300000) gradeMult = 0.94; // AA
  else if (score >= 9000000) gradeMult = 0.91; // A+
  else if (score >= 8700000) gradeMult = 0.88; // A
  else if (score >= 7500000) gradeMult = 0.85; // B
  else if (score >= 6500000) gradeMult = 0.82; // C

  // 클리어 계수 (Clear Multiplier) - Exceed Gear 공식 배율
  let clearMult = 1.00;
  if (lamp === "PUC") clearMult = 1.10;
  else if (lamp === "UC") clearMult = 1.05; // EXCEED GEAR 공식: UC = 1.05
  else if (lamp === "MXV" || lamp === "EX-HARD") clearMult = 1.04;
  else if (lamp === "HARD" || lamp === "EXC" || lamp === "COMP") clearMult = 1.02; // Excessive Clear = 1.02
  else if (lamp === "CLEAR") clearMult = 1.00;
  else if (lamp === "PLAYED" || lamp === "PLAY") clearMult = 0.50;
  else {
    // 램프 정보가 없을 경우 점수 기반으로 추정
    if (score === 10000000) clearMult = 1.10;
    else if (score >= 9900000) clearMult = 1.05;
    else if (score >= 9800000) clearMult = 1.02;
  }

  // 공식 계산: Math.floor( Lv * (Score / 10,000,000) * Grade * Clear * 20 )
  // 부동소수점 오차(예: 405.99999999)로 인한 0.001점 내림 누락을 100% 방지하기 위해 + 1e-6 정밀도 보정
  const rawVf = (level * 20) * (score / 10000000) * gradeMult * clearMult;
  return Math.floor(rawVf + 1e-6);
}



// 4. 모달 컨트롤
function openSdvxModal() { document.getElementById('sdvxModal').classList.remove('hidden'); }
function closeSdvxModal() { document.getElementById('sdvxModal').classList.add('hidden'); }

// 5. 제목 정규화 함수 (전각/반각, 특수문자, 대소문자, 악센트 통일)
function normalizeTitle(title) {
  if (!title) return '';
  // 악센트 분해 (à -> a, é -> e 등) 및 전각 -> 반각 변환
  let str = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  str = str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
  // 공백, 특수기호, 그리스문자, 인코딩 깨짐문자(驩驧驫驪) 등 모두 제거
  return str.toLowerCase().replace(/[\s\-_・。、！？!?♥♡★☆"'\(\)\[\]『』「」~～〜ØΞ∞Λ△ΩИΣ驩驧驫驪]/g, '');
}

// 5. 성적 데이터 분석 및 렌더링
async function processSdvxData(scores) {
  const db = await loadSdvxDB();
  if (!db) {
    alert("sdvx_db.json 파일을 불러오지 못했습니다.");
    return;
  }

  // 정규화된 DB 맵 생성 (제목 불일치 방지)
  const normalizedDb = {};
  for (const key in db) {
    normalizedDb[normalizeTitle(key)] = db[key];
  }

  let calculatedList = [];

  scores.forEach(item => {
    // 1순위: 원본 제목 매칭, 2순위: 정규화 제목 매칭
    const songInfo = db[item.title] || normalizedDb[normalizeTitle(item.title)];
    let level = null;
    let songId = null;
    let imageName = null;
    let diff = item.diff || "EXH";

    if (songInfo) {
      songId = songInfo.id || null;
      imageName = songInfo.imageName || null;
      // DB 내부에서는 특수 난이도(GRV, HVN, VVD, XCD)가 모두 'INF'로 통합 저장되어 있음 (music_db.xml 구조상)
      let dbDiff = diff;
      if (["GRV", "HVN", "VVD", "XCD", "INF"].includes(diff)) {
        dbDiff = songInfo.levels[diff] ? diff : "INF"; 
      }
      level = songInfo.levels[dbDiff] || songInfo.levels["MXM"] || songInfo.levels["EXH"] || null;
    }

    const vfInt = calculateSingleVolforce(level, item.score, item.lamp);

    calculatedList.push({
      title: item.title,
      diff: diff,
      score: item.score,
      level: level,
      vf: vfInt / 10,
      vfInt: vfInt,
      id: songId,
      imageName: imageName,
      lamp: item.lamp
    });
  });

  // 6. 볼포스 내림차순 정렬 후 TOP 50 추출
  // 사볼은 동일 곡이더라도 난이도가 다르면(예: MXM, EXH) 탑 50에 중복해서 들어갈 수 있습니다.
  const finalValidList = [...calculatedList];
  
  // 정렬 순서: 1. 단곡 볼포스(vfInt) 내림차순 -> 2. 점수(score) 내림차순 -> 3. 레벨(level) 내림차순
  finalValidList.sort((a, b) => {
    if (b.vfInt !== a.vfInt) return b.vfInt - a.vfInt;
    if (b.score !== a.score) return b.score - a.score;
    if (b.level !== a.level) return b.level - a.level;
    return 0;
  });
  const top50 = finalValidList.slice(0, 50);
  
  // 50곡의 정수 단곡 FORCE를 정확히 합산한 뒤 1000으로 나눔 (공식 볼포스 산출식)
  const totalVfRaw = top50.reduce((acc, cur) => acc + cur.vfInt, 0);
  const totalVf = totalVfRaw / 1000; // 최종 볼포스 수치 (예: 20.802)

  // 화면 전환 (빈 화면 숨기고, 프로필 상태 표시)
  document.getElementById('sdvxEmptyState').classList.remove('block');
  document.getElementById('sdvxEmptyState').classList.add('hidden');
  document.getElementById('sdvxProfileState').classList.remove('hidden');

  // 상단 요약 대시보드 갱신 (인게임 볼포스 표기: 22.001 형태)
  document.getElementById('totalVfDisplay').textContent = totalVf.toFixed(3);

  // exportScorecard (베딕트 스타일 이미지) 렌더링
  const expGrid = document.getElementById('expGrid');
  const expVf = document.getElementById('expVolforce');
  const expName = document.getElementById('expName');
  const expDate = document.getElementById('expDate');
  if (expVf) expVf.textContent = totalVf.toFixed(3);
  const playerDjName = localStorage.getItem('sdvx_dj_name') || 'PLAYER';
  if (expName) expName.textContent = playerDjName;
  if (expDate) expDate.textContent = new Date().toISOString().slice(0, 10);
  updateDjNameDisplays(playerDjName);

  if (expGrid) {
    expGrid.innerHTML = top50.map((song, idx) => {
      let diffTextColor = "text-rose-400 font-black";
      if (song.diff === "NOV") diffTextColor = "text-sky-400 font-black";
      else if (song.diff === "ADV") diffTextColor = "text-amber-400 font-black";
      else if (song.diff === "MXM") diffTextColor = "text-slate-100 font-black drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]";
      else if (["INF", "GRV", "HVN", "VVD", "XCD"].includes(song.diff)) diffTextColor = "text-fuchsia-400 font-black drop-shadow-[0_0_6px_rgba(232,121,249,0.7)]";

      let lampTextColor = "text-slate-400 font-bold";
      if (song.lamp === "PUC") lampTextColor = "text-amber-300 font-black drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]";
      else if (song.lamp === "UC") lampTextColor = "text-rose-400 font-black drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]";
      else if (song.lamp === "EX-HARD" || song.lamp === "MXV") lampTextColor = "text-yellow-300 font-black";
      else if (song.lamp === "HARD" || song.lamp === "COMP") lampTextColor = "text-pink-400 font-bold";
      else if (song.lamp === "CLEAR") lampTextColor = "text-emerald-400 font-bold";

      let coverSrc = '';
      if (song.imageName) {
        coverSrc = `https://dp4p6x0xfi5o9.cloudfront.net/sdvx/img/cover/${song.imageName}`;
      } else if (song.id && /^\d+$/.test(song.id)) {
        coverSrc = `./jackets/${song.id.padStart(4, '0')}.webp`;
      }

      return `
        <div class="bg-slate-800/95 rounded-xl p-3 border border-slate-700/80 relative shadow-md flex gap-3 items-center">
          <div class="w-16 h-16 bg-slate-950 rounded-lg flex-shrink-0 overflow-hidden relative flex items-center justify-center border border-slate-700/80 shadow-inner">
            ${coverSrc ? `<img src="${coverSrc}" crossorigin="anonymous" onerror="this.onerror=null; if(this.src.includes('cloudfront')) { this.src='./jackets/${song.id}.webp'; } else { this.style.display='none'; }" class="w-full h-full object-cover absolute inset-0 z-10" />` : ''}
            <div class="text-[12px] text-slate-600 font-black tracking-tighter">SDVX</div>
          </div>
          <div class="flex-grow min-w-0 flex flex-col justify-center h-auto min-h-[64px] py-1">
            <!-- 1행: 볼포스 & 난이도 레벨 -->
            <div class="flex items-center justify-between gap-1 mb-2">
              <div class="text-[28px] font-black text-slate-100 font-mono tracking-tight leading-none drop-shadow-sm">${song.vf.toFixed(1)}</div>
              <span class="text-[12px] ${diffTextColor} tracking-wider shrink-0">${song.diff || "?"} ${song.level !== null ? song.level : "-"}</span>
            </div>
            <!-- 2행: 점수 & 클리어 램프 -->
            <div class="flex items-center justify-between gap-1 mb-0.5">
              <span class="text-[11px] text-slate-300 font-mono font-bold tracking-tight leading-none">${song.score.toLocaleString()}</span>
              <span class="text-[11px] ${lampTextColor} uppercase tracking-wider shrink-0 leading-none">${song.lamp || 'PLAY'}</span>
            </div>
            <!-- 3행: 곡 제목 -->
            <div class="text-[11px] text-slate-200 font-bold truncate leading-normal pb-0.5" title="${song.title}">
              ${song.title}
            </div>
          </div>
          <div class="absolute top-1 right-2 text-[8px] text-slate-500 font-extrabold tracking-widest">#${idx + 1}</div>
        </div>
      `;
    }).join('');
  }

  // TOP 50 데이터를 전역 변수에 저장 (뷰어에서 사용)
  window._vf50Data = { top50, totalVf };

  // 클라우드 및 로컬스토리지 영구 저장
  saveSdvxUserData(scores, totalVf, top50);

  closeSdvxModal();
}

// ==========================================
// 볼포스 히스토리 차트 및 클라우드 연동
// ==========================================
let vfHistoryChartInstance = null;

// 히스토리 그래프 렌더링
function renderVfHistoryChart(historyList) {
  const ctx = document.getElementById('vfHistoryChart');
  if (!ctx || !window.Chart) return;

  const countEl = document.getElementById('vfHistoryCount');
  if (countEl) countEl.textContent = `기록 ${historyList.length}개`;

  if (historyList.length === 0) {
    if (vfHistoryChartInstance) vfHistoryChartInstance.destroy();
    return;
  }

  // 시간순 정렬
  const sorted = [...historyList].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  const labels = sorted.map(h => h.dateStr || new Date(h.timestamp || Date.now()).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }));
  const dataPoints = sorted.map(h => parseFloat(h.volforce || h.totalVf || 0));

  if (vfHistoryChartInstance) vfHistoryChartInstance.destroy();

  vfHistoryChartInstance = new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: '볼포스',
        data: dataPoints,
        borderColor: '#e879f9',
        backgroundColor: 'rgba(232, 121, 249, 0.15)',
        borderWidth: 3,
        pointBackgroundColor: '#f43f5e',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.35
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#e2e8f0',
          bodyColor: '#f43f5e',
          bodyFont: { weight: 'bold' },
          callbacks: {
            label: (ctx) => `VOLFORCE: ${ctx.parsed.y.toFixed(3)}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(51, 65, 85, 0.3)' },
          ticks: { color: '#94a3b8', font: { size: 9 } }
        },
        y: {
          grid: { color: 'rgba(51, 65, 85, 0.3)' },
          ticks: {
            color: '#cbd5e1',
            font: { size: 9 },
            callback: (v) => v.toFixed(2)
          }
        }
      }
    }
  });
}

// 볼포스 갱신 히스토리 전체 삭제
async function clearVfHistory() {
  if (!confirm('볼포스 갱신 히스토리를 전부 삭제하시겠습니까?\n(현재 성적 데이터는 유지됩니다)')) return;

  // 1. 로컬스토리지 히스토리 삭제
  localStorage.removeItem('sdvx_vf_history');

  // 2. Firestore 히스토리 삭제
  if (currentUser && typeof db !== 'undefined' && db) {
    try {
      const histSnap = await db.collection("users").doc(currentUser.uid).collection("sdvx_history").get();
      const batch = db.batch();
      histSnap.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log("☁️ 클라우드 히스토리 삭제 완료");
    } catch (err) {
      console.error("클라우드 히스토리 삭제 실패:", err);
    }
  }

  // 3. 차트 초기화
  renderVfHistoryChart([]);
  alert('히스토리가 삭제되었습니다.');
}

// 클라우드/로컬 저장
async function saveSdvxUserData(scores, totalVf, top50) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timestamp = Date.now();

  const saveData = {
    scores: scores,
    totalVf: totalVf,
    updatedAt: timestamp,
    dateStr: dateStr
  };

  // 1. 로컬스토리지에 캐시
  localStorage.setItem('sdvx_latest_data', JSON.stringify(saveData));

  let localHistory = JSON.parse(localStorage.getItem('sdvx_vf_history') || '[]');
  // 같은 날짜/볼포스 중복 방지
  const lastEntry = localHistory[localHistory.length - 1];
  if (!lastEntry || Math.abs(lastEntry.totalVf - totalVf) > 0.0005) {
    localHistory.push({ totalVf: totalVf, dateStr: dateStr, timestamp: timestamp });
    localStorage.setItem('sdvx_vf_history', JSON.stringify(localHistory));
  }
  renderVfHistoryChart(localHistory);

  // 2. 구글 로그인 상태면 Firestore 동기화
  if (currentUser && typeof db !== 'undefined' && db) {
    try {
      await db.collection("users").doc(currentUser.uid).collection("sdvx_data").doc("latest").set(saveData);
      await db.collection("users").doc(currentUser.uid).collection("sdvx_history").add({
        totalVf: totalVf,
        dateStr: dateStr,
        timestamp: timestamp
      });
      console.log("☁️ SDVX 성적 및 볼포스 히스토리가 클라우드에 저장되었습니다.");
    } catch (err) {
      console.error("클라우드 저장 실패:", err);
    }
  }
}

// 클라우드/로컬에서 성적 불러오기
async function loadSdvxUserData(user) {
  // 1. Firestore에서 불러오기 시도
  if (user && typeof db !== 'undefined' && db) {
    try {
      const docSnap = await db.collection("users").doc(user.uid).collection("sdvx_data").doc("latest").get();
      if (docSnap.exists) {
        const data = docSnap.data();
        if (data && data.scores) {
          if (data.djName) {
            localStorage.setItem('sdvx_dj_name', data.djName);
            updateDjNameDisplays(data.djName);
          }
          processSdvxData(data.scores);
        }
      }

      const histSnap = await db.collection("users").doc(user.uid).collection("sdvx_history").orderBy("timestamp", "asc").get();
      if (!histSnap.empty) {
        const cloudHistory = [];
        histSnap.forEach(d => cloudHistory.push(d.data()));
        localStorage.setItem('sdvx_vf_history', JSON.stringify(cloudHistory));
        renderVfHistoryChart(cloudHistory);
        return;
      }
    } catch (err) {
      console.error("클라우드 데이터 로드 오류:", err);
    }
  }

  // 2. 로컬 캐시에서 불러오기 (비로그인 또는 오프라인)
  const cached = localStorage.getItem('sdvx_latest_data');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.scores) {
        if (parsed.djName) {
          localStorage.setItem('sdvx_dj_name', parsed.djName);
          updateDjNameDisplays(parsed.djName);
        }
        processSdvxData(parsed.scores);
      }
    } catch (e) {}
  }

  const cachedHistory = JSON.parse(localStorage.getItem('sdvx_vf_history') || '[]');
  renderVfHistoryChart(cachedHistory);
}

// DJ Name 관리 함수
function getPlayerDjName() {
  return localStorage.getItem('sdvx_dj_name') || 'PLAYER';
}

function editDjName() {
  const current = getPlayerDjName();
  const next = prompt("사운드 볼텍스 플레이어 닉네임(DJ NAME)을 입력해주세요:", current);
  if (next !== null && next.trim()) {
    const trimmed = next.trim();
    localStorage.setItem('sdvx_dj_name', trimmed);
    updateDjNameDisplays(trimmed);
    
    // 구글 로그인 상태면 클라우드에도 즉시 업데이트
    if (currentUser && typeof db !== 'undefined' && db) {
      db.collection("users").doc(currentUser.uid).collection("sdvx_data").doc("latest").update({
        djName: trimmed
      }).catch(err => {
        console.warn("닉네임 클라우드 업데이트 실패 (문서 없음 가능):", err);
      });
    }
  }
}

function updateDjNameDisplays(name) {
  const cleanName = name || 'PLAYER';
  const d1 = document.getElementById('playerDjNameDisplay');
  const d2 = document.getElementById('expName');
  if (d1) d1.textContent = cleanName;
  if (d2) d2.textContent = cleanName;

  // 상단 헤더 연동 상태 텍스트도 사볼 인게임 닉네임으로 동기화
  const statusText = document.getElementById('userStatusText');
  if (statusText && currentUser) {
    const displayLabel = (cleanName && cleanName !== 'PLAYER' && cleanName !== 'NYAN') ? `${cleanName}님 연동됨` : '클라우드 연동됨';
    statusText.textContent = `${displayLabel} ${isAdmin ? '👑' : ''}`;
  }
}

// 가이드 모달 열기 / 닫기
function openGuideModal() {
  const modal = document.getElementById('guideModal');
  if (modal) modal.classList.remove('hidden');
}
function closeGuideModal() {
  const modal = document.getElementById('guideModal');
  if (modal) modal.classList.add('hidden');
}

// VF50 뷰어 모달 열기 (html2canvas로 이미지 생성)
async function openVf50Viewer() {
  if (!window._vf50Data) {
    alert('먼저 성적 데이터를 불러와 주세요.');
    return;
  }

  const modal = document.getElementById('vf50ViewerModal');
  const container = document.getElementById('vf50ImageContainer');
  modal.classList.remove('hidden');
  container.innerHTML = '<div class="text-center py-8 text-slate-400 text-sm">이미지 생성 중...</div>';

  // exportScorecard를 html2canvas로 캡쳐
  const scorecard = document.getElementById('exportScorecard');
  try {
    const canvas = await html2canvas(scorecard, {
      backgroundColor: '#0f172a',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      width: scorecard.scrollWidth,
      height: scorecard.scrollHeight
    });
    container.innerHTML = '';
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    container.appendChild(canvas);
  } catch (err) {
    container.innerHTML = '<div class="text-center py-8 text-rose-400 text-sm">이미지 생성 실패: ' + err.message + '</div>';
  }
}

function closeVf50Viewer() {
  document.getElementById('vf50ViewerModal').classList.add('hidden');
}

// VF50 이미지 저장
function saveVf50Image() {
  const container = document.getElementById('vf50ImageContainer');
  const canvas = container.querySelector('canvas');
  if (!canvas) {
    alert('이미지가 아직 생성되지 않았습니다.');
    return;
  }
  const link = document.createElement('a');
  link.download = `VF50_${new Date().toISOString().slice(0,10)}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// 수동 입력창 제출 처리
function processSdvxScores() {
  const rawInput = document.getElementById('sdvxRawInput').value.trim();
  if (!rawInput) return;
  try {
    const scores = JSON.parse(rawInput);
    processSdvxData(scores);
  } catch (e) {
    alert("데이터 형식이 올바르지 않습니다.");
  }
}

// 6. 북마크릿 데이터 수신 (postMessage 이벤트 감지)
window.addEventListener('message', (event) => {
  // 스크래퍼(북마크릿)에서 보낸 'SDVX_PARSE_DATA' 타입인지 확인
  if (event.data && event.data.type === 'SDVX_PARSE_DATA') {
    try {
      if (event.data.playerName) {
        localStorage.setItem('sdvx_dj_name', event.data.playerName);
        updateDjNameDisplays(event.data.playerName);
      }
      const scores = event.data.payload;
      if (Array.isArray(scores)) {
        processSdvxData(scores);
      }
    } catch (err) {
      console.error("북마크릿 데이터 수신 실패:", err);
    }
  }
});

// 7. URL 해시(#import=...) 자동 감지 및 즉시 실행 (원클릭 연동 백업)
window.addEventListener('DOMContentLoaded', () => {
  updateDjNameDisplays(getPlayerDjName());

  if (window.location.hash.startsWith('#import=')) {
    try {
      const rawData = decodeURIComponent(window.location.hash.replace('#import=', ''));
      const scores = JSON.parse(rawData);
      if (Array.isArray(scores)) {
        processSdvxData(scores);
        // URL 해시 정리
        history.replaceState(null, null, ' ');
        return;
      }
    } catch (err) {
      console.error("자동 임포트 파싱 실패:", err);
    }
  }

  // 초기 저장 데이터 복원
  loadSdvxUserData(currentUser);
});

// 8. Auth State 변화 시 자동 로드 연동
if (typeof auth !== 'undefined' && auth) {
  auth.onAuthStateChanged((user) => {
    loadSdvxUserData(user);
  });
}

// ==========================================
// 북마크릿 클립보드 복사 함수 추가
// ==========================================
function copyBookmarklet() {
  const codeElement = document.getElementById('bookmarkletCode');
  if (!codeElement) return;
  
  const codeText = codeElement.innerText || codeElement.textContent;
  
  navigator.clipboard.writeText(codeText).then(() => {
    alert("데이터 갱신용 코드가 복사되었습니다!\n\n반드시 사볼 공식 사이트의 [음악 데이터 (Music Data)] 창에서 실행해 주세요.");
  }).catch(err => {
    console.error('복사 실패:', err);
    alert("복사에 실패했습니다. 수동으로 코드를 복사해 주세요.");
  });
}
