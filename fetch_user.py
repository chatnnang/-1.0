import urllib.request

url = 'https://vaddict.b35.jp/user.php?player_id=SV-1255-6810'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        # Let's search for json data in the html
        with open('vaddict_user.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print('Saved to vaddict_user.html. Size:', len(html))
except Exception as e:
    print('Error:', e)
