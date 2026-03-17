import * as constructs from "constructs";
import * as cdk from "aws-cdk-lib";
interface Props extends cdk.StageProps {
    bucketName: string;
    projectPrefix: string;
    trustedRepositories: {
        name: string;
        owner: string;
    }[];
}
export declare class BuildArtifactStage extends cdk.Stage {
    constructor(scope: constructs.Construct, id: string, props: Props);
}
export {};
