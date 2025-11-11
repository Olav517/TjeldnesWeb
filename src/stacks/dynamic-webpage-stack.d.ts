import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as r53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
export interface Props extends cdk.StackProps {
    /**
     * The url we want cloudformation to make point towards our website
     *
     *  @default 'test.tjeldnes.com'
     */
    domainName: string;
    projectPrefix: string;
    hostedZone: r53.HostedZone;
    certificate: acm.ICertificate;
}
export declare class DynamicWebpageStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: Props);
}
