import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

interface Props extends cdk.StageProps {
  projectPrefix: string;
}

export class ScoreboardTableStack extends cdk.Stack {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    this.table = new dynamodb.Table(this, 'Scoreboard', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      tableName: props.projectPrefix + '-Scoreboard',
    });
  }
} 