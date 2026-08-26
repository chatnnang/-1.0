import urllib.request
import urllib.parse
import re

url = 'https://vaddict.b35.jp/user.php'
data = urllib.parse.urlencode({'c': '1', 'player_id': 'SV-1255-6810', 'dx': '0', 'dt': '4', 'so': '8'})
req = urllib.request.Request(url, data=data.encode('utf-8'), headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as r:
    html = r.read().decode('utf-8')
    tracks = html.split('<div class="tracks">')[1:]
    
    vf_sum = sum([int(float(re.search(r'単曲VF: ([\d\.]+)', t).group(1))*10) for t in tracks])
    
data2 = urllib.parse.urlencode({'c': '1', 'player_id': 'SV-1255-6810', 'dx': '0', 'dt': '4', 'so': '8', 'p': '2'})
req2 = urllib.request.Request(url, data=data2.encode('utf-8'), headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req2) as r2:
    html2 = r2.read().decode('utf-8')
    tracks2 = html2.split('<div class="tracks">')[1:]
    
    val = int(float(re.search(r'単曲VF: ([\d\.]+)', tracks2[0]).group(1))*10)
    vf_sum += val
    
print("EXACT VADDICT TOTAL VF:", vf_sum / 1000.0)
