import json
with open('sdvx_db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)
targets = ['Ardenok', 'Zany Arcadia "E"', 'Macuilxochitl (Latin Jazz Mix)', 'I L (SDVX ver.)', 'MAYHEM', 'ULTIMATE INFLATION', 'Xinca']
for t in targets:
    if t in db:
        print('FOUND: ' + t)
    else:
        found = False
        for k in db.keys():
            if t.lower()[:5] in k.lower():
                print('MISSING ' + t + ' - Did you mean: ' + k + '?')
                found = True
                break
        if not found:
            print('COMPLETELY MISSING: ' + t)
