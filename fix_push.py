import re

with open('app_dev.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the push to include id
old_push = "calculatedList.push({\n          title: item.title,\n          diff: item.diff,\n          score: score,\n          vf: vf\n        });"
new_push = "calculatedList.push({\n          id: songId,\n          title: item.title,\n          diff: item.diff,\n          score: score,\n          vf: vf\n        });"

text = text.replace(old_push, new_push)

with open('app_dev.js', 'w', encoding='utf-8') as f:
    f.write(text)

