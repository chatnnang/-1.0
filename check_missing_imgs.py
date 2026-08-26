import json

with open('sdvx_db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

missing = [k for k, v in db.items() if not v.get('imageName')]
print(f"Missing imageName count: {len(missing)}")
with open('missing_images.txt', 'w', encoding='utf-8') as f:
    for m in missing:
        f.write(f"{m} | ID:{db[m].get('id')}\n")

print("Wrote missing_images.txt!")
