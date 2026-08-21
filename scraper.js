/**
 * 얼마썼냥 x SDVX VF50 원클릭 파서 (scraper.js)
 */
(async function() {
    // 1. 코나미 공식 사볼 페이지 확인
    if (!location.hostname.includes("p.eagate.573.jp")) {
        alert("⚠️ 코나미 사운드 볼텍스 공식 홈페이지(e-amusement) 플레이 데이터 페이지에서 실행해 주세요!");
        return;
    }

    const difficultyMap = { 0: "NOV", 1: "ADV", 2: "EXH", 3: "INF" };
    let userScores = [];

    // 2. 화면 내 곡 성적 블록 탐색
    const musicBlocks = document.querySelectorAll('.music_box, tr.music_row, .music, .play_data_music, tr');
    
    musicBlocks.forEach(box => {
        const titleEl = box.querySelector('.title_name, .music_name, h3, .name, .title, .music_title, td.title');
        if (!titleEl) return;
        const title = titleEl.textContent.trim();
        if (!title) return;

        // 각 난이도 아이템 탐색
        const diffItems = box.querySelectorAll('.diff_item, td.diff');
        
        if (diffItems.length > 0) {
            diffItems.forEach(item => {
                const diffClassMatch = item.className.match(/(nov|adv|exh|mxm|inf|grv|hvn|vvd|xcd)/i);
                const diffClass = diffClassMatch ? diffClassMatch[0].toUpperCase() : null;
                
                const scoreText = item.querySelector('.score')?.textContent.replace(/[^0-9]/g, '') || '0';
                const score = parseInt(scoreText, 10);
                
                // 클리어 램프 추출
                let lamp = 'NO_PLAY';
                const markEl = item.querySelector('.clear_mark, .med, img');
                if (markEl) {
                    const str = (markEl.className + ' ' + (markEl.src || '') + ' ' + (markEl.alt || '')).toLowerCase();
                    if (str.includes('puc') || str.includes('perfect')) lamp = 'PUC';
                    else if (str.includes('uc') || str.includes('ultimate')) lamp = 'UC';
                    else if (str.includes('excomp') || str.includes('ex_hard') || str.includes('ex-hard')) lamp = 'EX-HARD';
                    else if (str.includes('hard') || str.includes('comp')) lamp = 'HARD';
                    else if (str.includes('clear')) lamp = 'CLEAR';
                    else if (str.includes('play') || str.includes('crash')) lamp = 'PLAYED';
                }

                if (score > 0 && diffClass) {
                    userScores.push({ title, diff: diffClass, score, lamp });
                }
            });
        } else {
            // 구버전/대체 HTML 구조 대응 (점수 텍스트만 있는 경우)
            const diffEls = box.querySelectorAll(".score, .play_score");
            if (diffEls.length === 1) {
                const score = parseInt(diffEls[0].textContent.replace(/[^0-9]/g, ""), 10);
                if (!isNaN(score) && score > 0) userScores.push({ title, diff: null, score, lamp: null });
            } else {
                diffEls.forEach((diffEl, idx) => {
                    const score = parseInt(diffEl.textContent.replace(/[^0-9]/g, ""), 10);
                    if (!isNaN(score) && score > 0) {
                        userScores.push({ title, diff: difficultyMap[idx] || null, score, lamp: null });
                    }
                });
            }
        }
    });

    if (userScores.length === 0) {
        alert("⚠️ 플레이 데이터를 찾을 수 없습니다. 곡별 성적 페이지가 맞는지 확인해 주세요.");
        return;
    }

    // 3. 로컬 테스트 및 실서버 자동 분기 처리 (URL Hash 전달)
    const jsonStr = JSON.stringify(userScores);
    const encodedData = encodeURIComponent(jsonStr);

    // 개발용 dev.html 경로 (로컬 파일 또는 깃허브 배포 주소)
    const appBaseUrl = window.location.origin.includes("github.io") 
        ? window.location.origin + "/howmuch/dev.html"
        : "http://localhost:5500/dev.html"; // Live Server 포트 기준 (필요시 수정 가능)

    // 클립보드 안전 복사 (URL 길이 초과 대비 백업)
    try {
        await navigator.clipboard.writeText(jsonStr);
    } catch(e) {}

    // 4. 얼마썼냥 앱으로 자동 이동하며 데이터 전달
    const targetUrl = `${appBaseUrl}#import=${encodedData}`;
    window.open(targetUrl, "_blank");
})();
