import * as constructs from "constructs";
import * as cdk from "aws-cdk-lib";
interface Props extends cdk.StageProps {
    domainName: string;
    projectPrefix: string;
}
export declare class WebpageStage extends cdk.Stage {
    constructor(scope: constructs.Construct, id: string, props: Props);
}
export {};
