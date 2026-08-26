import json
import re
import html
import unicodedata

def normalizeTitle(title):
    title = html.unescape(title or '')
    title = unicodedata.normalize('NFD', title)
    title = ''.join(c for c in title if unicodedata.category(c) != 'Mn')
    s = ''
    for char in title:
        code = ord(char)
        if 0xFF01 <= code <= 0xFF5E:
            s += chr(code - 0xFEE0)
        else:
            s += char
    return re.sub(r'[\s\-_・。、！？!?♥♡★☆\"\'\(\)\[\]『』「」~～〜ØΞ∞Λ△ΩИΣ驩驧驫驪曇齒暘齶]', '', s).lower()

with open('sdvx_db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

with open('zetaraku_sdvx.json', 'r', encoding='utf-8') as f:
    zeta = json.load(f)

norm_zeta = {}
for s in zeta['songs']:
    norm_zeta[normalizeTitle(s['title'])] = s

matched_count = 0
for title, info in db.items():
    if not info.get('imageName') or not info['imageName'].endswith('.png'):
        nt = normalizeTitle(title)
        if nt in norm_zeta:
            info['imageName'] = norm_zeta[nt]['imageName']
            matched_count += 1

print(f"Matched and fixed {matched_count} missing imageNames!")

remaining_missing = [k for k, v in db.items() if not v.get('imageName')]
print(f"Remaining missing imageNames: {len(remaining_missing)}")

with open('sdvx_db.json', 'w', encoding='utf-8') as f:
    json.dump(db, f, ensure_ascii=False, indent=2)

print("Saved sdvx_db.json!")
