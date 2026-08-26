import time
import re

with open('dev.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the specific bookmarklet logic to add delay
old_str = "allData.push({title:title,diff:d.toUpperCase(),score:score,lamp:getL(imgs[0].src),grade:getG(imgs[1].src)});});});}"
new_str = "allData.push({title:title,diff:d.toUpperCase(),score:score,lamp:getL(imgs[0].src),grade:getG(imgs[1].src)});});});await new Promise(r=>setTimeout(r,400));}"
text = text.replace(old_str, new_str)

with open('dev.html', 'w', encoding='utf-8') as f:
    f.write(text)
