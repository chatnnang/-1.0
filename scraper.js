/**
 * 얼마썼냥 x SDVX 베딕트 파서 (scraper.js)
 * 코나미 e-amusement 공식 홈페이지(베이직 코스) 플레이 데이터 추출기
 */
(async function() {
    console.log("=== 얼마썼냥 SDVX 스크래퍼 시작 ===");
    
    // 코나미 사볼 플레이 데이터 페이지 확인
    if (!location.hostname.includes("p.eagate.573.jp")) {
        alert("⚠️ 코나미 사운드 볼텍스 공식 홈페이지(p.eagate.573.jp)의 플레이 데이터 페이지에서 실행해 주세요!");
        return;
    }

    const difficultyMap = {
        0: "NOV",
        1: "ADV",
        2: "EXH",
        3: "INF" // INF/GRV/HVN/VVD/XCD 등은 sdvx_db.json과 대조하여 자동 매칭
    };

    let userScores = [];

    // 화면 내의 곡 성적 블록 탐색
    const musicBoxes = document.querySelectorAll(".music, .play_data_music");
    
    if (musicBoxes.length === 0) {
        // 단일 곡 리스트 테이블 탐색 (테이블 형태 페이지 대응)
        const rows = document.querySelectorAll("tr");
        rows.forEach(row => {
            const titleEl = row.querySelector(".title, .music_title");
            const scoreEl = row.querySelector(".score, .play_score");
            if (titleEl && scoreEl) {
                const title = titleEl.textContent.trim();
                const score = parseInt(scoreEl.textContent.replace(/[^0-9]/g, ""), 10);
                if (title && !isNaN(score)) {
                    userScores.push({
                        title: title,
                        score: score
                    });
                }
            }
        });
    } else {
        musicBoxes.forEach(box => {
            const titleEl = box.querySelector(".title_name, .music_name, h3, .name");
            if (!titleEl) return;
            const title = titleEl.textContent.trim();

            // 각 난이도별 점수 블록 파싱
            const diffEls = box.querySelectorAll(".diff, .difficulty_block, .score_block");
            diffEls.forEach((diffEl, idx) => {
                const scoreText = diffEl.textContent.replace(/[^0-9]/g, "");
                const score = parseInt(scoreText, 10);
                
                if (!isNaN(score) && score > 0) {
                    userScores.push({
                        title: title,
                        diff: difficultyMap[idx] || "EXH",
                        score: score
                    });
                }
            });
        });
    }

    if (userScores.length === 0) {
        alert("플레이 데이터를 찾지 못했습니다. 공식 홈페이지의 '곡별 성적(プレイデータ)' 페이지로 이동 후 다시 실행해 주세요.");
        return;
    }

    const payload = JSON.stringify(userScores, null, 2);

    // 클립보드에 복사
    try {
        await navigator.clipboard.writeText(payload);
        alert(`🎉 총 ${userScores.length}개의 성적 데이터가 클립보드에 복사되었습니다!\n\n'얼마썼냥' 앱으로 돌아가서 [성적 불러오기]에 붙여넣어 주세요.`);
    } catch (err) {
        // 클립보드 권한 제한 시 팝업으로 데이터 제공
        prompt("아래 JSON 성적 데이터를 전체 복사(Ctrl+A -> Ctrl+C)하여 '얼마썼냥'에 붙여넣어 주세요:", payload);
    }
})();
