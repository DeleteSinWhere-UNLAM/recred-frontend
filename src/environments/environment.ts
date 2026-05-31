export const environment = {
  production: true,
  cognito: {
    userPoolId: 'us-east-2_Qzg5XbEUj',
    userPoolClientId: '481p8i3df23fo4ql3psj9e1tbk',
    region: 'us-east-2',
    oauth: {
      domain: 'us-east-2qzg5xbeuj.auth.us-east-2.amazoncognito.com',
      redirectSignIn: 'https://recred.netlify.app',
      redirectSignOut: 'https://recred.netlify.app',
      responseType: 'code' as const,
      scopes: ['openid', 'email', 'profile'] as const,
    },
  },
  apiUrl: 'https://18-119-187-167.sslip.io/api/v1',
};
