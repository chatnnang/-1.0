with open('dev.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("let diffs=['nov','adv','exh','mxm','inf','ult'];", "let diffs=['nov','adv','exh','mxm','inf','grv','hvn','vvd','xcd'];")

with open('dev.html', 'w', encoding='utf-8') as f:
    f.write(text)
