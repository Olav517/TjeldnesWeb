import * as constructs from "constructs"
import * as cdk from "aws-cdk-lib"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as iam from "aws-cdk-lib/aws-iam"
import * as ecr from "aws-cdk-lib/aws-ecr"

export interface Props extends cdk.StackProps {
  /**
   * The name of the S3 artifact bucket that will be created
   * for GitHub Actions to upload files to.
   *
   * @default - an auto-generated name
   */
  bucketName?: string
  /**
   * The name of the role that will be created
   * for GitHub Actions to assume.
   *
   * @default "github-actions-role"
   */
  roleName?: string
  /**
   * A list of trusted GitHub repositories that
   * are allowed to assume the IAM role through GitHub Actions.
   */
  trustedRepositories: {
    /**
     * The name of the GitHub repository.
     */
    name: string
    /**
     * The owner of the GitHub repository.
     */
    owner: string
    /**
     * The name of the default branch in the GitHub repository.
     *
     * @default "main"
     */
    defaultBranch?: string
  }[]
  projectPrefix: string
}

export class BuildArtifactStack extends cdk.Stack {
  constructor(scope: constructs.Construct, id: string, props: Props) {
    super(scope, id, props)
    if (props.trustedRepositories.length === 0) {
      throw new Error("At least one trusted GitHub repository needs to be configured")
    }
    const { account, region } = cdk.Stack.of(this)
    const artifactBucket = new s3.Bucket(this, "ArtifactBucket", {
      bucketName: props.bucketName,
      versioned: true,
      eventBridgeEnabled: true
    })
    
    const repository = new ecr.Repository(this, 'WebRepository', {
      repositoryName: `${props.projectPrefix}-project-repo`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const oidcProvider = new iam.OpenIdConnectProvider(this, "githubProvider", {
      url: "https://token.actions.githubusercontent.com",
      clientIds: ["sts.amazonaws.com"]
    })

    const subjects = props.trustedRepositories.map(
      (repository) =>
        `repo:${repository.owner}/${repository.name}:ref:refs/heads/${repository.defaultBranch ?? "main"}`,
    )
    
    const principal = new iam.FederatedPrincipal(
      oidcProvider.openIdConnectProviderArn,
      {
        StringLike: {
          "token.actions.githubusercontent.com:sub": subjects
        }
      },
      "sts:AssumeRoleWithWebIdentity",
    )
    const role = new iam.Role(this, "GithubActionsRole", {
      roleName: props.roleName ?? "github-actions-role",
      assumedBy: principal,
    })
    artifactBucket.grantPut(role)
    repository.grantPullPush(role)
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ["ecr:GetAuthorizationToken"],
        resources: ["*"],
      }),
    )
  }
}
