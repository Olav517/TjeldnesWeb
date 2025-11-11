import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as r53 from 'aws-cdk-lib/aws-route53';
import * as dynamoDb from 'aws-cdk-lib/aws-dynamodb';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
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
export declare class WebsiteResourcesStack extends cdk.Stack {
    readonly hostedZoneId: string;
    readonly hostedZone: r53.HostedZone;
    readonly visitorCounterTable: dynamoDb.Table;
    readonly scoreboardTable: dynamoDb.Table;
    constructor(scope: Construct, id: string, props: Props);
}
