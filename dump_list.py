import urllib.request
import re
import json

url = 'https://vaddict.b35.jp/list.php'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as r:
    html = r.read().decode('utf-8')

with open('list_dump.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('Dumped list_dump.html, length:', len(html))
