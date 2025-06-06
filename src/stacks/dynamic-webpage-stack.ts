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

    // 1. Create the VPC first
    const vpc = new ec2.Vpc(this, 'WebVpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    // 2. Pass the VPC to the ECS cluster
    const cluster = new ecs.Cluster(this, 'WebCluster', {
      vpc,
      clusterName: `${props.projectPrefix}-cluster`,
      containerInsights: true,
    });

    
    const repository = new ecr.Repository(this, 'WebRepository', {
      repositoryName: `${props.projectPrefix}-repo`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    

    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Security group for ALB',
      allowAllOutbound: true,
    });
    
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );
    
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    
    const fargateSecurityGroup = new ec2.SecurityGroup(this, 'FargateServiceSecurityGroup', {
      vpc,
      description: 'Security group for Fargate service',
      allowAllOutbound: true,
    });
    
    fargateSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );
    
    // Create ALB
    const alb = new elb.ApplicationLoadBalancer(this, 'WebLoadBalancer', {
      vpc,
      internetFacing: true,
      loadBalancerName: `${props.projectPrefix}-dynamic-webpage-alb`,
      securityGroup: albSecurityGroup,
    });
    
    // Create HTTPS Listener with certificate
    const httpsListener = alb.addListener('HttpsListener', {
      port: 443,
      protocol: elb.ApplicationProtocol.HTTPS,
      certificates: [props.certificate],
      open: true,
    });
    
    // Create HTTP Listener that redirects to HTTPS
    const httpListener = alb.addListener('HttpListener', {
      port: 80,
      protocol: elb.ApplicationProtocol.HTTP,
      open: true,
    });
    
    httpListener.addAction('HttpRedirect', {
      action: elb.ListenerAction.redirect({
        port: '443',
        protocol: 'HTTPS',
        permanent: true,
      }),
    });
    
    // Update ECS Cluster to use the VPC
    cluster.enableFargateCapacityProviders();
    
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
      securityGroups: [fargateSecurityGroup],
      assignPublicIp: false,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });
    
    // Create Target Group
    const targetGroup = new elb.ApplicationTargetGroup(this, 'WebTargetGroup', {
      vpc,
      port: 80,
      protocol: elb.ApplicationProtocol.HTTP,
      targetType: elb.TargetType.IP,
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(60),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 2,
      },
    });
    
    // Add target group to the HTTPS listener
    httpsListener.addTargetGroups('TargetGroups', {
      targetGroups: [targetGroup],
    });
    
    // Register service with target group
    targetGroup.addTarget(fargateService);
    
    // Add autoscaling
    const scaling = fargateService.autoScaleTaskCount({
      maxCapacity: 4,
      minCapacity: 1,
    });
    
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
    });
    
    // Add DNS record
    new r53.ARecord(this, 'DynamicWebRecord', {
      zone: props.hostedZone,
      recordName: `${props.domainName}`,
      target: r53.RecordTarget.fromAlias(new route53Targets.LoadBalancerTarget(alb)),
    });

  }
}