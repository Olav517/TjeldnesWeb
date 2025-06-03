import * as cdk from "aws-cdk-lib"
import * as constructs from "constructs"
import * as acm from "aws-cdk-lib/aws-certificatemanager"
import * as r53 from "aws-cdk-lib/aws-route53"

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
    
    /**
     * Region to deploy the certificate to
     * @default "eu-central-1"
     */
    region?: string
}

export class AlbCertificateStack extends cdk.Stack {
    public readonly certificate: acm.Certificate
    constructor(scope: constructs.Construct, id: string, props: Props){
        // Deploy to eu-central-1 by default, or to the specified region
        const region = props.region || 'eu-central-1';
        super(scope, id, {...props, env: {region}})

        const hostedZone = r53.HostedZone.fromHostedZoneId(this, "certHostedZone", props.hostedZoneId)

        const certificate = new acm.Certificate(this, 'albCert', {
            domainName: `*.dynamic.${props.domainName}`,
            validation: acm.CertificateValidation.fromDns(hostedZone),
        });

        this.certificate = certificate
    }
}
