import urllib.request
import urllib.parse
import re
import json
import math

url = 'https://vaddict.b35.jp/user.php'
data = urllib.parse.urlencode({
    'c': '1',
    'player_id': 'SV-1255-6810',
    'dx': '0',
    'dt': '1',
}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as response:
    html = response.read().decode('utf-8')

tracks = html.split('<div class="tracks">')[1:]
all_data = []
for track in tracks:
    title_m = re.search(r'<div class="music_name">(?:<span class="star">.*?</span>)?(.*?)</div>', track)
    title = title_m.group(1).strip() if title_m else 'Unknown'
    
    diff_m = re.search(r'<span class="dif [^"]+">([^<]+)</span>', track)
    diff = diff_m.group(1) if diff_m else 'EXH'
    
    score_m = re.search(r'<div class="score">(\d+)</div>', track)
    score = int(score_m.group(1)) if score_m else 0
    
    medal_m = re.search(r'<div class="clear_medal ([^"]+)">', track)
    medal_class = medal_m.group(1) if medal_m else ''
    
    lamp = 'PLAY'
    if 'per' in medal_class: lamp = 'PUC'
    elif 'uc' in medal_class: lamp = 'UC'
    elif 'comp_max' in medal_class: lamp = 'MXV'
    elif 'comp_ex' in medal_class: lamp = 'HARD'
    elif 'comp' in medal_class: lamp = 'CLEAR'
    
    all_data.append({
        'title': title,
        'diff': diff,
        'score': score,
        'lamp': lamp
    })

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

calculatedList = []

for item in all_data:
    title = item['title']
    diff = item['diff']
    score = item['score']
    lamp = item['lamp']
    
    songInfo = db.get(title) or normalizedDb.get(normalizeTitle(title))
    if songInfo:
        songId = songInfo.get('id')
        
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
        elif lamp == "MXV": clearMult = 1.04
        elif lamp == "HARD": clearMult = 1.02
        elif lamp == "CLEAR": clearMult = 1.00
        
        raw_vf = (level * 20) * (score / 10000000) * gradeMult * clearMult
        vf = math.floor(raw_vf + 0.0001) / 10.0
        
        calculatedList.append({
            'id': songId,
            'title': title,
            'diff': diff,
            'score': score,
            'vf': vf,
            'level': level,
            'raw_diff': dbDiff,
            'lamp': lamp
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
total_vf = sum(x['vf'] for x in top50)

print(f"TOTAL VF: {total_vf / 100:.3f}")

with open('vaddict_top50.txt', 'r', encoding='utf-8') as f:
    vad_lines = f.readlines()
vad_map = {}
for line in vad_lines:
    if ':' not in line: continue
    parts = line.rsplit(':', 1)
    title = parts[0].split('.', 1)[1].strip()
    vf = float(parts[1].strip())
    vad_map[title] = vf

for i, item in enumerate(top50):
    t = item['title']
    my_vf = item['vf']
    # fuzzy match
    found = False
    for v_title, v_vf in vad_map.items():
        if t[:5] in v_title or v_title[:5] in t:
            if abs(my_vf - v_vf) > 0.01:
                print(f"Diff! {t.encode('utf-8')}: Mine={my_vf}, Vad={v_vf}")
            found = True
            break
    if not found:
        print(f"Not found in vad_map: {t.encode('utf-8')}: Mine={my_vf}")
