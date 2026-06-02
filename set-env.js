require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Determinar si es producción
const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--production');

// Siempre generamos environment.ts porque es el archivo base que busca el compilador.
// En desarrollo, también generamos environment.development.ts para cumplir con angular.json
const targetFiles = isProduction 
  ? ['environment.ts'] 
  : ['environment.ts', 'environment.development.ts'];

const environmentsDir = path.join(__dirname, `./src/environments`);

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

console.log(`Generando archivos de entorno (${isProduction ? 'PROD' : 'DEV'}) en ${environmentsDir}: ${targetFiles.join(', ')}`);

// Asegurar que el directorio existe
if (!fs.existsSync(environmentsDir)) {
  fs.mkdirSync(environmentsDir, { recursive: true });
}

targetFiles.forEach(file => {
  const filePath = path.join(environmentsDir, file);
  fs.writeFileSync(filePath, envConfigFile);
  console.log(`✅ Archivo ${file} generado correctamente.`);
});
