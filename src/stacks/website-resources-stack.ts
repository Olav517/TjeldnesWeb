import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as r53 from 'aws-cdk-lib/aws-route53';
import * as r53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as dynamoDb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3Deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as agw from 'aws-cdk-lib/aws-apigateway';

export interface Props extends cdk.StackProps {
    /**
     * The url we want cloudformation to make point towards our website
     * 
     *  @default 'test.tjeldnes.com'
     */
    hostedZone: r53.HostedZone;
    projectPrefix: string;
    domainName: string;
    apiDomainName: string;
    certificate: acm.ICertificate;
}

export class WebsiteResourcesStack extends cdk.Stack {
    public readonly hostedZoneId: string;
    public readonly hostedZone: r53.HostedZone

    constructor(scope: Construct, id: string, props: Props){
        super(scope, id, props);
        
        
    const WebsiteBucket = new s3.Bucket(this, "WebsiteBucket", {
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Only for dev/test environments
      autoDeleteObjects: true, 
    })

    const oai = new cloudfront.OriginAccessIdentity(this, 'newOAI');

    const distribution = new cloudfront.Distribution(this, "WebsiteDistribution", {
      defaultBehavior: {
        origin: new origins.S3Origin(WebsiteBucket, {
          originAccessIdentity: oai,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        
      },
      domainNames: [props.domainName],
      certificate: props.certificate,
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
    })

    const deployment = new s3Deploy.BucketDeployment(this, "WebsiteDeployment", {
      destinationBucket: WebsiteBucket,
      sources: [s3Deploy.Source.asset("./homePage/dist")],
      cacheControl: [
        s3Deploy.CacheControl.setPublic(),
        s3Deploy.CacheControl.maxAge(cdk.Duration.days(365)),
        s3Deploy.CacheControl.sMaxAge(cdk.Duration.days(365)),
      ],
      distribution,
      distributionPaths: ["/*"],
    })

    WebsiteBucket.grantRead(oai);

    const record = new r53.ARecord(this, "domain-cloudfront-record",{
            target: r53.RecordTarget.fromAlias(new r53Targets.CloudFrontTarget(distribution)),
            zone: props.hostedZone,
            comment: "Points r53 subdomain to the proper cloudfront target"
        })

    const database = new dynamoDb.Table(this, "visitorCounter", {
            partitionKey: {name: 'id', type: dynamoDb.AttributeType.STRING},
            tableName: `${props.projectPrefix}-visitor-counter-2`
        })

        const handler = new lambda.Function(this, "apiHandler", {
            description: "Handler for the restAPI used to increment visitor counter for cloud resume challenge",
            runtime: lambda.Runtime.PYTHON_3_10,
            code: lambda.Code.fromAsset('APIs/visitorcounter'),
            handler: 'api.handler',
            environment: {
                TABLE_NAME: database.tableName
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
            comment: "Points r53 subdomain to the proper API Gateway target"
        });
        database.grantReadWriteData(handler);


}
}