import json
with open('sdvx_db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)
print('L (SDVX ver.)' in db)
print('ULTIMATE INFLATION' in db)
