import urllib.request
import re

url = 'https://vaddict.b35.jp/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as r:
        html = r.read().decode('utf-8')
        links = re.findall(r'href=[\"\']([^\"\']+)[\"\']', html)
        print('Links on Vaddict home:', set(links))
except Exception as e:
    print('Error:', e)
