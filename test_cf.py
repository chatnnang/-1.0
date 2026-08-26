import urllib.request
import json

url = 'https://dp4p6x0xfi5o9.cloudfront.net/sdvx/data.json'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as r:
    data = json.loads(r.read().decode('utf-8'))
    print('Keys:', list(data.keys()))
    print('Songs count:', len(data.get('songs', [])))
    print('First song:', data['songs'][0])
    print('Last song:', data['songs'][-1])

with open('zetaraku_sdvx.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print('Saved zetaraku_sdvx.json!')
