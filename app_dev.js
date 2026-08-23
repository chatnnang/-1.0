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

// 2. VF50 공식 규격 볼포스 계산식
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

  // 클리어 계수 (Clear Multiplier) - Exceed Gear 공식 배율
  let clearMult = 1.00;
  
  if (lamp === "PUC") clearMult = 1.10;
  else if (lamp === "UC") clearMult = 1.06;
  else if (lamp === "EX-HARD" || lamp === "EXC" || lamp === "MXV") clearMult = 1.04;
  else if (lamp === "HARD" || lamp === "COMP") clearMult = 1.02;
  else if (lamp === "CLEAR") clearMult = 1.00;
  else if (lamp === "PLAYED" || lamp === "PLAY") clearMult = 0.50;
  else {
    // 램프 정보가 없을 경우 점수 기반으로 추정 (기존 로직 유지, 안전하게 보수적 추정)
    if (score === 10000000) clearMult = 1.10; // PUC
    else if (score >= 9900000) clearMult = 1.06; // S랭크 이상은 UC로 추정
    else if (score >= 9800000) clearMult = 1.02; // AAA+ 이상은 HARD로 추정
  }

  // 공식 계산: (상수 * 20) * (점수 / 1000만) * 등급계수 * 클리어계수
  const rawVf = (level * 20) * (score / 10000000) * gradeMult * clearMult;
  return Math.floor(rawVf + 0.0001) / 10;
}

// 3. 볼포스 총합에 따른 티어 계산
function getVolforceTier(totalVf) {
  if (totalVf >= 20.0) return { name: "IMPERIAL", color: "text-rose-400" };
  if (totalVf >= 19.0) return { name: "CRIMSON", color: "text-red-500" };
  if (totalVf >= 18.0) return { name: "SCARLET", color: "text-amber-500" };
  if (totalVf >= 17.0) return { name: "CORAL", color: "text-pink-400" };
  if (totalVf >= 16.0) return { name: "ARGENTO", color: "text-slate-300" };
  if (totalVf >= 15.0) return { name: "ELDORA", color: "text-yellow-400" };
  if (totalVf >= 14.0) return { name: "VOLTE", color: "text-cyan-400" };
  return { name: "SIENNA", color: "text-amber-700" };
}

// 4. 모달 컨트롤
function openSdvxModal() { document.getElementById('sdvxModal').classList.remove('hidden'); }
function closeSdvxModal() { document.getElementById('sdvxModal').classList.add('hidden'); }

