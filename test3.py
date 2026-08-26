import json
with open('sdvx_db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)
for k in db:
    if 'INFLAT' in k.upper():
        print(k)
