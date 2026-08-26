import urllib.request
import re

url = 'https://arcade-songs.zetaraku.dev/_nuxt/bc60bcb.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as r:
    js = r.read().decode('utf-8')
    for m in re.finditer(r'dataSourceUrl', js):
        start = max(0, m.start() - 100)
        end = min(len(js), m.end() + 100)
        print(js[start:end])
