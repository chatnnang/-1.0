with open('get_arcade.py', 'r', encoding='utf-8') as f: pass
import urllib.request
import re

url = 'https://arcade-songs.zetaraku.dev/_nuxt/5e93a10.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as r:
    js = r.read().decode('utf-8')
    # print context around data.json
    for m in re.finditer(r'data\.json', js):
        start = max(0, m.start() - 100)
        end = min(len(js), m.end() + 100)
        print(js[start:end])
