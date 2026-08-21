// ==========================================
// SDVX ë³¼í¬???•ë? ê³„ì‚° ë°?VF50 ?Œë”ë§?ëª¨ë“ˆ
// ==========================================

let sdvxDatabase = null;

// 1. sdvx_db.json ë¹„ë™ê¸?ë¡œë“œ
async function loadSdvxDB() {
  if (sdvxDatabase) return sdvxDatabase;
  try {
    const res = await fetch('./sdvx_db.json');
    if (!res.ok) throw new Error("DB ë¡œë“œ ?¤íŒ¨");
    sdvxDatabase = await res.json();
    return sdvxDatabase;
  } catch (err) {
    console.error("? ï¸ sdvx_db.json ë¡œë“œ ?¤íŒ¨:", err);
    return null;
  }
}

// 2. VF50 ê³µì‹ ê·œê²© ë³¼í¬??ê³„ì‚°??
function calculateSingleVolforce(level, score, lamp) {
  if (level === null || !score || score < 7000000) return 0;

  // ?ìˆ˜ ?±ê¸‰ ê³„ìˆ˜ (Grade Multiplier)
  let gradeMult = 0.80;
  if (score >= 9900000) gradeMult = 1.05;      // S
  else if (score >= 9800000) gradeMult = 1.02; // AAA+
  else if (score >= 9700000) gradeMult = 1.00; // AAA
  else if (score >= 9500000) gradeMult = 0.97; // AA+
  else if (score >= 9300000) gradeMult = 0.94; // AA
  else if (score >= 9000000) gradeMult = 0.91; // A+
  else if (score >= 8700000) gradeMult = 0.88; // A
  else if (score >= 7500000) gradeMult = 0.85; // B

  // ?´ë¦¬??ê³„ìˆ˜ (Clear Multiplier) - Exceed Gear ê³µì‹ ë°°ìœ¨
  let clearMult = 1.00;
  
  if (lamp === "PUC") clearMult = 1.10;
  else if (lamp === "UC") clearMult = 1.06;
  else if (lamp === "EX-HARD" || lamp === "EXC" || lamp === "MXV") clearMult = 1.04;
  else if (lamp === "HARD" || lamp === "COMP") clearMult = 1.02;
  else if (lamp === "CLEAR") clearMult = 1.00;
  else if (lamp === "PLAYED" || lamp === "PLAY") clearMult = 0.50;
  else {
    // ?¨í”„ ?•ë³´ê°€ ?†ì„ ê²½ìš° ?ìˆ˜ ê¸°ë°˜?¼ë¡œ ì¶”ì • (ê¸°ì¡´ ë¡œì§ ? ì?, ?ˆì „?˜ê²Œ ë³´ìˆ˜??ì¶”ì •)
    if (score === 10000000) clearMult = 1.10; // PUC
    else if (score >= 9900000) clearMult = 1.06; // S??¬ ?´ìƒ?€ UCë¡?ì¶”ì •
    else if (score >= 9800000) clearMult = 1.02; // AAA+ ?´ìƒ?€ HARDë¡?ì¶”ì •
  }

  // ê³µì‹ ê³„ì‚°: (?ìˆ˜ * 20) * (?ìˆ˜ / 1000ë§? * ?±ê¸‰ê³„ìˆ˜ * ?´ë¦¬?´ê³„??
  const rawVf = (level * 20) * (score / 10000000) * gradeMult * clearMult;
  return Math.floor(rawVf) / 10;
}

// 3. ë³¼í¬??ì´í•©???°ë¥¸ ?°ì–´ ê³„ì‚°
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

// 4. ëª¨ë‹¬ ì»¨íŠ¸ë¡?
function openSdvxModal() { document.getElementById('sdvxModal').classList.remove('hidden'); }
function closeSdvxModal() { document.getElementById('sdvxModal').classList.add('hidden'); }

