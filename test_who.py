import json
with open('sdvx_db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)
with open('who_out.txt', 'w', encoding='utf-8') as out:
    for k in db:
        if 'Who' in k:
            out.write(k + '\n')
