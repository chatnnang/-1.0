import urllib.request
import re
import urllib.parse

url = 'https://vaddict.b35.jp/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as r:
    html = r.read().decode('utf-8')

for m in re.finditer(r'<textarea[^>]*>([\s\S]*?)</textarea>', html):
    print('TEXTAREA:')
    print(m.group(1)[:500])
