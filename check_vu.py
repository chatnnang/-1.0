import re
with open('vaddict_user.html', 'r', encoding='utf-8') as f:
    text = f.read()

tracks = text.split('<div class="tracks">')[1:]
for track in tracks:
    title_m = re.search(r'<div class="music_name">(?:<span class="star">.*?</span>)?(.*?)</div>', track)
    title = title_m.group(1).strip() if title_m else 'Unknown'
    vf_m = re.search(r'단곡VF: ([\d\.]+)', track)
    vf = vf_m.group(1) if vf_m else '0'
    print(title, vf)
