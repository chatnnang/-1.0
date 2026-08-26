import urllib.request
import re

url = 'https://vaddict.b35.jp/list.php'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as r:
        html = r.read().decode('utf-8')
        print('list.php length:', len(html))
        print(html[:1000])
except Exception as e:
    print('Error:', e)
