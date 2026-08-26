import json
with open('sdvx_db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

missing = ['神罰', '大宇宙ステージ', 'ΕΛΠΙΣ', 'Legendary Road', 'Sailing Force', 'Innocent Azure', 'Distorted Floor']
with open('missing_out.txt', 'w', encoding='utf-8') as out:
    for m in missing:
        found = False
        for k in db:
            if m.lower() in k.lower():
                out.write('Found: ' + k + '\n')
                found = True
        if not found:
            out.write('MISSING: ' + m + '\n')
