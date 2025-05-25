import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as r53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';


export interface Props extends cdk.StackProps {
    /**
     * The url we want cloudformation to make point towards our website
     * 
     *  @default 'test.tjeldnes.com'
     */
    domainName: string
    projectPrefix: string;

    hostedZone: r53.HostedZone;        
    certificate: acm.ICertificate;
}

export class DynamicWebpageStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    // Create ECS Cluster
    const cluster = new ecs.Cluster(this, 'WebCluster', {
      clusterName: `${props.projectPrefix}-cluster`,
      containerInsights: true,
    });

    // Create ECR Repository
    const repository = new ecr.Repository(this, 'WebRepository', {
      repositoryName: `${props.projectPrefix}-repo`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });



    // Create Fargate Service with ALB
    const service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'WebService', {
      cluster: cluster,
      certificate: props.certificate,
      domainName: props.domainName,
      domainZone: props.hostedZone,
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(repository),
        containerPort: 3000, // adjust based on your app
        environment: {
          NODE_ENV: 'production',
        },
      },
      memoryLimitMiB: 512,
      cpu: 256,
    });

    // Add autoscaling
    const scaling = service.service.autoScaleTaskCount({
      maxCapacity: 4,
      minCapacity: 1,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
    });
  }
}