import re

with open('dev.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Current getL in bookmarklet:
# let getL=(s)=>{if(s.includes('per'))return 'PUC';if(s.includes('uc'))return 'UC';if(s.includes('comp_ex')||s.includes('comp_max'))return 'MXV';if(s.includes('comp'))return 'COMP';return 'PLAY';};

# New getL:
new_getL = "let getL=(s)=>{if(s.includes('per'))return 'PUC';if(s.includes('uc'))return 'UC';if(s.includes('comp_max'))return 'MXV';if(s.includes('comp_ex'))return 'HARD';if(s.includes('comp'))return 'CLEAR';return 'PLAY';};"

text = re.sub(r'let getL=\(s\)=>{.*?return \'PLAY\';};', new_getL, text)

with open('dev.html', 'w', encoding='utf-8') as f:
    f.write(text)
