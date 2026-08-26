import json
with open('test_vaddict_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
for item in data:
    if item['score'] == 9934230:
        print('Found 9934230:', item['title'].encode('utf-8'))