// ?€?´í? ?•ê·œ???¨ìˆ˜ (?€?Œë¬¸?? ?„ì–´?°ê¸°, ?¹ìˆ˜ê¸°í˜¸ ë¬´ì‹œ)
function normalizeTitle(title) {
  if (!title) return "";
  // ?„ê° ?ìˆ«?ë? ë°˜ê°?¼ë¡œ ë³€??
  let str = title.replace(/[ï¼?ï¼ºï½-ï½šï¼-ï¼?/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
  // ?Œë¬¸??ë³€????ê³µë°± ë°??¹ìˆ˜ê¸°í˜¸ ?œê±°
  return str.toLowerCase().replace(/[\s\-_?»ã€‚ã€ï¼ï¼???¥â™¡?…â˜†"'\(\)\[\]?ã€ã€Œã€?ï½?/g, '');
}

function closeSdvxModal() { document.getElementById('sdvxModal').classList.add('hidden'); }

// 5. ?±ì  ?°ì´??ë¶„ì„ ë°??Œë”ë§?
async function processSdvxData(scores) {
  const db = await loadSdvxDB();
  if (!db) {
    alert("sdvx_db.json ?Œì¼??ë¶ˆëŸ¬?¤ì? ëª»í–ˆ?µë‹ˆ??");
    return;
  }

  // ?•ê·œ?”ëœ DB ë§??ì„± (?œëª© ë¶ˆì¼ì¹?ë°©ì?)
  const normalizedDb = {};
  for (const key in db) {
    normalizedDb[normalizeTitle(key)] = db[key];
  }

  let calculatedList = [];

  scores.forEach(item => {
    // 1?œìœ„: ?ë³¸ ?œëª© ë§¤ì¹­, 2?œìœ„: ?•ê·œ???œëª© ë§¤ì¹­
    const songInfo = db[item.title] || normalizedDb[normalizeTitle(item.title)];
    let level = null;
    let songId = null;
    let diff = item.diff || "EXH";

    if (songInfo) {
      songId = songInfo.id || null;
      // DB ?´ë??ì„œ???¹ìˆ˜ ?œì´??GRV, HVN, VVD, XCD)ê°€ ëª¨ë‘ 'INF'ë¡??µí•© ?€?¥ë˜???ˆìŒ (music_db.xml êµ¬ì¡°??
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

  // 6. ë³¼í¬???´ë¦¼ì°¨ìˆœ ?•ë ¬ ??TOP 50 ì¶”ì¶œ
  // ì£¼ì˜: ê³µì‹ ë³¼í¬??ë£°ì— ?°ë¼ "??ê³¡ë‹¹ ê°€???’ì? VFë¥?ê°€ì§?ì±„ë³´ 1ê°?ë§??¸ì •?©ë‹ˆ??
  const uniqueSongs = new Map();
  calculatedList.forEach(item => {
    const key = item.id || item.title; // idê°€ ?†ìœ¼ë©??œëª©?¼ë¡œ ?ë³„
    if (!uniqueSongs.has(key) || uniqueSongs.get(key).vf < item.vf) {
      uniqueSongs.set(key, item);
    }
  });

  const finalValidList = Array.from(uniqueSongs.values());
  finalValidList.sort((a, b) => b.vf - a.vf);
  const top50 = finalValidList.slice(0, 50);
  const totalVfRaw = top50.reduce((acc, cur) => acc + cur.vf, 0);
  const totalVf = totalVfRaw / 100; // ìµœì¢… ë³¼í¬???˜ì¹˜ (?? 20.700)

  // ?”ë©´ ?„í™˜ (ë¹??”ë©´ ?¨ê¸°ê³? ?„ë¡œ???íƒœ ?œì‹œ)
  document.getElementById('sdvxEmptyState').classList.remove('block');
  document.getElementById('sdvxEmptyState').classList.add('hidden');
  document.getElementById('sdvxProfileState').classList.remove('hidden');

  // ?ë‹¨ ?”ì•½ ?€?œë³´??ê°±ì‹  (?¸ê²Œ??ë³¼í¬???œê¸°: 22.001 ?•íƒœ)
  document.getElementById('totalVfDisplay').textContent = totalVf.toFixed(3);
  
  const tier = getVolforceTier(totalVf);
  const tierEl = document.getElementById('tierDisplay');
  tierEl.textContent = tier.name;
  tierEl.className = `text-xl font-black mt-2 ${tier.color}`;

  // exportScorecard (ë² ë”•???¤í????´ë?ì§€) ?Œë”ë§?
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
              <div class="text-[9px] text-slate-300 font-bold truncate mt-0.5">??{song.title}</div>
            </div>
          </div>
          <div class="absolute top-1 right-2 text-[8px] text-slate-500 font-bold">Rank #${idx + 1}</div>
        </div>
      `;
    }).join('');
  }

  // TOP 50 ?°ì´?°ë? ?„ì—­ ë³€?˜ì— ?€??(ë·°ì–´?ì„œ ?¬ìš©)
  window._vf50Data = { top50, totalVf, tier };

  closeSdvxModal();
}

// VF50 ë·°ì–´ ëª¨ë‹¬ ?´ê¸° (html2canvasë¡??´ë?ì§€ ?ì„±)
async function openVf50Viewer() {
  if (!window._vf50Data) {
    alert('ë¨¼ì? ?±ì  ?°ì´?°ë? ë¶ˆëŸ¬?€ ì£¼ì„¸??');
    return;
  }

  const modal = document.getElementById('vf50ViewerModal');
  const container = document.getElementById('vf50ImageContainer');
  modal.classList.remove('hidden');
  container.innerHTML = '<div class="text-center py-8 text-slate-400 text-sm">?´ë?ì§€ ?ì„± ì¤?..</div>';

  // exportScorecardë¥?html2canvasë¡?ìº¡ì³
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
    container.innerHTML = '<div class="text-center py-8 text-rose-400 text-sm">?´ë?ì§€ ?ì„± ?¤íŒ¨: ' + err.message + '</div>';
  }
}

function closeVf50Viewer() {
  document.getElementById('vf50ViewerModal').classList.add('hidden');
}

// VF50 ?´ë?ì§€ ?€??
function saveVf50Image() {
  const container = document.getElementById('vf50ImageContainer');
  const canvas = container.querySelector('canvas');
  if (!canvas) {
    alert('?´ë?ì§€ê°€ ?„ì§ ?ì„±?˜ì? ?Šì•˜?µë‹ˆ??');
    return;
  }
  const link = document.createElement('a');
  link.download = `VF50_${new Date().toISOString().slice(0,10)}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ?˜ë™ ?…ë ¥ì°??œì¶œ ì²˜ë¦¬
function processSdvxScores() {
  const rawInput = document.getElementById('sdvxRawInput').value.trim();
  if (!rawInput) return;
  try {
    const scores = JSON.parse(rawInput);
    processSdvxData(scores);
  } catch (e) {
    alert("?°ì´???•ì‹???¬ë°”ë¥´ì? ?ŠìŠµ?ˆë‹¤.");
  }
}

// 6. ë¶ë§ˆ?¬ë¦¿ ?°ì´???˜ì‹  (postMessage ?´ë²¤??ê°ì?)
window.addEventListener('message', (event) => {
  // ?¤í¬?˜í¼(ë¶ë§ˆ?¬ë¦¿)?ì„œ ë³´ë‚¸ 'SDVX_PARSE_DATA' ?€?…ì¸ì§€ ?•ì¸
  if (event.data && event.data.type === 'SDVX_PARSE_DATA') {
    try {
      const scores = event.data.payload;
      if (Array.isArray(scores)) {
        processSdvxData(scores);
      }
    } catch (err) {
      console.error("ë¶ë§ˆ?¬ë¦¿ ?°ì´???˜ì‹  ?¤íŒ¨:", err);
    }
  }
});

// 7. URL ?´ì‹œ(#import=...) ?ë™ ê°ì? ë°?ì¦‰ì‹œ ?¤í–‰ (?í´ë¦??°ë™ ë°±ì—…)
window.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash.startsWith('#import=')) {
    try {
      const rawData = decodeURIComponent(window.location.hash.replace('#import=', ''));
      const scores = JSON.parse(rawData);
      if (Array.isArray(scores)) {
        processSdvxData(scores);
        // URL ?´ì‹œ ?•ë¦¬
        history.replaceState(null, null, ' ');
      }
    } catch (err) {
      console.error("?ë™ ?„í¬???Œì‹± ?¤íŒ¨:", err);
    }
  }
});

// ==========================================
// ë¶ë§ˆ?¬ë¦¿ ?´ë¦½ë³´ë“œ ë³µì‚¬ ?¨ìˆ˜ ì¶”ê?
// ==========================================
function copyBookmarklet() {
  const codeElement = document.getElementById('bookmarkletCode');
  if (!codeElement) return;
  
  const codeText = codeElement.innerText || codeElement.textContent;
  
  navigator.clipboard.writeText(codeText).then(() => {
    alert("?°ì´??ê°±ì‹ ??ì½”ë“œê°€ ë³µì‚¬?˜ì—ˆ?µë‹ˆ??\n\n?¬ìš´??ë³¼í…???ˆí˜?´ì? ì£¼ì†Œì°½ì— ë¶™ì—¬?£ìœ¼???? ë§??ì— 'javascript:' ê°€ ì§€?Œì¡Œ?¤ë©´ ì§ì ‘ ?…ë ¥??ì£¼ì„¸??");
  }).catch(err => {
    console.error('ë³µì‚¬ ?¤íŒ¨:', err);
    alert("ë³µì‚¬???¤íŒ¨?ˆìŠµ?ˆë‹¤. ?˜ë™?¼ë¡œ ì½”ë“œë¥?ë³µì‚¬??ì£¼ì„¸??");
  });
}
