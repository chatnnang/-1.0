import urllib.request
import re

url = 'https://arcade-songs.zetaraku.dev/sdvx'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as r:
    html = r.read().decode('utf-8')
    scripts = re.findall(r'<script[^>]*src=[\"\']([^\"\']+)[\"\']', html)
    print('Scripts:', scripts)

for s in scripts:
    if not s.startswith('http'):
        s_url = 'https://arcade-songs.zetaraku.dev' + s
    else:
        s_url = s
    try:
        req_s = urllib.request.Request(s_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req_s) as r_s:
            code = r_s.read().decode('utf-8')
            json_paths = re.findall(r'[\"\'][^\"\']*\.json[\"\']', code)
            print(s_url, json_paths[:5])
    except Exception as e:
        print(s_url, e)
