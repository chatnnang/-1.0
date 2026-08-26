import json
with open('sdvx_db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

missing = [k for k, v in db.items() if not v.get('imageName')]
with open('remaining_missing.txt', 'w', encoding='utf-8') as f:
    for m in missing:
        f.write(f"{m} | ID: {db[m].get('id')}\n")
print(f"Remaining: {len(missing)}")
