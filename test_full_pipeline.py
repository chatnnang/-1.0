import json
import re
import math

with open('sdvx_db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

def normalizeTitle(title):
    s = ''
    for char in title:
        code = ord(char)
        if 0xFF01 <= code <= 0xFF5E:
            s += chr(code - 0xFEE0)
        else:
            s += char
    return re.sub(r'[\s\-_・。、！？!?♥♡★☆\"\'\(\)\[\]『』「」~～〜ØΞ∞Λ△ΩИΣ驩驧驫驪]', '', s).lower()

normalizedDb = {normalizeTitle(k): v for k, v in db.items()}

with open('test_vaddict_data.json', 'r', encoding='utf-8') as f:
    scores = json.load(f)

unmatched = []
calculatedList = []

for item in scores:
    title = item['title']
    score = item['score']
    lamp = item['lamp']
    diff = item['diff']
    
    songInfo = db.get(title) or normalizedDb.get(normalizeTitle(title))
    if not songInfo:
        if score > 0: # only count played songs
            unmatched.append(title)
        continue
        
    dbDiff = diff
    if diff in ["GRV", "HVN", "VVD", "XCD", "INF"]:
        dbDiff = diff if diff in songInfo['levels'] else "INF"
    level = songInfo['levels'].get(dbDiff) or songInfo['levels'].get("MXM") or songInfo['levels'].get("EXH")
    
    if not level:
        continue
        
    gradeMult = 0.80
    if score >= 9900000: gradeMult = 1.05
    elif score >= 9800000: gradeMult = 1.02
    elif score >= 9700000: gradeMult = 1.00
    elif score >= 9500000: gradeMult = 0.97
    elif score >= 9300000: gradeMult = 0.94
    elif score >= 9000000: gradeMult = 0.91
    elif score >= 8700000: gradeMult = 0.88
    elif score >= 7500000: gradeMult = 0.85
    
    clearMult = 1.00
    if lamp == "PUC": clearMult = 1.10
    elif lamp == "UC": clearMult = 1.06
    elif lamp == "MXV" or lamp == "EX-HARD": clearMult = 1.04
    elif lamp == "HARD" or lamp == "COMP": clearMult = 1.02
    elif lamp == "CLEAR": clearMult = 1.00
    elif lamp == "PLAYED" or lamp == "PLAY": clearMult = 0.50
    
    raw_vf = (level * 20) * (score / 10000000) * gradeMult * clearMult
    vf = math.floor(raw_vf + 0.0001) / 10.0
    
    calculatedList.append({
        'title': title,
        'diff': diff,
        'level': level,
        'score': score,
        'vf': vf,
        'id': songInfo.get('id'),
        'imageName': songInfo.get('imageName')
    })

uniqueSongs = {}
for item in calculatedList:
    key = item['id'] or item['title']
    if key not in uniqueSongs or uniqueSongs[key]['vf'] < item['vf']:
        uniqueSongs[key] = item
    elif uniqueSongs[key]['vf'] == item['vf']:
        if item['score'] > uniqueSongs[key]['score']:
            uniqueSongs[key] = item

finalList = list(uniqueSongs.values())
finalList.sort(key=lambda x: (-x['vf'], -x['score'], -x['level']))

top50 = finalList[:50]
total_vf = sum(x['vf'] for x in top50) / 100

print(f"Total user scores processed: {len(scores)}")
print(f"Unmatched played songs count: {len(unmatched)}")
if unmatched:
    print("Unmatched samples:", unmatched[:5])
print(f"Calculated Top 50 Volforce: {total_vf:.3f}")

top50_missing_jacket = [x['title'] for x in top50 if not x['id'] and not x['imageName']]
print(f"Top 50 songs with missing jacket paths: {len(top50_missing_jacket)}")
