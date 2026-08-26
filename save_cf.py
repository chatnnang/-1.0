import json
import urllib.request

url = 'https://dp4p6x0xfi5o9.cloudfront.net/sdvx/data.json'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as r:
    data = json.loads(r.read().decode('utf-8'))

with open('zetaraku_sdvx.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('Update time:', data.get('updateTime'))
print('Song count:', len(data.get('songs', [])))
print('Sample song keys:', list(data['songs'][-1].keys()))
print('Sample song title:', data['songs'][-1]['title'].encode('unicode_escape').decode())
print('Sample song sheets:', data['songs'][-1]['sheets'])
