import json
import re
import html
import math

with open('sdvx_db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

def normalizeTitle(title):
    title = html.unescape(title)
    s = ''
    for char in title:
        code = ord(char)
        if 0xFF01 <= code <= 0xFF5E:
            s += chr(code - 0xFEE0)
        else:
            s += char
    return re.sub(r'[\s\-_・。、！？!?♥♡★☆\"\'\(\)\[\]『』「」~～〜ØΞ∞Λ△ΩИΣ驩驧驫驪]', '', s).lower()

normalizedDb = {normalizeTitle(k): v for k, v in db.items()}

with open('test_vaddict_data.json', 'r', encoding='utf-8') as f:
    scores = json.load(f)

unmatched = []
for item in scores:
    title = item['title']
    score = item['score']
    if score == 0: continue
    
    songInfo = db.get(title) or db.get(html.unescape(title)) or normalizedDb.get(normalizeTitle(title))
    if not songInfo:
        unmatched.append(title)

print(f'Unmatched played songs with html unescape: {len(unmatched)}')
if unmatched:
    print('Remaining unmatched:', unmatched)
