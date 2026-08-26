import json
import re

def normalize(t):
    # Convert to lowercase
    t = t.lower()
    # Convert full-width alphanumeric to half-width
    # (A simple translation for ASCII range)
    t = ''.join([chr(ord(c) - 0xFEE0) if 0xFF01 <= ord(c) <= 0xFF5E else c for c in t])
    # Remove spaces and common punctuation
    t = re.sub(r'[\s\-_?¡£¡¢£¡£¿!?¢¾¢½¡Ú¡Ù\"\']', '', t)
    return t

with open('sdvx_db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

norm_db = {}
for k in db:
    norm_db[normalize(k)] = k

# Test
print('ULTIMATE INFLATION ->', norm_db.get(normalize('ULTIMATE INFLATION')))
print('Zany Arcadia "E" ->', norm_db.get(normalize('Zany Arcadia "E"')))
