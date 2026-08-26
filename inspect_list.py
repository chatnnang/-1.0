with open('list_dump.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
# check inputs and actions
print('Forms found:')
for m in re.finditer(r'<form\s+action=[\"\']([^\"\']*)[\"\']\s+method=[\"\']([^\"\']*)[\"\']>', text):
    print(m.groups())

# check select options (like version, level)
selects = re.findall(r'<select\s+name=[\"\']([^\"\']+)[\"\']>([\s\S]*?)</select>', text)
for name, options in selects:
    print('Select name:', name)
    opts = re.findall(r'value=[\"\']([^\"\']*)[\"\']>([^<]*)', options)
    print('  Opts:', [(v, opt.encode('unicode_escape').decode()) for v, opt in opts[:10]])
