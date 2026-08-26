
import json
with open('sdvx_db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)
with open('192.txt', 'w', encoding='utf-8') as out:
    for k, v in db.items():
        if 19.2 in v['levels'].values():
            out.write(k + ' ' + str(v['levels']) + '\n')

