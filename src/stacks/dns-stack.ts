import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as r53 from 'aws-cdk-lib/aws-route53';


export interface Props extends cdk.StackProps {
    /**
     * The url we want cloudformation to make point towards our website
     * 
     *  @default 'test.tjeldnes.com'
     */
    domainName: string
}

export class DnsStack extends cdk.Stack {
    public readonly hostedZoneId: string;
    public readonly hostedZone: r53.HostedZone

    constructor(scope: Construct, id: string, props: Props){
        super(scope, id, props);
        
        
        const hostedZone = new r53.HostedZone(this, "HZ test.tjeldnes.com", {
            zoneName: props.domainName,
            comment: "Test hostedzone that is owned by CDK"
        })
        this.hostedZoneId = hostedZone.hostedZoneId;
        this.hostedZone = hostedZone
        
        const rootHostedZone = r53.HostedZone.fromHostedZoneAttributes(this, "Root domain tjeldnes.com", {
            hostedZoneId: "Z00417723TDOHTH74Y6B4",
            zoneName: "tjeldnes.com"
        });
        
        new r53.NsRecord(this, 'NSRecord', {
            zone: rootHostedZone,
            recordName: 'test',
            values: hostedZone.hostedZoneNameServers!,
            ttl: cdk.Duration.minutes(5),       // Optional - default is 30 minutes
          });
   }  
}
