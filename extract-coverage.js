const fs = require('fs');
const path = require('path');

function getHtmlFiles(dir, fileList = []) {
  fs.readdirSync(dir).forEach(file => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      getHtmlFiles(p, fileList);
    } else if (p.endsWith('.html') && !p.endsWith('index.html')) {
      fileList.push(p);
    }
  });
  return fileList;
}

const htmlFiles = getHtmlFiles('C:/Users/nicol/recreopago-frontend/coverage/recreopago');
const missing = [];

htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = [...content.matchAll(/<span class=\"strong\">\s*([\d.]+)%\s*<\/span>/g)];
  if (matches.length >= 4) {
    const statements = parseFloat(matches[0][1]);
    const branches = parseFloat(matches[1][1]);
    const functions = parseFloat(matches[2][1]);
    const lines = parseFloat(matches[3][1]);
    if (statements < 100 || branches < 100 || functions < 100 || lines < 100) {
      missing.push({ file: file.replace('C:\\Users\\nicol\\recreopago-frontend\\coverage\\recreopago\\', '').replace('.html', ''), statements, branches, functions, lines });
    }
  }
});

missing.sort((a,b) => (a.statements + a.branches + a.functions + a.lines) - (b.statements + b.branches + b.functions + b.lines));

fs.writeFileSync('C:/Users/nicol/.gemini/antigravity-cli/brain/0f196cbf-29fc-44d5-965f-e3cd800cbb30/coverage_missing.json', JSON.stringify(missing, null, 2), 'utf8');
console.log(`Saved ${missing.length} files to coverage_missing.json`);
