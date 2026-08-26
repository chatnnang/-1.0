import re

with open('vaddict_top50.html', 'r', encoding='utf-8') as f:
    html = f.read()

tracks = html.split('<div class="tracks">')[1:]
with open('vaddict_top50.txt', 'w', encoding='utf-8') as out:
    for i, track in enumerate(tracks):
        title_m = re.search(r'<div class="music_name">(?:<span class="star">.*?</span>)?(.*?)</div>', track)
        title = title_m.group(1).strip() if title_m else 'Unknown'
        vf_m = re.search(r'単曲VF: ([\d\.]+)', track)
        vf = vf_m.group(1) if vf_m else '0'
        out.write(f'{i+1}. {title} : {vf}\n')
