import re

with open('dev.html', 'r', encoding='utf-8') as f:
    dev_html = f.read()

# 1. Update Title and Headers
prod_html = dev_html.replace('<title>얼마썼냥 (DEV v1.3)</title>', '<title>🐱 얼마썼냥 v1.3 - 리듬게임 가계부 & 볼포스 트래커</title>')
prod_html = prod_html.replace('🐱 얼마썼냥 v1.3 (DEV)', '🐱 얼마썼냥 v1.3')

# 2. Remove DEV warning banner
prod_html = prod_html.replace('<div class=\"bg-fuchsia-600 text-white text-center text-[10px] font-bold py-1 rounded-full shadow-lg\">⚠️ 현재 [DEV 서버 v1.3]에서 테스트 중입니다.</div>', '')

# 3. Update Bookmarklet target URL to production
prod_html = prod_html.replace('https://chatnnang.github.io/-1.0/dev.html', 'https://chatnnang.github.io/-1.0/index.html')

# 4. Ensure SEO tags from old index.html are in <head>
seo_tags = '''
  <!-- Google Search Console 소유권 확인 -->
  <meta name=\"google-site-verification\" content=\"Utz3RiyWrD1MII6fJIEd4P6tuLXJMP59SYBWqFoFB8Y\" />

  <!-- SEO 메타태그 -->
  <meta name=\"description\" content=\"리듬게임 오락실 지출 기록 가계부 & 사운드 볼텍스(SDVX) 볼포스 VF50 성적 분석 트래커. 오락실 판수, 금액을 기록하고 볼포스를 정밀 계산하세요.\">
  <meta name=\"keywords\" content=\"얼마썼냥, 리듬게임, 가계부, 사운드볼텍스, SDVX, 볼포스, Volforce, VF50, 오락실, 지출기록\">
  <link rel=\"canonical\" href=\"https://chatnnang.github.io/-1.0/\">

  <!-- Open Graph -->
  <meta property=\"og:title\" content=\"🐱 얼마썼냥 - 리듬게임 가계부 & 볼포스 트래커\">
  <meta property=\"og:description\" content=\"오락실 지출 기록 + 사운드 볼텍스 볼포스 VF50 정밀 분석. 북마크릿 원클릭으로 성적을 불러오세요!\">
  <meta property=\"og:type\" content=\"website\">
  <meta property=\"og:url\" content=\"https://chatnnang.github.io/-1.0/\">
  <meta property=\"og:image\" content=\"https://chatnnang.github.io/-1.0/icon.png\">
'''

prod_html = prod_html.replace('<link rel=\"apple-touch-icon\" href=\"icon.png\">', '<link rel=\"apple-touch-icon\" href=\"icon.png\">\n' + seo_tags)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(prod_html)

print('Successfully generated production index.html!')
