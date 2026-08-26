import urllib.request
import re

url = 'https://vaddict.b35.jp/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as r:
    html = r.read().decode('utf-8')

for m in re.finditer(r'javascript:\(function\(\)\{[\s\S]*?\}\)\(\);', html):
    print(m.group(0))
