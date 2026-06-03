export const environment = {
  production: false,
  cognito: {
    userPoolId: 'USER_POOL_ID',
    userPoolClientId: 'USER_POOL_CLIENT_ID',
    region: 'REGION',
    oauth: {
      domain: 'DOMAIN',
      redirectSignIn: 'REDIRECT_SIGN_IN',
      redirectSignOut: 'REDIRECT_SIGN_OUT',
      responseType: 'code' as const,
      scopes: ['openid', 'email', 'profile'] as const,
    },
  },
  apiUrl: 'API_URL',
  firebaseConfig: {
    apiKey: "API_KEY",
    authDomain: "AUTH_DOMAIN",
    projectId: "PROJECT_ID",
    storageBucket: "STORAGE_BUCKET",
    messagingSenderId: "MESSAGING_SENDER_ID",
    appId: "APP_ID",
    vapidKey: "VAPID_KEY"
  }
};
