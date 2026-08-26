const fs = require('fs');
const db = JSON.parse(fs.readFileSync('sdvx_db.json', 'utf8'));

function normalizeTitle(title) {
  if (!title) return "";
  let str = title.replace(/[£Á-£Ú£á-£ú£°-£¹]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
  return str.toLowerCase().replace(/[\s\-_?¡£¡¢£¡£¿!?¢¾¢½¡Ú¡Ù"'\(\)\[\]¡º¡»¡¸¡¹~¢¦]/g, '');
}

const map = {};
for (const k in db) {
  const norm = normalizeTitle(k);
  if (map[norm]) {
    console.log('DUPLICATE NORM: ' + norm + ' => ' + map[norm] + ' AND ' + k);
  }
  map[norm] = k;
}
