import json
with open('test_diag.py', 'r', encoding='utf-8') as f: text = f.read()
text += """
with open('vaddict_top50.txt', 'r', encoding='utf-8') as f:
    vad_lines = f.readlines()
vad_map = {}
for line in vad_lines:
    if ':' not in line: continue
    parts = line.rsplit(':', 1)
    title = parts[0].split('.', 1)[1].strip()
    vf = float(parts[1].strip())
    vad_map[title] = vf

for i, item in enumerate(top50):
    t = item['title']
    my_vf = item['vf']
    # fuzzy match
    found = False
    for v_title, v_vf in vad_map.items():
        if t[:5] in v_title or v_title[:5] in t:
            if abs(my_vf - v_vf) > 0.01:
                print(f"Diff! {t.encode('utf-8')}: Mine={my_vf}, Vad={v_vf}")
            found = True
            break
    if not found:
        print(f"Not found in vad_map: {t.encode('utf-8')}: Mine={my_vf}")
"""
with open('test_diff.py', 'w', encoding='utf-8') as f: f.write(text)
