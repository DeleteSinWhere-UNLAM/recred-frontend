const fs = require('fs');

try {
  const content = fs.readFileSync('errores_karma.txt', 'utf16le');
  const lines = content.split('\n');
  const failures = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    // Remove ansi codes
    line = line.replace(/\u001b\[\d+m/g, '').replace(/\u001b\[\d+[A-Z]/g, '');
    if (line.includes('FAILED') && !line.includes('Executed')) {
      failures.push('');
      failures.push(line);
      // capture next lines until empty
      let j = i + 1;
      while (j < lines.length && lines[j].trim() !== '' && !lines[j].includes('Executed')) {
        let errLine = lines[j].trim().replace(/\u001b\[\d+m/g, '').replace(/\u001b\[\d+[A-Z]/g, '');
        failures.push(errLine);
        j++;
      }
      i = j - 1;
    }
  }

  fs.writeFileSync('errores_karma_parsed_clean.json', JSON.stringify(failures, null, 2), 'utf8');
  console.log(`Saved ${failures.length} lines of clean failures to errores_karma_parsed_clean.json`);
} catch (e) {
  console.error(e);
}
