import json
import re
import math

with open('sdvx_db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

def normalizeTitle(title):
    str_title = ''
    for char in title:
        code = ord(char)
        if 0xFF01 <= code <= 0xFF5E:
            str_title += chr(code - 0xFEE0)
        else:
            str_title += char
    return re.sub(r'[\s\-_・。、！？!?♥♡★☆\"\'\(\)\[\]『』「」~～]', '', str_title).lower()

normalizedDb = {}
for k, v in db.items():
    normalizedDb[normalizeTitle(k)] = v

with open('test_vaddict_data.json', 'r', encoding='utf-8') as f:
    scores = json.load(f)

calculatedList = []

for item in scores:
    title = item['title']
    diff = item['diff']
    score = item['score']
    lamp = item['lamp']
    grade = item['grade']
    
    songInfo = db.get(title) or normalizedDb.get(normalizeTitle(title))
    if songInfo:
        songId = songInfo.get('id')
        
        dbDiff = diff
        if diff in ["GRV", "HVN", "VVD", "XCD", "INF"]:
            dbDiff = diff if diff in songInfo['levels'] else "INF"
            
        level = songInfo['levels'].get(dbDiff) or songInfo['levels'].get("MXM") or songInfo['levels'].get("EXH")
        if not level:
            continue
            
        gradeMult = 0.0
        if score >= 9900000: gradeMult = 1.05
        elif score >= 9800000: gradeMult = 1.02
        elif score >= 9700000: gradeMult = 1.00
        elif score >= 9500000: gradeMult = 0.97
        elif score >= 9300000: gradeMult = 0.95
        elif score >= 9000000: gradeMult = 0.93
        elif score >= 8700000: gradeMult = 0.90
        elif score >= 7500000: gradeMult = 0.85
        elif score >= 6500000: gradeMult = 0.80
        else: gradeMult = 0.70
        
        clearMult = 1.00
        if lamp == "PUC": clearMult = 1.10
        elif lamp == "UC": clearMult = 1.06
        elif lamp == "MXV": clearMult = 1.04
        elif lamp == "HARD" or lamp == "COMP": clearMult = 1.02
        elif lamp == "CLEAR" or lamp == "PLAY": clearMult = 1.00
        
        vf = math.floor(level * 20 * (score / 10000000.0) * gradeMult * clearMult * 10) / 10.0
        
        calculatedList.append({
            'id': songId,
            'title': title,
            'diff': diff,
            'score': score,
            'vf': vf,
            'level': level,
            'raw_diff': dbDiff
        })

uniqueSongs = {}
for item in calculatedList:
    key = item['id'] or item['title']
    if key not in uniqueSongs or uniqueSongs[key]['vf'] < item['vf']:
        uniqueSongs[key] = item

finalList = list(uniqueSongs.values())
finalList.sort(key=lambda x: x['vf'], reverse=True)

top50 = finalList[:50]
total_vf = sum(x['vf'] for x in top50)

print(f"TOTAL VF: {total_vf / 100:.3f}")

import json
with open('calc_top50.json', 'w', encoding='utf-8') as f:
    json.dump(top50, f, ensure_ascii=False, indent=2)
