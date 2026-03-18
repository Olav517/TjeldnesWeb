import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as r53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as logs from 'aws-cdk-lib/aws-logs';


export interface Props extends cdk.StackProps {
    /**
     * The url we want cloudformation to make point towards our website
     * 
     *  @default 'test.tjeldnes.com'
     */
    domainName: string
    projectPrefix: string;
    hostedZone: r53.HostedZone;        
    certificate: acm.ICertificate;
}

export class DynamicWebpageStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    // Create Lambda function to serve the React app
    const webFunction = new lambda.Function(this, 'DynamicWebFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'lambda/handler.handler',
      code: lambda.Code.fromAsset('./dynamichomePage', {
        exclude: ['node_modules/**', 'src/**', '*.ts', '*.tsx', 'tsconfig*', 'vite.config.*', 'package*.json', 'README.md', 'dockerfile', 'entrypoint.sh', 'nginx.conf', 'lambda/*.ts', 'lambda/tsconfig.json'],
      }),
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      description: 'Serves the dynamic React website',
      logRetention: logs.RetentionDays.ONE_MONTH,
      environment: {
        NODE_ENV: 'production',
      },
    });

    // Create HTTP API Gateway
    const httpApi = new apigatewayv2.HttpApi(this, 'DynamicWebApi', {
      apiName: `${props.projectPrefix}-dynamic-web-api`,
      description: 'HTTP API for dynamic website',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigatewayv2.CorsHttpMethod.GET],
        allowHeaders: ['*'],
      },
    });

    // Create Lambda integration
    const lambdaIntegration = new apigatewayv2Integrations.HttpLambdaIntegration(
      'DynamicWebIntegration',
      webFunction
    );

    // Add catch-all route
    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: lambdaIntegration,
    });

    // Add root route
    httpApi.addRoutes({
      path: '/',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: lambdaIntegration,
    });

    // Create custom domain for API Gateway
    const domainName = new apigatewayv2.DomainName(this, 'DynamicWebDomain', {
      domainName: props.domainName,
      certificate: props.certificate,
    });

    // Map custom domain to API
    new apigatewayv2.ApiMapping(this, 'DynamicWebApiMapping', {
      api: httpApi,
      domainName: domainName,
      stage: httpApi.defaultStage,
    });

    // Add DNS record pointing to API Gateway
    new r53.ARecord(this, 'DynamicWebRecord', {
      zone: props.hostedZone,
      recordName: props.domainName,
      target: r53.RecordTarget.fromAlias(
        new route53Targets.ApiGatewayv2DomainProperties(
          domainName.regionalDomainName,
          domainName.regionalHostedZoneId
        )
      ),
    });
    
    // --- Cognito User Pool Setup ---
    const userPool = new cognito.UserPool(this, 'WebUserPool', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: false },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Hosted UI domain
    const userPoolDomain = userPool.addDomain('CognitoDomain', {
      cognitoDomain: {
        domainPrefix: `${props.projectPrefix}-webapp`, // must be globally unique
      },
    });

    // User Pool Client for web app
    const userPoolClient = userPool.addClient('WebUserPoolClient', {
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          `https://${props.domainName}/`, // production
          'http://localhost:5173/', // local dev
        ],
        logoutUrls: [
          `https://${props.domainName}/`,
          'http://localhost:5173/',
        ],
      },
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
    });

    // Output values for frontend config
    new cdk.CfnOutput(this, 'CognitoUserPoolId', {
      value: userPool.userPoolId,
    });
    new cdk.CfnOutput(this, 'CognitoUserPoolClientId', {
      value: userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, 'CognitoDomain', {
      value: userPoolDomain.domainName,
    });

    // Pass Cognito config to the Lambda so it can serve /env.js dynamically
    webFunction.addEnvironment(
      'COGNITO_AUTHORITY',
      `https://cognito-idp.${cdk.Stack.of(this).region}.amazonaws.com/${userPool.userPoolId}`
    );
    webFunction.addEnvironment('COGNITO_CLIENT_ID', userPoolClient.userPoolClientId);
  }
}