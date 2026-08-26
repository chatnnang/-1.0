import urllib.request
import re

url = 'https://vaddict.b35.jp/jump.php?mid=2&player_id=SV-1255-6810'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        
        track_blocks = html.split('<div class="tracks">')[1:]
        print(f'Found {len(track_blocks)} tracks!')
        
        vf_sum = 0
        for i, block in enumerate(track_blocks[:50]):
            title_m = re.search(r'<div class="music_name">(?:<span class="star">.*?</span>)?(.*?)</div>', block)
            title = title_m.group(1).strip() if title_m else 'Unknown'
            
            vf_m = re.search(r'VF: ([\d\.]+)', block)
            vf = float(vf_m.group(1)) if vf_m else 0.0
            
            diff_m = re.search(r'<span class="dif [^"]+">([^<]+)</span>', block)
            diff = diff_m.group(1) if diff_m else ''
            
            score_m = re.search(r'<div class="score">(\d+)</div>', block)
            score = score_m.group(1) if score_m else ''
            
            print(f'{i+1}. {title} [{diff}] - Score: {score} - VF: {vf}')
            vf_sum += int(vf * 10)
            
        print('Total VF Sum from HTML:', vf_sum / 1000)
except Exception as e:
    print('Error:', e)
