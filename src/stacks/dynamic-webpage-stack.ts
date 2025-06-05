import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as r53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import { Service } from 'aws-cdk-lib/aws-servicediscovery';


export interface Props extends cdk.StackProps {
    /**
     * The url we want cloudformation to make point towards our website
     * 
     *  @default dynamic.test.tjeldnes.com'
     */
    domainName: string
    projectPrefix: string;

    hostedZone: r53.HostedZone;        
    certificate: acm.ICertificate;
}

export class DynamicWebpageStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    // Make sure we deploy to the same region as the certificate (eu-central-1)
    
    super(scope, id, props);
    
    const cluster = new ecs.Cluster(this, 'WebCluster', {
      clusterName: `${props.projectPrefix}-cluster`,
      containerInsights: true,
    });

    
    const repository = new ecr.Repository(this, 'WebRepository', {
      repositoryName: `${props.projectPrefix}-repo`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'WebTaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
    });
    
    // Add container to task definition
    const container = taskDefinition.addContainer('WebContainer', {
      image: ecs.ContainerImage.fromRegistry('nginx:latest'),
      environment: {
        NODE_ENV: 'production',
      },
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: `${props.projectPrefix}-web` }),
    });
    
    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });
    
    // Create Fargate Service
    const fargateService = new ecs.FargateService(this, 'WebFargateService', {
      cluster,
      taskDefinition,
      desiredCount: 1,
      serviceName: `${props.projectPrefix}-web-service`,
      assignPublicIp: false,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });
    
    const scaling = fargateService.autoScaleTaskCount({
      maxCapacity: 4,
      minCapacity: 1,
    });
    
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
    });
    
  }
}