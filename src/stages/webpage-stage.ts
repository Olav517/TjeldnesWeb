import * as constructs from "constructs"
import * as cdk from "aws-cdk-lib"
import { DnsStack } from "../stacks/dns-stack" 
import { WebsiteResourcesStack } from "../stacks/website-resources-stack"

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

    new WebsiteResourcesStack(this, "website-resources", {
      description: "Contains the resources needed for a static website",
      hostedZone: dnsStack.hostedZone,
      projectPrefix: props.projectPrefix,
      domainName: props.domainName,
    })
  }
}