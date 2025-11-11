# Requirements Document

## Introduction

The Tjeldnes Web System is a full-stack personal website platform deployed on AWS infrastructure. The system provides both static and dynamic web content, user authentication via AWS Cognito, interactive games, backend APIs for visitor tracking and scoreboard management, and a fully automated CI/CD pipeline. The infrastructure is defined using AWS CDK (TypeScript) and deployed through a self-mutating CodePipeline triggered by GitHub Actions.

## Glossary

- **CDK_Infrastructure**: The AWS Cloud Development Kit TypeScript code located in the `src/` directory that defines all AWS resources
- **Pipeline_Stack**: The AWS CodePipeline that orchestrates infrastructure deployment and updates
- **Static_Website**: The React-based homepage served via CloudFront and S3, located in `homePage/`
- **Dynamic_Website**: The React application with authentication, served via Lambda and API Gateway, located in `dynamichomePage/`
- **Visitor_Counter_API**: A Python Lambda function that increments and retrieves visitor counts stored in DynamoDB
- **Scoreboard_API**: A Python Lambda function that tracks user game wins with JWT authentication
- **Build_Artifact_Stack**: Infrastructure for GitHub Actions OIDC authentication and artifact storage
- **Cognito_User_Pool**: AWS Cognito service managing user authentication and authorization
- **GitHub_Actions_Workflow**: The CI/CD workflow defined in `.github/workflows/ci.yaml` that builds and deploys the system
- **Lambda_Function**: AWS Lambda function serving the built React application for the dynamic website
- **Hosted_Zone**: Route53 DNS zone managing the test.tjeldnes.com domain and subdomains

## Requirements

### Requirement 1: Infrastructure as Code Management

**User Story:** As a developer, I want all AWS infrastructure defined as code using CDK, so that infrastructure changes are version-controlled and reproducible

#### Acceptance Criteria

1. THE CDK_Infrastructure SHALL define all AWS resources using TypeScript constructs
2. WHEN the CDK code is synthesized, THE CDK_Infrastructure SHALL generate valid CloudFormation templates
3. THE CDK_Infrastructure SHALL organize resources into logical stacks (DNS, certificates, website resources, dynamic webpage, build artifacts)
4. THE CDK_Infrastructure SHALL use a centralized configuration file for project settings (region, account ID, project prefix)
5. THE CDK_Infrastructure SHALL support cross-region resource deployment for CloudFront certificates

### Requirement 2: Automated CI/CD Pipeline

**User Story:** As a developer, I want an automated deployment pipeline, so that code changes are automatically built, tested, and deployed to AWS

#### Acceptance Criteria

1. WHEN code is pushed to any branch, THE GitHub_Actions_Workflow SHALL build and verify the application
2. WHEN code is pushed to the main branch, THE GitHub_Actions_Workflow SHALL upload artifacts to S3 and trigger the deployment pipeline
3. WHEN artifacts are uploaded to S3, THE Pipeline_Stack SHALL automatically execute via EventBridge trigger
4. THE Pipeline_Stack SHALL synthesize CDK code and deploy infrastructure changes
5. THE GitHub_Actions_Workflow SHALL authenticate to AWS using OIDC federation without long-lived credentials
6. THE GitHub_Actions_Workflow SHALL build Docker images and push them to ECR_Repository

### Requirement 3: Static Website Hosting

**User Story:** As a visitor, I want to access a fast, secure static website, so that I can view content without authentication

#### Acceptance Criteria

1. THE Static_Website SHALL be served via CloudFront with HTTPS encryption
2. THE Static_Website SHALL use S3 as the origin with Origin Access Identity for security
3. WHEN a user requests the root domain, THE Static_Website SHALL serve the index.html file
4. WHEN a 403 or 404 error occurs, THE Static_Website SHALL redirect to index.html for client-side routing
5. THE Static_Website SHALL be accessible at the configured domain name with valid SSL certificate
6. THE Static_Website SHALL implement cache control headers for optimal performance

### Requirement 4: Dynamic Website with Authentication

**User Story:** As a user, I want to access protected content and games after logging in, so that my progress and scores are tracked

#### Acceptance Criteria

1. THE Dynamic_Website SHALL run as a Lambda function serving the built React application
2. THE Dynamic_Website SHALL be accessible via API Gateway with HTTPS and custom domain
3. THE Dynamic_Website SHALL integrate with Cognito_User_Pool for authentication
4. THE Dynamic_Website SHALL protect specific routes (resume, crossword, tic-tac-toe) requiring authentication
5. THE Dynamic_Website SHALL allow unauthenticated access to public routes (home, about, hangman)
6. THE Dynamic_Website SHALL handle client-side routing by serving index.html for all routes
7. THE Dynamic_Website SHALL automatically scale based on request volume

### Requirement 5: User Authentication and Authorization

**User Story:** As a user, I want to create an account and log in securely, so that I can access protected features

#### Acceptance Criteria

