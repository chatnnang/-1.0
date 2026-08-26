import json
import re
import math

with open('sdvx_db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

def normalizeTitle(title):
    str_title = ''
    for char in title:
        code = ord(char)
        if 0xFF01 <= code <= 0xFF5E:
            str_title += chr(code - 0xFEE0)
        else:
            str_title += char
    return re.sub(r'[\s\-_・。、！？!?♥♡★☆\"\'\(\)\[\]『』「」~～〜ØΞ∞Λ△ΩИΣ驩驧驫驪]', '', str_title).lower()

normalizedDb = {}
for k, v in db.items():
    normalizedDb[normalizeTitle(k)] = v

with open('test_vaddict_data.json', 'r', encoding='utf-8') as f:
    scores = json.load(f)

# Wait, test_vaddict_data.json lamp mapping was bad.
# Let's use the new scrape script!
