import urllib.request
import urllib.parse
import re
import json

url = 'https://vaddict.b35.jp/user.php'
data = urllib.parse.urlencode({
    'c': '1',
    'player_id': 'SV-1255-6810',
    'dx': '0',
    'dt': '1', # ALL TRACKS
}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers={'User-Agent': 'Mozilla/5.0'})
try:
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
            elif 'comp_max' in medal_class or 'comp_ex' in medal_class: lamp = 'MXV'
            elif 'comp' in medal_class: lamp = 'COMP'
            
            grade = 'A'
            if score >= 9900000: grade = 'S'
            elif score >= 9800000: grade = 'AAA+'
            elif score >= 9700000: grade = 'AAA'
            elif score >= 9500000: grade = 'AA+'
            elif score >= 9300000: grade = 'AA'
            elif score >= 9000000: grade = 'A+'
            
            all_data.append({
                'title': title,
                'diff': diff,
                'score': score,
                'lamp': lamp,
                'grade': grade
            })
            
        with open('test_vaddict_data.json', 'w', encoding='utf-8') as f:
            json.dump(all_data, f, ensure_ascii=False, indent=2)
            
except Exception as e:
    print('Error:', e)
