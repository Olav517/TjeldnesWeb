const awsconfig = {
  Auth: {
    region: 'eu-central-1',
    userPoolId: 'eu-central-1_ETCFkPKDJ',
    userPoolWebClientId: '1q6dmagqniqskhlhcdp41ermtt',
    oauth: {
      domain: 'tjeldnes-web-webapp.auth.eu-central-1.amazoncognito.com',
      scope: ['email', 'openid', 'profile'],
      redirectSignIn: 'http://localhost:3000/',
      redirectSignOut: 'http://localhost:3000/',
      responseType: 'code',
    },
  },
};

export default awsconfig;
