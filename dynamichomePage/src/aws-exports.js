const awsconfig = {
  Auth: {
    region: 'eu-central-1',
    userPoolId: 'eu-central-1_EtLI65dHb',
    userPoolWebClientId: '655bsk374dkhbl93vkhacqm835',
    oauth: {
      domain: 'eu-central-1-etli65dhb.auth.eu-central-1.amazoncognito.com',
      scope: ['email', 'openid', 'profile'],
      redirectSignIn: 'http://localhost:3000/',
      redirectSignOut: 'http://localhost:3000/',
      responseType: 'code',
    },
  },
};

export default awsconfig;
