import json
import urllib.request
import urllib.parse
import re

url = 'https://vaddict.b35.jp/user.php'
vad_songs = []

for page in [1, 2]:
    data = urllib.parse.urlencode({'c': '1', 'player_id': 'SV-1255-6810', 'dx': '0', 'dt': '4', 'so': '8', 'p': str(page)})
    req = urllib.request.Request(url, data=data.encode('utf-8'), headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as r:
        html = r.read().decode('utf-8')
        tracks = html.split('<div class="tracks">')[1:]
        for track in tracks:
            title_m = re.search(r'<div class="music_name">(?:<span class="star">.*?</span>)?(.*?)</div>', track)
            title = title_m.group(1).strip() if title_m else 'Unknown'
            vf_m = re.search(r'単曲VF: ([\d\.]+)', track)
            vf = float(vf_m.group(1)) if vf_m else 0
            
            score_m = re.search(r'<div class="score">(\d+)</div>', track)
            score = int(score_m.group(1)) if score_m else 0
            
            vad_songs.append({'title': title, 'vf': vf, 'score': score})
            if len(vad_songs) == 50:
                break
    if len(vad_songs) == 50: break

with open('calc_top50.json', 'r', encoding='utf-8') as f:
    my_songs = json.load(f)

my_map = {s['title']: s for s in my_songs}

print("DIFFERENCES:")
for v in vad_songs:
    t = v['title']
    found = False
    for m_t, m_s in my_map.items():
        if t[:5] in m_t or m_t[:5] in t:
            if abs(v['vf'] - m_s['vf']) > 0.01:
                print(f"Vaddict: {t.encode('utf-8')} {v['vf']} {v['score']} | Mine: {m_s['vf']} {m_s['score']}")
            found = True
            break
    if not found:
        print(f"MISSING IN MINE: {t.encode('utf-8')} {v['vf']} {v['score']}")

for m in my_songs:
    t = m['title']
    found = False
    for v in vad_songs:
        if t[:5] in v['title'] or v['title'][:5] in t:
            found = True
            break
    if not found:
        print(f"EXTRA IN MINE: {t.encode('utf-8')} {m['vf']} {m['score']}")
