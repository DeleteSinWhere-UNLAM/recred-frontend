require('dotenv').config();
const fs = require('fs');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--production');
const targetFiles = isProduction
  ? ['environment.ts']
  : ['environment.ts', 'environment.development.ts'];

const environmentsDir = path.join(__dirname, `./src/environments`);

const requiredEnvs = [
  'COGNITO_USER_POOL_ID',
  'COGNITO_CLIENT_ID',
  'COGNITO_REGION',
  'COGNITO_DOMAIN',
  'REDIRECT_SIGN_IN',
  'REDIRECT_SIGN_OUT',
  'API_URL',
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'FIREBASE_MEASUREMENT_ID',
  'FIREBASE_VAPID_KEY'
];

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
      scopes: ['openid', 'email', 'profile', 'aws.cognito.signin.user.admin'] as const,
    },
  },
  apiUrl: '${process.env.API_URL}',
  firebaseConfig: {
    apiKey: "${process.env.FIREBASE_API_KEY}",
    authDomain: "${process.env.FIREBASE_AUTH_DOMAIN}",
    projectId: "${process.env.FIREBASE_PROJECT_ID}",
    storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET}",
    messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID}",
    appId: "${process.env.FIREBASE_APP_ID}",
    vapidKey: "${process.env.FIREBASE_VAPID_KEY}"
  }
};
`;

console.log(`Generando archivos de entorno (${isProduction ? 'PROD' : 'DEV'}) en ${environmentsDir}: ${targetFiles.join(', ')}`);

if (!fs.existsSync(environmentsDir)) {
  fs.mkdirSync(environmentsDir, { recursive: true });
}

targetFiles.forEach(file => {
  const filePath = path.join(environmentsDir, file);
  fs.writeFileSync(filePath, envConfigFile);
  console.log(`✅ Archivo ${file} generado correctamente.`);
});
