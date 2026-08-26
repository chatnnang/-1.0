import json

with open('zetaraku_sdvx.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

with open('last_songs.txt', 'w', encoding='utf-8') as f:
    for s in data['songs'][-50:]:
        f.write(f"{s['songId']} | {s['title']} | {s.get('version')} | isNew:{s.get('isNew')} | {[(sh['difficulty'], sh['levelValue']) for sh in s['sheets']]}\n")

print('Wrote last_songs.txt!')
