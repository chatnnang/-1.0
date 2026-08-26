import time
import re

ts = str(int(time.time()))
with open('dev.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r'src=\"app_dev\.js(\?v=\d+)?\"', f'src=\"app_dev.js?v={ts}\"', text)

with open('dev.html', 'w', encoding='utf-8') as f:
    f.write(text)

with open('app_dev.js', 'r', encoding='utf-8') as f:
    js = f.read()

js = re.sub(r'fetch\(\'sdvx_db\.json(\?v=\d+)?\'\)', f'fetch(\'sdvx_db.json?v={ts}\')', js)

with open('app_dev.js', 'w', encoding='utf-8') as f:
    f.write(js)
