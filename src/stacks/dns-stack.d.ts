import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as r53 from 'aws-cdk-lib/aws-route53';
export interface Props extends cdk.StackProps {
    /**
     * The url we want cloudformation to make point towards our website
     *
     *  @default 'test.tjeldnes.com'
     */
    domainName: string;
    projectPrefix: string;
}
export declare class DnsStack extends cdk.Stack {
    readonly hostedZoneId: string;
    readonly hostedZone: r53.HostedZone;
    constructor(scope: Construct, id: string, props: Props);
}