1. THE Cognito_User_Pool SHALL support self-service user registration with email verification
2. THE Cognito_User_Pool SHALL enforce password policies (minimum 8 characters, uppercase, lowercase, digits)
3. THE Cognito_User_Pool SHALL provide OAuth 2.0 authorization code flow
4. THE Cognito_User_Pool SHALL support both production and local development callback URLs
5. THE Cognito_User_Pool SHALL issue JWT tokens with OpenID, email, and profile scopes
6. THE Cognito_User_Pool SHALL provide a hosted UI for authentication flows
7. THE Cognito_User_Pool SHALL support email-based account recovery

### Requirement 6: Visitor Counter API

**User Story:** As a website owner, I want to track visitor counts, so that I can monitor site traffic

#### Acceptance Criteria

1. WHEN a POST request is sent to the Visitor_Counter_API with an ID, THE Visitor_Counter_API SHALL increment the counter in DynamoDB
2. THE Visitor_Counter_API SHALL return the updated counter value
3. THE Visitor_Counter_API SHALL handle CORS preflight requests
4. THE Visitor_Counter_API SHALL validate request body contains required 'id' field
5. THE Visitor_Counter_API SHALL return appropriate error responses for invalid requests
6. THE Visitor_Counter_API SHALL be accessible via API Gateway with custom domain

### Requirement 7: Scoreboard API with Authentication

**User Story:** As a game player, I want my wins tracked securely, so that only I can update my score

#### Acceptance Criteria

1. WHEN a POST request with valid JWT is sent, THE Scoreboard_API SHALL increment the user's win count
2. WHEN a GET request with valid JWT is sent, THE Scoreboard_API SHALL return the user's current win count
3. THE Scoreboard_API SHALL extract user ID from JWT token sub claim
4. THE Scoreboard_API SHALL reject requests without valid Authorization header
5. THE Scoreboard_API SHALL handle CORS preflight requests
6. THE Scoreboard_API SHALL store win counts in DynamoDB with userId as partition key
7. THE Scoreboard_API SHALL initialize win count to 0 for new users

### Requirement 8: DNS and Certificate Management

**User Story:** As a developer, I want automated DNS and SSL certificate management, so that all services have secure, custom domains

#### Acceptance Criteria

1. THE Hosted_Zone SHALL manage DNS records for test.tjeldnes.com and all subdomains
2. THE CDK_Infrastructure SHALL create NS records in the parent domain pointing to the subdomain hosted zone
3. THE CDK_Infrastructure SHALL provision SSL certificates with DNS validation
4. THE CDK_Infrastructure SHALL create certificates in us-east-1 for CloudFront distributions
5. THE CDK_Infrastructure SHALL create certificates in eu-central-1 for Application Load Balancers
6. THE CDK_Infrastructure SHALL create A records pointing to CloudFront distributions and load balancers
7. THE CDK_Infrastructure SHALL support wildcard certificates for subdomain flexibility

### Requirement 9: Dynamic Website Build Artifacts

**User Story:** As a developer, I want the dynamic website automatically built and packaged, so that it can be deployed to Lambda consistently

#### Acceptance Criteria

1. THE GitHub_Actions_Workflow SHALL build the React application from the dynamichomePage directory
2. THE GitHub_Actions_Workflow SHALL create a deployment package with built assets and Lambda handler
3. WHEN building on the main branch, THE GitHub_Actions_Workflow SHALL upload the deployment package to S3
4. THE Lambda_Function SHALL use the deployment package from S3 for updates
5. THE Build_Artifact_Stack SHALL grant upload permissions to the GitHub Actions role

### Requirement 10: Security and Access Control

**User Story:** As a security-conscious developer, I want proper IAM roles and least-privilege access, so that the system is secure

#### Acceptance Criteria

1. THE Build_Artifact_Stack SHALL create an IAM role for GitHub Actions using OIDC federation
2. THE Build_Artifact_Stack SHALL restrict the GitHub Actions role to specific repositories
3. THE Static_Website SHALL block all public S3 access and use Origin Access Identity
4. THE Static_Website SHALL enforce SSL for all S3 bucket access
5. THE Dynamic_Website SHALL use API Gateway resource policies to restrict access if needed
6. THE Lambda functions SHALL have IAM roles with permissions limited to their specific DynamoDB tables
7. THE Cognito_User_Pool SHALL be retained on stack deletion to prevent data loss

### Requirement 11: Multi-Environment Support

**User Story:** As a developer, I want the infrastructure to support multiple environments, so that I can test changes before production

#### Acceptance Criteria

1. THE Pipeline_Stack SHALL support adding multiple deployment stages
2. THE CDK_Infrastructure SHALL use environment-specific naming with project prefix
3. THE CDK_Infrastructure SHALL support deploying to different AWS accounts and regions
4. THE CDK_Infrastructure SHALL use stage names in resource naming (e.g., dev-build, dev-webpage)
5. THE Pipeline_Stack SHALL deploy stages sequentially (build artifacts, then webpage resources)

### Requirement 12: Monitoring and Logging

**User Story:** As an operator, I want logs and metrics collected, so that I can troubleshoot issues and monitor performance

#### Acceptance Criteria

1. THE Dynamic_Website SHALL send Lambda execution logs to CloudWatch with one-month retention
2. THE Lambda functions SHALL log errors and exceptions to CloudWatch
3. THE Dynamic_Website SHALL track deployment versions using Lambda function versions and aliases
4. THE API Gateway SHALL log access logs to CloudWatch for request monitoring
