const fs = require('fs');

const files = [
  'src/app/features/adelanto/adelanto.css',
  'src/app/features/estadistica/estadistica.page.css',
  'src/app/features/favoritos/favoritos.page.css',
  'src/app/features/favoritos-alumno/favoritos-alumno.page.css',
  'src/app/features/prediccion-gasto/prediccion-gasto-page/prediccion-gasto-page.component.css',
  'src/app/features/preferencias/preferencias.page.css',
  'src/app/features/preferencias-detectadas/preferencias-detectadas.page.css',
  'src/app/features/transferir-saldo/transferir-saldo.page.css',
  'src/app/features/restricciones-horarias/restricciones-horarias.page.css',
  'src/app/features/restricciones-nutricionales/restricciones-nutricionales.page.css',
  'src/app/features/presupuesto/presupuesto.page.css',
  'src/app/features/acreditar-mercado-pago/acreditar-mercado-pago.page.css'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    const c = fs.readFileSync(f, 'utf8');
    const headerMatch = c.match(/__header[^{]*\{[^}]*\}/) || c.match(/__cabecera[^{]*\{[^}]*\}/);
    const titleMatch = c.match(/__titulo[^{]*\{[^}]*\}/) || c.match(/__title[^{]*\{[^}]*\}/) || c.match(/__main-title[^{]*\{[^}]*\}/) || c.match(/\.presupuesto__titulo-principal[^{]*\{[^}]*\}/) || c.match(/\.restricciones__titulo[^{]*\{[^}]*\}/) || c.match(/\.adelanto-page__title[^{]*\{[^}]*\}/);
    const containerMatch = c.match(/__content[^{]*\{[^}]*\}/) || c.match(/\.favoritos[^{]*\{[^}]*\}/) || c.match(/\.fav-panel[^{]*\{[^}]*\}/) || c.match(/\.estadistica\s*\{[^}]*\}/) || c.match(/\.prediction-page\s*\{[^}]*\}/) || c.match(/\.preferencias\s*\{[^}]*\}/) || c.match(/\.preferencias-detectadas\s*\{[^}]*\}/) || c.match(/\.transferir-page\s*\{[^}]*\}/) || c.match(/\.restricciones\s*\{[^}]*\}/) || c.match(/\.adelanto-page\s*\{[^}]*\}/);
    
    console.log(`\n--- ${f} ---`);
    console.log('Container:', containerMatch ? containerMatch[0].replace(/\n/g, ' ') : 'None');
    console.log('Header:', headerMatch ? headerMatch[0].replace(/\n/g, ' ') : 'None');
    console.log('Title:', titleMatch ? titleMatch[0].replace(/\n/g, ' ') : 'None');
  }
});
