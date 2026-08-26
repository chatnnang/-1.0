import re
t1 = 'FIN4LE \xef\xbd\x9e\xe7\xb5\x82\xe6\xad\xa2\xe7\xb7\x9a\xe3\x81\xae\xe5\xbd\xbc\xe6\x96\xb9\xe3\x81\xb8\xef\xbd\x9e'
t2 = 'FIN4LE \xe3\x80\x9c\xe7\xb5\x82\xe6\xad\xa2\xe7\xb7\x9a\xe3\x81\xae\xe5\xbd\xbc\xe6\x96\xb9\xe3\x81\xb8\xe3\x80\x9c'
def n1(t):
    s = ''
    for char in t:
        code = ord(char)
        if 0xFF01 <= code <= 0xFF5E:
            s += chr(code - 0xFEE0)
        else:
            s += char
    return re.sub(r'[\s\-_・。、！？!?♥♡★☆\"\'\(\)\[\]『』「」~～]', '', s).lower()

print('Old normalize:')
print('t1:', n1(t1).encode('utf-8'))
print('t2:', n1(t2).encode('utf-8'))

def n2(t):
    s = ''
    for char in t:
        code = ord(char)
        if 0xFF01 <= code <= 0xFF5E:
            s += chr(code - 0xFEE0)
        else:
            s += char
    return re.sub(r'[\s\-_・。、！？!?♥♡★☆\"\'\(\)\[\]『』「」~～〜]', '', s).lower()

print('New normalize:')
print('t1:', n2(t1).encode('utf-8'))
print('t2:', n2(t2).encode('utf-8'))

