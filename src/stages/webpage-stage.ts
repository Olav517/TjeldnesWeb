import * as constructs from "constructs"
import * as cdk from "aws-cdk-lib"
import { DnsStack } from "../stacks/dns-stack" 
import { CertStack } from "../stacks/certificate-stack"
import { WebsiteResourcesStack } from "../stacks/website-resources-stack"
import { DynamicWebpageStack } from "../stacks/dynamic-webpage-stack"
import { primaryRegion, secondaryRegion } from "../config"
import { ScoreboardStack } from "../stacks/scoreboard-stack"

interface Props extends cdk.StageProps {
  domainName: string
  projectPrefix: string;
}

export class WebpageStage extends cdk.Stage {
  constructor(scope: constructs.Construct, id: string, props: Props) {
    super(scope, id, props)

    const dnsStack = new DnsStack(this, "build-artifact", {
      description: "Contains the resources needed for a CI/CD build pipeline thats automatically populated by a github repo",
      domainName: props.domainName,
      projectPrefix: props.projectPrefix,
    })

    const certStack = new CertStack(this, "certificate-stack", {
      domainName: props.domainName,
      hostedZoneId: dnsStack.hostedZone.hostedZoneId,
      crossRegionReferences: true,
      region: secondaryRegion, // Deploy to us-east-1
    })
    
    const albCertStack = new CertStack(this, "alb-certificate-stack", {
      domainName: `dynamic.${props.domainName}`,
      hostedZoneId: dnsStack.hostedZone.hostedZoneId,
      region: primaryRegion, // Deploy to eu-central-1
    })

    new WebsiteResourcesStack(this, "website-resources", {
      description: "Contains the resources needed for a static website",
      hostedZone: dnsStack.hostedZone,
      projectPrefix: props.projectPrefix,
      domainName: props.domainName,
      apiDomainName: `api.${props.domainName}/visitorcounter`,
      certificate: certStack.certificate,
      crossRegionReferences: true,
    })
    new ScoreboardStack(this, "scoreboard-table", {
      projectPrefix: props.projectPrefix,
      hostedZone: dnsStack.hostedZone,
      apiDomainName: `api.${props.domainName}/scoreboard`,
    })

    new DynamicWebpageStack(this, "dynamic-webpage", {
      description: "Contains the resources needed for a dynamic webpage",
      domainName: `dynamic.${props.domainName}`,
      projectPrefix: props.projectPrefix,
      hostedZone: dnsStack.hostedZone,
      certificate: albCertStack.certificate,
      crossRegionReferences: true,
    })
  }
}