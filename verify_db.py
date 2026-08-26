import json
import os

with open('sdvx_db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

print(f"Total songs in sdvx_db.json: {len(db)}")

missing_image = 0
missing_levels = 0
invalid_levels = 0
has_image_name = 0
has_id = 0

for title, info in db.items():
    if not info.get('levels'):
        missing_levels += 1
    else:
        for diff, lvl in info['levels'].items():
            if not isinstance(lvl, (int, float)) or lvl <= 0:
                invalid_levels += 1
                
    if info.get('imageName'):
        has_image_name += 1
    if info.get('id'):
        has_id += 1
    if not info.get('imageName') and not info.get('id'):
        missing_image += 1

print(f"Songs with imageName: {has_image_name}")
print(f"Songs with id: {has_id}")
print(f"Songs completely missing image identifiers: {missing_image}")
print(f"Songs missing levels: {missing_levels}")
print(f"Invalid levels: {invalid_levels}")
