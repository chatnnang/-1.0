import json
import re

def normalize(title):
    str_title = ''
    for char in title:
        code = ord(char)
        if 0xFF01 <= code <= 0xFF5E:
            str_title += chr(code - 0xFEE0)
        else:
            str_title += char
    return re.sub(r'[\s\-_・。、！？!?♥♡★☆\"\'\(\)\[\]『』「」~～]', '', str_title).lower()

with open('sdvx_db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

for k, v in db.items():
    nk = normalize(k)
    if len(nk) <= 3:
        pass
        #print(nk, k)
