with open('jump2.html', 'r', encoding='utf-8') as f:
    text = f.read()
    print("Length:", len(text))
    print("Track count:", text.count('<div class="tracks">'))
