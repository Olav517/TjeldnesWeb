import * as cdk from "aws-cdk-lib"
import * as constructs from "constructs"
import * as acm from "aws-cdk-lib/aws-certificatemanager"
import * as r53 from "aws-cdk-lib/aws-route53"
import { secondaryRegion } from "../config"

export interface Props extends cdk.StackProps{
    /**
     * URL that the certificate in the stack is for.
     * @default "tjeldnes.com"
     */
    domainName: string

    /**
     * hostedZone for the certificate to use for DNS validation.
     * 
     */
    hostedZoneId: string
    region: string
}

export class CertStack extends cdk.Stack {
    public readonly certificate: acm.Certificate
    constructor(scope: constructs.Construct, id: string, props: Props){
        
        super(scope, id, {...props, env: {region: props.region}})

        const hostedZone = r53.HostedZone.fromHostedZoneId(this, "certHostedZone", props.hostedZoneId)

        const certificate = new acm.Certificate(this, 'wildCardCert', {
            domainName: props.domainName,
            validation: acm.CertificateValidation.fromDns(hostedZone),
            subjectAlternativeNames: [`*.${props.domainName}`],
        });

        this.certificate = certificate
    }

}