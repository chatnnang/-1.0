with open('vaddict_user.html', 'r', encoding='utf-8') as f:
    text = f.read()
    count = text.count('<div class="tracks">')
    print('Track count in HTML:', count)
