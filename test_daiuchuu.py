import json
with open('sdvx_db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)
for k, v in db.items():
    if 'ÓÞéÔñµ' in k:
        print(k, v['levels'])
