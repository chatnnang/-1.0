/**
 * 얼마썼냥 x SDVX 베딕트 원클릭 파서 (scraper.js)
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
    const musicBoxes = document.querySelectorAll(".music, .play_data_music, tr");
    
    musicBoxes.forEach(box => {
        const titleEl = box.querySelector(".title_name, .music_name, h3, .name, .title, .music_title");
        if (!titleEl) return;
        const title = titleEl.textContent.trim();
        if (!title) return;

        const diffEls = box.querySelectorAll(".diff, .difficulty_block, .score_block, .score, .play_score");
        if (diffEls.length === 1 && diffEls[0].classList.contains("score")) {
            // 단일 테이블 행 형태 대응
            const score = parseInt(diffEls[0].textContent.replace(/[^0-9]/g, ""), 10);
            if (!isNaN(score) && score > 0) {
                userScores.push({ title: title, diff: null, score: score });
            }
        } else {
            // 블록 형태 대응
            diffEls.forEach((diffEl, idx) => {
                const scoreText = diffEl.textContent.replace(/[^0-9]/g, "");
                const score = parseInt(scoreText, 10);
                if (!isNaN(score) && score > 0) {
                    userScores.push({
                        title: title,
                        diff: difficultyMap[idx] || null,
                        score: score
                    });
                }
            });
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
