import json

with open('zetaraku_sdvx.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

recent_songs = []
for song in data['songs']:
    rd = song.get('releaseDate', '')
    if rd and rd >= '2026-07-01':
        recent_songs.append(song)

print(f'Songs released since 2026-07-01: {len(recent_songs)}')
for s in recent_songs:
    print(s['releaseDate'], s['title'].encode('unicode_escape').decode(), [(sheet['difficulty'], sheet['levelValue']) for sheet in s['sheets']])
