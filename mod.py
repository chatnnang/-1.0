import json
with open('test_calc.py', 'r', encoding='utf-8') as f:
    text = f.read()

# remove all for loops printing at the bottom
text = text.split('print("TOP 5:")')[0]
text += "import json\nwith open('calc_top50.json', 'w', encoding='utf-8') as f:\n    json.dump(top50, f, ensure_ascii=False, indent=2)\n"

with open('test_calc_mod.py', 'w', encoding='utf-8') as f:
    f.write(text)
