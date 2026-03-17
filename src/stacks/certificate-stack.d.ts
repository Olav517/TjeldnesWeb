import * as cdk from "aws-cdk-lib";
import * as constructs from "constructs";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
export interface Props extends cdk.StackProps {
    /**
     * URL that the certificate in the stack is for.
     * @default "tjeldnes.com"
     */
    domainName: string;
    /**
     * hostedZone for the certificate to use for DNS validation.
     *
     */
    hostedZoneId: string;
    region: string;
}
export declare class CertStack extends cdk.Stack {
    readonly certificate: acm.Certificate;
    constructor(scope: constructs.Construct, id: string, props: Props);
}
