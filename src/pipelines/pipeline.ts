import * as cdk from "aws-cdk-lib"
import * as actions from "aws-cdk-lib/aws-codepipeline-actions"
import * as events from "aws-cdk-lib/aws-events"
import * as targets from "aws-cdk-lib/aws-events-targets"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as pipelines from "aws-cdk-lib/pipelines"
import * as constructs from "constructs"

import { primaryRegion, privateAccountId, projectPrefix } from "../config"
import { BuildArtifactStage } from "../stages/build-artifact-stage"

export class PipelineStack extends cdk.Stack {
  constructor(scope: constructs.Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props)
    const { account, region } = cdk.Stack.of(this)
    // NOTE: This bucket is created in the BuildArtifactStack
    const artifactBucketName = `${projectPrefix}-build-artifact-${account}-${region}`

    const pipelineName = `${projectPrefix}-pipeline`
    const artifactBucket = s3.Bucket.fromBucketName(this, "ArtifactBucket", artifactBucketName)
    const triggerArtifactName = `${pipelineName}/cdk-source.zip`
    const domainName = "test.tjeldnes.com"
    const apiDomain = "visitorcounter.test.tjeldnes.com"

    const pipeline = new pipelines.CodePipeline(this, `${projectPrefix}-Pipeline`, {
      pipelineName: pipelineName,
      
      synth: new pipelines.ShellStep("Synth", {
        
        input: pipelines.CodePipelineSource.s3(artifactBucket, triggerArtifactName, {
          trigger: actions.S3Trigger.NONE,
        }),
        installCommands: ["npm ci"],
        commands: [
          "npx cdk synth"
        ]
      })

    })
  
    pipeline.addStage(
        new BuildArtifactStage(this, `${projectPrefix}-dev-build`, {
            env:{
                region: primaryRegion,
                account: privateAccountId
            },
            bucketName: artifactBucketName,
            trustedRepositories: [
              {
                name: "TjeldnesWeb",
                owner: "Olav517"
              }
            ]
        })
    )

    pipeline.buildPipeline()

    new events.Rule(this, "PipelineTrigger", {
      eventPattern: {
        source: ["aws.s3"],
        detailType: ["Object Created"],
        detail: {
          bucket: {
            name: [artifactBucket.bucketName],
          },
          object: {
            key: [triggerArtifactName],
          },
        },
      },
      targets: [new targets.CodePipeline(pipeline.pipeline)],
    })
  }
}