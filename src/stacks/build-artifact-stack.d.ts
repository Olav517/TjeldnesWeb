import * as constructs from "constructs";
import * as cdk from "aws-cdk-lib";
export interface Props extends cdk.StackProps {
    /**
     * The name of the S3 artifact bucket that will be created
     * for GitHub Actions to upload files to.
     *
     * @default - an auto-generated name
     */
    bucketName?: string;
    /**
     * The name of the role that will be created
     * for GitHub Actions to assume.
     *
     * @default "github-actions-role"
     */
    roleName?: string;
    /**
     * A list of trusted GitHub repositories that
     * are allowed to assume the IAM role through GitHub Actions.
     */
    trustedRepositories: {
        /**
         * The name of the GitHub repository.
         */
        name: string;
        /**
         * The owner of the GitHub repository.
         */
        owner: string;
        /**
         * The name of the default branch in the GitHub repository.
         *
         * @default "main"
         */
        defaultBranch?: string;
    }[];
    projectPrefix: string;
}
export declare class BuildArtifactStack extends cdk.Stack {
    constructor(scope: constructs.Construct, id: string, props: Props);
}
