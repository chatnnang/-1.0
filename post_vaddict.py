import urllib.request
import urllib.parse
import re

url = 'https://vaddict.b35.jp/user.php'
data = urllib.parse.urlencode({
    'c': '1',
    'player_id': 'SV-1255-6810',
    'dx': '0', # Normal score
    'dt': '4', # VOLFORCE対象トラックのみ表示 (Show only VOLFORCE target tracks!)
    'so': '8'  # 単曲VF・降順 (Single VF Descending)
}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        
        # Save for reference
        with open('vaddict_top50.html', 'w', encoding='utf-8') as f:
            f.write(html)
        
        tracks = html.split('<div class="tracks">')[1:]
        print(f'Found {len(tracks)} tracks!')
        
        for i, track in enumerate(tracks[:5]):
            title_m = re.search(r'<div class="music_name">(?:<span class="star">.*?</span>)?(.*?)</div>', track)
            title = title_m.group(1).strip() if title_m else 'Unknown'
            vf_m = re.search(r'単曲VF: ([\d\.]+)', track)
            vf = vf_m.group(1) if vf_m else '0'
            print(title, vf)
except Exception as e:
    print('Error:', e)
