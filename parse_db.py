import xml.etree.ElementTree as ET
import json

with open(r'D:\NABLA\SOUND VOLTEX NABLA\data\others\music_db.xml', 'r', encoding='shift_jis', errors='replace') as f:
    xml_data = f.read()

xml_data = xml_data.replace('encoding="shift-jis"', 'encoding="utf-8"')
root = ET.fromstring(xml_data)

diff_map = {'novice': 'NOV', 'advanced': 'ADV', 'exhaust': 'EXH', 'infinite': 'INF', 'maximum': 'MXM'}

db = {}
count = 0

for music in root.findall('music'):
    info = music.find('info')
    if info is None: continue
    title_el = info.find('title_name')
    if title_el is None or not title_el.text: continue
    title = title_el.text

    music_id = str(music.get('id')).zfill(4)
    
    levels = {}
    difficulty = music.find('difficulty')
    if difficulty is not None:
        for xml_tag, diff_name in diff_map.items():
            diff_node = difficulty.find(xml_tag)
            if diff_node is not None:
                difnum_node = diff_node.find('difnum')
                if difnum_node is not None and difnum_node.text:
                    level_val = int(difnum_node.text)
                    if level_val > 0:
                        levels[diff_name] = level_val / 10.0
    
    if levels:
        db[title] = {'id': music_id, 'levels': levels}
        count += 1

out_path = r'C:\Users\junho\.gemini\antigravity\scratch\howmuch\sdvx_db_new.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(db, f, ensure_ascii=False, indent=2)

print(f'Parsed {count} songs!')
