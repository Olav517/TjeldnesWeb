import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as r53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
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

    // Create Certificate
    const albCertificate = new acm.Certificate(this, 'AlbCertificate', {
      domainName: props.domainName,
      validation: acm.CertificateValidation.fromDns(props.hostedZone),
    });

    // Create Fargate Service with ALB
    const service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'WebService', {
      cluster: cluster,
      certificate: albCertificate,
      loadBalancerName: `${props.projectPrefix}-dynamic-webpage-alb`,
      domainName: props.domainName,
      domainZone: props.hostedZone,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry('nginx:latest'),
        containerPort: 80, // adjust based on your app
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

    const dynamicRecord = new r53.ARecord(this, 'DynamicWebRecord', {
      zone: props.hostedZone,
      recordName: `${props.domainName}`,
      target: r53.RecordTarget.fromAlias(new route53Targets.LoadBalancerTarget(service.loadBalancer)),
    });

  }
}