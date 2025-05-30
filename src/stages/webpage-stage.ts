import * as constructs from "constructs"
import * as cdk from "aws-cdk-lib"
import { DnsStack } from "../stacks/dns-stack" 
import { CertStack } from "../stacks/certificate-stack"
import { WebsiteResourcesStack } from "../stacks/website-resources-stack"
import { DynamicWebpageStack } from "../stacks/dynamic-webpage-stack"

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
    })

    new WebsiteResourcesStack(this, "website-resources", {
      description: "Contains the resources needed for a static website",
      hostedZone: dnsStack.hostedZone,
      projectPrefix: props.projectPrefix,
      domainName: props.domainName,
      apiDomainName: `api.${props.domainName}`,
      certificate: certStack.certificate,
      crossRegionReferences: true,
    })

    new DynamicWebpageStack(this, "dynamic-webpage", {
      description: "Contains the resources needed for a dynamic webpage",
      domainName: `dynamic.${props.domainName}`,
      projectPrefix: props.projectPrefix,
      hostedZone: dnsStack.hostedZone,
      certificate: certStack.certificate,
      crossRegionReferences: true,
    })
  }
}