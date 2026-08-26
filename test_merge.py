import json
import re

with open('sdvx_db.json', 'r', encoding='utf-8') as f:
    old_db = json.load(f)

with open('zetaraku_sdvx.json', 'r', encoding='utf-8') as f:
    zeta = json.load(f)

diff_map = {
    'novice': 'NOV',
    'advanced': 'ADV',
    'exhaust': 'EXH',
    'maximum': 'MXM',
    'infinite': 'INF',
    'gravity': 'GRV',
    'heavenly': 'HVN',
    'vivid': 'VVD',
    'exceed': 'XCD',
    'ultimate': 'UTM',
    'nabla': 'NBL'
}

new_db = dict(old_db) # start with old db

added_count = 0
updated_count = 0

for song in zeta['songs']:
    title = song['title']
    sheets = song['sheets']
    
    levels = {}
    for s in sheets:
        d_name = diff_map.get(s['difficulty'])
        if d_name and s.get('levelValue') is not None:
            levels[d_name] = float(s['levelValue'])
            
    if not levels:
        continue
        
    if title in new_db:
        # update levels and cover if available
        new_db[title]['levels'].update(levels)
        if 'imageName' in song:
            new_db[title]['imageName'] = song['imageName']
        updated_count += 1
    else:
        new_db[title] = {
            'id': song.get('songId') or '',
            'imageName': song.get('imageName') or '',
            'levels': levels
        }
        added_count += 1

print(f'Old DB total songs: {len(old_db)}')
print(f'New DB total songs: {len(new_db)}')
print(f'Updated songs: {updated_count}, Added new songs: {added_count}')

with open('sdvx_db_merged.json', 'w', encoding='utf-8') as f:
    json.dump(new_db, f, ensure_ascii=False, indent=2)