// 타이틀 정규화 함수 (대소문자, 띄어쓰기, 특수기호 무시)
function normalizeTitle(title) {
  if (!title) return "";
  // 전각 영숫자를 반각으로 변환
  let str = title.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
  // 공백, 특수기호, 그리스문자, 인코딩 깨짐문자(驩驧驫驪) 등 모두 제거
  return str.toLowerCase().replace(/[\s\-_・。、！？!?♥♡★☆"'\(\)\[\]『』「」~～〜ØΞ∞Λ△ΩИΣ驩驧驫驪]/g, '');
}

function closeSdvxModal() { document.getElementById('sdvxModal').classList.add('hidden'); }

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
    let diff = item.diff || "EXH";

    if (songInfo) {
      songId = songInfo.id || null;
      // DB 내부에서는 특수 난이도(GRV, HVN, VVD, XCD)가 모두 'INF'로 통합 저장되어 있음 (music_db.xml 구조상)
      let dbDiff = diff;
      if (["GRV", "HVN", "VVD", "XCD", "INF"].includes(diff)) {
        dbDiff = songInfo.levels[diff] ? diff : "INF"; 
      }
      level = songInfo.levels[dbDiff] || songInfo.levels["MXM"] || songInfo.levels["EXH"] || null;
    }

    const vf = calculateSingleVolforce(level, item.score, item.lamp);

    calculatedList.push({
      title: item.title,
      diff: diff,
      score: item.score,
      level: level,
      vf: vf,
      id: songId,
      lamp: item.lamp
    });
  });

  // 6. 볼포스 내림차순 정렬 후 TOP 50 추출
  // 주의: 공식 볼포스 룰에 따라 "한 곡당 가장 높은 VF를 가진 채보 1개"만 인정됩니다.
  const uniqueSongs = new Map();
  calculatedList.forEach(item => {
    const key = item.id || item.title; // id가 없으면 제목으로 식별
    if (!uniqueSongs.has(key) || uniqueSongs.get(key).vf < item.vf) {
      uniqueSongs.set(key, item);
    } else if (uniqueSongs.get(key).vf === item.vf) {
      // 동점이면 점수가 더 높은 것을 우선 (타이기브레이커)
      if (item.score > uniqueSongs.get(key).score) {
        uniqueSongs.set(key, item);
      }
    }
  });

  const finalValidList = Array.from(uniqueSongs.values());
  // VF 내림차순 정렬, 동점시 점수 내림차순, 그다음 레벨 내림차순
  finalValidList.sort((a, b) => {
    if (b.vf !== a.vf) return b.vf - a.vf;
    if (b.score !== a.score) return b.score - a.score;
    if (b.level !== a.level) return b.level - a.level;
    return 0;
  });
  const top50 = finalValidList.slice(0, 50);
  const totalVfRaw = top50.reduce((acc, cur) => acc + cur.vf, 0);
  const totalVf = totalVfRaw / 100; // 최종 볼포스 수치 (예: 20.700)

  // 화면 전환 (빈 화면 숨기고, 프로필 상태 표시)
  document.getElementById('sdvxEmptyState').classList.remove('block');
  document.getElementById('sdvxEmptyState').classList.add('hidden');
  document.getElementById('sdvxProfileState').classList.remove('hidden');

  // 상단 요약 대시보드 갱신 (인게임 볼포스 표기: 22.001 형태)
  document.getElementById('totalVfDisplay').textContent = totalVf.toFixed(3);
  
  const tier = getVolforceTier(totalVf);
  const tierEl = document.getElementById('tierDisplay');
  tierEl.textContent = tier.name;
  tierEl.className = `text-xl font-black mt-2 ${tier.color}`;

  // exportScorecard (베딕트 스타일 이미지) 렌더링
  const expGrid = document.getElementById('expGrid');
  const expVf = document.getElementById('expVolforce');
  const expName = document.getElementById('expName');
  const expDate = document.getElementById('expDate');

  if (expVf) expVf.textContent = totalVf.toFixed(3);
  if (expName && currentUser) expName.textContent = currentUser.displayName || 'PLAYER';
  if (expDate) expDate.textContent = new Date().toISOString().slice(0, 10);

  if (expGrid) {
    expGrid.innerHTML = top50.map((song, idx) => {
      let badgeColor = "bg-red-600 text-white";
      if (song.diff === "NOV") badgeColor = "bg-blue-500 text-white";
      else if (song.diff === "ADV") badgeColor = "bg-yellow-500 text-slate-900";
      else if (song.diff === "MXM") badgeColor = "bg-slate-100 text-slate-900";
      else if (["INF", "GRV", "HVN", "VVD", "XCD"].includes(song.diff)) badgeColor = "bg-fuchsia-600 text-white";

      const jacketPath = `./jackets/${song.id}.webp`;

      return `
        <div class="bg-slate-800 rounded-lg p-2 border border-slate-700 relative">
          <div class="flex gap-2">
            <div class="w-16 h-16 bg-slate-700 rounded flex-shrink-0 overflow-hidden relative flex items-center justify-center text-[8px] text-slate-500">
              <img src="${jacketPath}" onerror="this.style.display='none'" class="w-full h-full object-cover absolute inset-0 z-10" />
              <span class="z-0">${song.id || '?'}</span>
            </div>
            <div class="flex-grow min-w-0">
              <div class="text-2xl font-black text-slate-100 leading-none">${song.vf.toFixed(1)}</div>
              <div class="flex items-center gap-1 mt-1">
                <span class="px-1 py-0.5 text-[7px] font-black rounded ${badgeColor}">${song.diff || "?"} ${song.level !== null ? song.level : "-"}</span>
                <span class="text-[7px] text-slate-400 font-mono">${song.score.toLocaleString()}</span>
              </div>
              <div class="text-[9px] text-slate-300 font-bold truncate mt-0.5">┃${song.title}</div>
            </div>
          </div>
          <div class="absolute top-1 right-2 text-[8px] text-slate-500 font-bold">Rank #${idx + 1}</div>
        </div>
      `;
    }).join('');
  }

  // TOP 50 데이터를 전역 변수에 저장 (뷰어에서 사용)
  window._vf50Data = { top50, totalVf, tier };

  closeSdvxModal();
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

// ==========================================
// 북마크릿 클립보드 복사 함수 추가
// ==========================================
function copyBookmarklet() {
  const codeElement = document.getElementById('bookmarkletCode');
  if (!codeElement) return;
  
  const codeText = codeElement.innerText || codeElement.textContent;
  
  navigator.clipboard.writeText(codeText).then(() => {
    alert("데이터 갱신용 코드가 복사되었습니다!\n\n사운드 볼텍스 홈페이지 주소창에 붙여넣으실 때, 맨 앞에 'javascript:' 가 지워졌다면 직접 입력해 주세요.");
  }).catch(err => {
    console.error('복사 실패:', err);
    alert("복사에 실패했습니다. 수동으로 코드를 복사해 주세요.");
  });
}
