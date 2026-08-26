with open('list_dump.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
inputs = re.findall(r'<input\s+[^>]*name=[\"\']([^\"\']+)[\"\'][^>]*>', text)
print('Inputs:', inputs)

selects = re.findall(r'<select[^>]*name=[\"\']([^\"\']+)[\"\'][^>]*>', text)
print('Selects:', selects)
