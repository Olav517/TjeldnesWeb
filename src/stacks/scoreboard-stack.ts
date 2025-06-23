import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import * as agw from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as r53 from 'aws-cdk-lib/aws-route53';
import * as r53Targets from 'aws-cdk-lib/aws-route53-targets';

interface Props extends cdk.StageProps {
  projectPrefix: string;
  hostedZone: r53.HostedZone;
  apiDomainName: string;
}

export class ScoreboardStack extends cdk.Stack {
  public readonly table: dynamodb.Table;
  public readonly api: apigw.HttpApi;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    this.table = new dynamodb.Table(this, 'Scoreboard', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      tableName: props.projectPrefix + '-Scoreboard',
    });

    const handler = new lambda.Function(this, "apiHandler", {
      description: "Handler for the restAPI used to increment visitor counter for cloud resume challenge",
      runtime: lambda.Runtime.PYTHON_3_10,
      code: lambda.Code.fromAsset('APIs/visitorcounter'),
      handler: 'api.handler',
      environment: {
          TABLE_NAME: this.table.tableName
      }
  })
  
  const apiCert = new acm.Certificate(this, "APICertificate", {
      domainName: props.apiDomainName,
      validation: acm.CertificateValidation.fromDns(props.hostedZone),
  });

  const api = new agw.LambdaRestApi(this, "VisitorCounterAPI", {
      handler: handler,
      domainName: {
        domainName:props.apiDomainName,
        certificate: apiCert,
      },
      description: "API for incrementing visitor counter",
  });

  const apiRecord = new r53.ARecord(this, "api-cloudfront-record",{
      target: r53.RecordTarget.fromAlias(new r53Targets.ApiGateway(api)),
      zone: props.hostedZone,
      recordName: props.apiDomainName,
      comment: "Points r53 subdomain to the proper API Gateway target"
  });

  this.table.grantReadWriteData(handler);
  }
} 