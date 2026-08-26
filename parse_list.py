import urllib.request
import re

url = 'https://vaddict.b35.jp/list.php'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as r:
    html = r.read().decode('utf-8')

forms = re.findall(r'<form[\s\S]*?</form>', html)
for f in forms:
    print('FORM:', f[:300])

links = re.findall(r'<a href=[\"\']([^\"\']+)[\"\']>(.*?)</a>', html)
for l, text in links[:20]:
    print(l, repr(text))
