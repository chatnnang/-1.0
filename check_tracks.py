with open('list_dump.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
print('Track count in list_dump:', len(re.findall(r'<div class=[\"\']track', text)))
rows = re.findall(r'<div class=[\"\']music_name[\"\']>([\s\S]*?)</div>', text)
print('Song titles found:', len(rows))
for r in rows[:5]:
    print(' ', r.strip().encode('unicode_escape').decode())
