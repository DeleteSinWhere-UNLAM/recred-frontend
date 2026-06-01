require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Determinar si es producción (por defecto true, a menos que se especifique lo contrario)
const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--production');
const targetFileName = isProduction ? 'environment.ts' : 'environment.development.ts';
const targetPath = path.join(__dirname, `./src/environments/${targetFileName}`);

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
  production: ${isProduction},
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

console.log(`Generando archivo de entorno (${isProduction ? 'PROD' : 'DEV'}) en: ${targetPath}`);

// Asegurar que el directorio existe
const dir = path.dirname(targetPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(targetPath, envConfigFile);
console.log('✅ Archivo de entorno generado correctamente.');
