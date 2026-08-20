// ==========================================
// SDVX 볼포스 정밀 계산 및 베딕트 렌더링 모듈
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

// 2. 베딕트 공식 규격 볼포스 계산식
function calculateSingleVolforce(level, score) {
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

  // 클리어 계수 (Clear Multiplier)
  let clearMult = 1.00;
  if (score === 10000000) clearMult = 1.10; // PUC
  else if (score >= 9900000) clearMult = 1.05; // UC 추정 안전 계수

  // 공식 계산: (상수 * 20) * (점수 / 1000만) * 등급계수 * 클리어계수 / 10 (소수점 1자리 버림)
  const rawVf = (level * 20) * (score / 10000000) * gradeMult * clearMult;
  return Math.floor(rawVf) / 10;
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

// 4. 모달 컨트롤
function openSdvxModal() { document.getElementById('sdvxModal').classList.remove('hidden'); }
function closeSdvxModal() { document.getElementById('sdvxModal').classList.add('hidden'); }

// 5. 성적 데이터 분석 및 렌더링
async function processSdvxData(scores) {
  const db = await loadSdvxDB();
  if (!db) {
    alert("sdvx_db.json 파일을 불러오지 못했습니다.");
    return;
  }

  let calculatedList = [];

  scores.forEach(item => {
    const songInfo = db[item.title];
    let level = null;
    let songId = null;
    let diff = item.diff || "EXH";

    if (songInfo) {
      songId = songInfo.id || null;
      level = songInfo.levels[diff] || songInfo.levels["MXM"] || songInfo.levels["EXH"] || null;
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

  // 볼포스 내림차순 정렬 후 TOP 50 추출
  calculatedList.sort((a, b) => b.vf - a.vf);
  const top50 = calculatedList.slice(0, 50);
  const totalVf = top50.reduce((acc, cur) => acc + cur.vf, 0);

  // 상단 요약 대시보드 갱신
  document.getElementById('vfSummaryCard').classList.remove('hidden');
  document.getElementById('totalVfDisplay').textContent = totalVf.toFixed(3);
  
  const tier = getVolforceTier(totalVf);
  const tierEl = document.getElementById('tierDisplay');
  tierEl.textContent = tier.name;
  tierEl.className = `text-xl sm:text-2xl font-black mt-1 ${tier.color}`;

  // 그리드 렌더링
  const grid = document.getElementById('top50Grid');
  grid.innerHTML = top50.map((song, idx) => {
    let badgeColor = "bg-red-600 text-white";
    if (song.diff === "NOV") badgeColor = "bg-blue-500 text-white";
    else if (song.diff === "ADV") badgeColor = "bg-yellow-500 text-slate-900";
    else if (song.diff === "MXM") badgeColor = "bg-slate-100 text-slate-900";
    else if (["INF", "GRV", "HVN", "VVD", "XCD"].includes(song.diff)) badgeColor = "bg-fuchsia-600 text-white";

    return `
      <div class="flex items-center gap-3.5 p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/70 shadow-sm hover:border-fuchsia-500/50 transition">
        <span class="text-sm font-black text-slate-500 w-6 text-center">#${idx + 1}</span>
        
        <div class="w-14 h-14 bg-slate-800 rounded-lg flex-shrink-0 flex items-center justify-center border border-slate-700 overflow-hidden text-xs text-slate-500 font-bold">
          ${song.id ? song.id : "NO ID"}
        </div>

        <div class="flex-grow min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="px-1.5 py-0.5 text-[10px] font-black rounded ${badgeColor}">
              ${song.diff || "DIFF"} ${song.level !== null ? song.level : "-"}
            </span>
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

// 6. URL 해시(#import=...) 자동 감지 및 즉시 실행 (원클릭 연동)
window.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash.startsWith('#import=')) {
    try {
      const rawData = decodeURIComponent(window.location.hash.replace('#import=', ''));
      const scores = JSON.parse(rawData);
      if (Array.isArray(scores)) {
        processSdvxData(scores);
        // URL 해시 정리
        history.replaceState(null, null, ' ');
      }
    } catch (err) {
      console.error("자동 임포트 파싱 실패:", err);
    }
  }
});
