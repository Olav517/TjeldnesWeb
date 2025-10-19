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
import * as cognito from 'aws-cdk-lib/aws-cognito';


export interface Props extends cdk.StackProps {
    /**
     * The url we want cloudformation to make point towards our website
     * 
     *  @default 'test.tjeldnes.com'
     */
    domainName: string
    projectPrefix: string;
    imageTag?: string; // Optional tag for the ECR image, defaults to 'latest'
    hostedZone: r53.HostedZone;        
    certificate: acm.ICertificate;
  /**
   * Optional CIDR for the VPC created by the stack. Defaults to a safe non-overlapping block.
   * Use this if you hit CIDR conflicts in your account.
   */
  vpcCidr?: string;
}

export class DynamicWebpageStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    // 1. Create the VPC first
    const vpc = new ec2.Vpc(this, 'WebVpc', {
      cidr: props.vpcCidr ?? '10.2.0.0/16',
      maxAzs: 2,
      natGateways: 0,
    });

    // 2. Pass the VPC to the ECS cluster
    const cluster = new ecs.Cluster(this, 'WebCluster', {
      vpc,
      clusterName: `${props.projectPrefix}-cluster`,
      containerInsights: true 
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
      defaultAction: elb.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'Default response'
      })
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
    
    // Create Task Definition with deployment settings
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'WebTaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
    });
    
    // Get reference to existing ECR repository
    const ecrRepo = ecr.Repository.fromRepositoryName(
      this,
      'ExistingRepo',
      `${props.projectPrefix}-project-repo`
    );
    
    // Add container to task definition using the ECR image
    const deploymentVersion = Date.now().toString();
    const container = taskDefinition.addContainer('WebContainer', {
      image: ecs.ContainerImage.fromEcrRepository(ecrRepo, props.imageTag ?? 'latest'),
      environment: {
        NODE_ENV: 'production',
        VERSION: deploymentVersion,  // Add version to force new deployment
      },
      logging: ecs.LogDrivers.awsLogs({ 
        streamPrefix: `${props.projectPrefix}-web`,
        logRetention: cdk.aws_logs.RetentionDays.ONE_MONTH 
      }),
    });
    
    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });

    // Create Fargate Service with deployment configuration
    const fargateService = new ecs.FargateService(this, 'WebFargateService', {
      cluster,
      taskDefinition,
      desiredCount: 1,
      securityGroups: [fargateSecurityGroup],
      assignPublicIp: false,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      circuitBreaker: { rollback: true },  // Enable rollback on deployment failure
      deploymentController: {
        type: ecs.DeploymentControllerType.ECS,  // Use ECS rolling deployment
      },
      maxHealthyPercent: 200,      // Allow running up to double the desired count during deployment
      minHealthyPercent: 50,       // Keep at least half running during updates
    });

    // Enable deployment circuit breaker at the L1 construct level
    const cfnFargateService = fargateService.node.defaultChild as ecs.CfnService;
    cfnFargateService.deploymentConfiguration = {
      deploymentCircuitBreaker: { enable: true, rollback: true },
      maximumPercent: 200,
      minimumHealthyPercent: 50,
    };
    
    // Add deployment tracking tag
    cdk.Tags.of(taskDefinition).add('DeploymentTimestamp', new Date().toISOString());
    
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
    
    // Register service with target group
    targetGroup.addTarget(fargateService);

    // Add default rule for all paths (no authentication)
    httpsListener.addAction('DefaultAction', {
      action: elb.ListenerAction.forward([targetGroup])
    });
    
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
    
    // --- Cognito User Pool Setup ---
    const userPool = new cognito.UserPool(this, 'WebUserPool', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: false },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Hosted UI domain
    const userPoolDomain = userPool.addDomain('CognitoDomain', {
      cognitoDomain: {
        domainPrefix: `${props.projectPrefix}-webapp`, // must be globally unique
      },
    });

    // User Pool Client for web app
    const userPoolClient = userPool.addClient('WebUserPoolClient', {
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          `https://${props.domainName}/`, // production
          'http://localhost:5173/', // local dev
        ],
        logoutUrls: [
          `https://${props.domainName}/`,
          'http://localhost:5173/',
        ],
      },
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
    });

    // Output values for frontend config
    new cdk.CfnOutput(this, 'CognitoUserPoolId', {
      value: userPool.userPoolId,
    });
    new cdk.CfnOutput(this, 'CognitoUserPoolClientId', {
      value: userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, 'CognitoDomain', {
      value: userPoolDomain.domainName,
    });
  }
}