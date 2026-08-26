import json
import re

with open('sdvx_db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

# Fix known mojibake titles in sdvx_db.json
fixes = {
    'Xroni\u66e6l X\u9f77ro': 'Xroni\u00e0l X\u00e9ro',
    'Xroni\u66e9r': 'Xroni\u00e8r',
    'AP\u9a69CALYPSE RAY': 'AP\u00d8CALYPSE RAY',
    'XHRONOXAPSUL\u9a67': 'XHRONOXAPSUL\u039e',
    'Bl\u9a6bmin\'': 'Bl\u221emin\'',
    'Sudde\u9a6aDeath': 'Sudde\u0418Death',
    'FIN4LE \u301c\u7d42\u6b62\u7dda\u306e\u5f7c\u65b9\u3078\u301c': 'FIN4LE \uff5e\u7d42\u6b62\u7dda\u306e\u5f7c\u65b9\u3078\uff5e',
    'HE4VEN \u301c\u5929\u8ecc\u9022\u96c5\u301c': 'HE4VEN \uff5e\u5929\u8ecc\u9022\u96c5\uff5e'
}

fixed_count = 0
new_db = {}
for k, v in db.items():
    if k in fixes:
        new_k = fixes[k]
        new_db[new_k] = v
        # also keep original as fallback
        new_db[k] = v
        fixed_count += 1
    else:
        new_db[k] = v

print(f'Fixed {fixed_count} mojibake titles in DB!')

with open('sdvx_db.json', 'w', encoding='utf-8') as f:
    json.dump(new_db, f, ensure_ascii=False, indent=2)
