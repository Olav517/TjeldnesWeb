import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as r53 from 'aws-cdk-lib/aws-route53';
import * as r53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as dynamoDb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export interface Props extends cdk.StackProps {
    /**
     * The url we want cloudformation to make point towards our website
     * 
     *  @default 'test.tjeldnes.com'
     */
    hostedZone: r53.HostedZone;
    projectPrefix: string;
    domainName?: string;
}

export class WebsiteResourcesStack extends cdk.Stack {
    public readonly hostedZoneId: string;
    public readonly hostedZone: r53.HostedZone

    constructor(scope: Construct, id: string, props: Props){
        super(scope, id, props);
        
        
    const WebsiteBucket = new s3.Bucket(this, "WebsiteBucket", {
      publicReadAccess: false,
    })

    const distribution = new cloudfront.Distribution(this, "WebsiteDistribution", {
      defaultBehavior: {
        origin: new origins.S3StaticWebsiteOrigin(WebsiteBucket),
      },
    })

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
        database.grantReadWriteData(handler);

}
}