import re

with open('dev.html', 'r', encoding='utf-8') as f:
    text = f.read()

bookmarklet = (
    "javascript:(async function(){"
    "alert('성적 데이터를 수집합니다.\\n서버 튕김 방지를 위해 천천히 수집하므로 약 40~50초 정도 소요됩니다.\\n브라우저 탭 제목에 진행도가 표시되니 완료될 때까지 기다려주세요!');"
    "let allData=[];let maxP=1;"
    "let opts=document.querySelectorAll('#search_page option');"
    "if(opts.length) maxP=parseInt(opts[opts.length-1].value);"
    "let diffs=['nov','adv','exh','mxm','inf','grv','hvn','vvd','xcd'];"
    "let getG=(s)=>{if(s.includes('s.png'))return 'S';if(s.includes('aaa_plus'))return 'AAA+';if(s.includes('aaa'))return 'AAA';if(s.includes('aa_plus'))return 'AA+';if(s.includes('aa.'))return 'AA';if(s.includes('a_plus'))return 'A+';if(s.includes('a.'))return 'A';if(s.includes('b.'))return 'B';if(s.includes('c.'))return 'C';return 'D';};"
    "let getL=(s)=>{if(s.includes('per'))return 'PUC';if(s.includes('uc'))return 'UC';if(s.includes('comp_ex')||s.includes('comp_max'))return 'MXV';if(s.includes('comp'))return 'COMP';return 'PLAY';};"
    "let origTitle=document.title;"
    "for(let p=1;p<=maxP;p++){"
    "  document.title='('+p+'/'+maxP+') 수집중...';"
    "  let res=await fetch('/game/sdvx/vii/playdata/musicdata/index.html?page='+p);"
    "  let text=await res.text();"
    "  let doc=new DOMParser().parseFromString(text,'text/html');"
    "  let rows=doc.querySelectorAll('tr.data_col');"
    "  rows.forEach(r=>{"
    "    let tEl=r.querySelector('.music .title a');if(!tEl)return;"
    "    let title=tEl.innerText.trim();"
    "    diffs.forEach(d=>{"
    "      let cell=r.querySelector('td.'+d);if(!cell)return;"
    "      let val=cell.innerText.trim();if(val==='0'||!val)return;"
    "      let score=parseInt(val);if(isNaN(score))return;"
    "      let imgs=cell.querySelectorAll('img');if(imgs.length<2)return;"
    "      allData.push({title:title,diff:d.toUpperCase(),score:score,lamp:getL(imgs[0].src),grade:getG(imgs[1].src)});"
    "    });"
    "  });"
    "  await new Promise(r=>setTimeout(r,1200));"
    "}"
    "document.title=origTitle;"
    "let win=window.open('https://chatnnang.github.io/-1.0/dev.html','_blank');"
    "if(!win)return alert('팝업 차단이 설정되어 있습니다. 팝업을 허용해주세요!');"
    "let tries=0;"
    "let timer=setInterval(()=>{"
    "  win.postMessage({type:'SDVX_PARSE_DATA',payload:allData},'*');"
    "  tries++;if(tries>15)clearInterval(timer);"
    "},500);"
    "})();"
)

new_text = re.sub(r'(<code id=\"bookmarkletCode\"[^>]*>).*?(</code>)', r'\g<1>' + bookmarklet + r'\g<2>', text, flags=re.DOTALL)

with open('dev.html', 'w', encoding='utf-8') as f:
    f.write(new_text)

