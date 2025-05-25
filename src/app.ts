import * as cdk from "aws-cdk-lib"
import { primaryRegion, privateAccountId, projectPrefix } from "./config"
import { PipelineStack } from "./pipelines/pipeline"

const app = new cdk.App()

new PipelineStack(app, `${projectPrefix}-Pipeline`, {
  env: {
    account: privateAccountId,
    region: primaryRegion,
  }
})