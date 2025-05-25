import * as constructs from "constructs"
import * as cdk from "aws-cdk-lib"
import { BuildArtifactStack } from "../stacks/build-artifact-stack"

interface Props extends cdk.StageProps {
  bucketName: string
  trustedRepositories: {
    name: string
    owner: string
  }[]
}

export class BuildArtifactStage extends cdk.Stage {
  constructor(scope: constructs.Construct, id: string, props: Props) {
    super(scope, id, props)
    
    new BuildArtifactStack(this, "build-artifact", {
      description: "Contains the resources needed for a CI/CD build pipeline thats automatically populated by a github repo",
      bucketName: props.bucketName,
      trustedRepositories: props.trustedRepositories
    })
  }
}