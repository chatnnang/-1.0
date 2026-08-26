import json

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

merged_db = dict(old_db)

new_added = 0
levels_updated = 0

for song in zeta['songs']:
    title = song['title']
    sheets = song['sheets']
    image_name = song.get('imageName') or ''
    
    levels = {}
    for s in sheets:
        d_name = diff_map.get(s['difficulty'])
        if d_name and s.get('levelValue') is not None:
            levels[d_name] = float(s['levelValue'])
            
    if not levels:
        continue
        
    if title in merged_db:
        # Merge levels (giving preference to exact decimal constants if old was integer, or keeping existing)
        for d, lvl in levels.items():
            if d not in merged_db[title]['levels']:
                merged_db[title]['levels'][d] = lvl
            else:
                # If old level was integer (e.g. 19.0) and new is decimal (e.g. 19.5), update
                old_lvl = merged_db[title]['levels'][d]
                if old_lvl == int(old_lvl) and lvl != int(lvl):
                    merged_db[title]['levels'][d] = lvl
        if image_name:
            merged_db[title]['imageName'] = image_name
        levels_updated += 1
    else:
        merged_db[title] = {
            'id': song.get('songId') or '',
            'imageName': image_name,
            'levels': levels
        }
        new_added += 1

print(f'Original songs: {len(old_db)}')
print(f'Merged total songs: {len(merged_db)}')
print(f'New songs added: {new_added}')

with open('sdvx_db.json', 'w', encoding='utf-8') as f:
    json.dump(merged_db, f, ensure_ascii=False, indent=2)

print('Successfully saved to sdvx_db.json with UTF-8 encoding!')
