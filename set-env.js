require('dotenv').config();
const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, './src/environments/environment.development.ts');

// Variables obligatorias
const requiredEnvs = [
  'COGNITO_USER_POOL_ID',
  'COGNITO_CLIENT_ID',
  'COGNITO_REGION',
  'COGNITO_DOMAIN',
  'REDIRECT_SIGN_IN',
  'REDIRECT_SIGN_OUT',
  'API_URL'
];

// Validar que todas existan
requiredEnvs.forEach(env => {
  if (!process.env[env]) {
    console.error(`❌ Error: Falta la variable de entorno obligatoria: ${env}`);
    process.exit(1);
  }
});

const envConfigFile = `export const environment = {
  production: false,
  cognito: {
    userPoolId: '${process.env.COGNITO_USER_POOL_ID}',
    userPoolClientId: '${process.env.COGNITO_CLIENT_ID}',
    region: '${process.env.COGNITO_REGION}',
    oauth: {
      domain: '${process.env.COGNITO_DOMAIN}',
      redirectSignIn: '${process.env.REDIRECT_SIGN_IN}',
      redirectSignOut: '${process.env.REDIRECT_SIGN_OUT}',
      responseType: 'code' as const,
      scopes: ['openid', 'email', 'profile'] as const,
    },
  },
  apiUrl: '${process.env.API_URL}',
};
`;

console.log('Generando archivo de entorno en: ' + targetPath);

fs.writeFile(targetPath, envConfigFile, function (err) {
  if (err) {
    console.error('Error al generar el archivo:', err);
    process.exit(1);
  }
  console.log('✅ Archivo de entorno generado correctamente.');
});
