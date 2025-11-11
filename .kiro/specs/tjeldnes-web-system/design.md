# Design Document: Tjeldnes Web System

## Overview

The Tjeldnes Web System is a full-stack personal website platform built on AWS infrastructure with a focus on automation, security, and scalability. The system consists of two primary web applications (static and dynamic), backend APIs for visitor tracking and game scoreboard management, user authentication via AWS Cognito, and a fully automated CI/CD pipeline.

The architecture leverages AWS CDK for infrastructure as code, GitHub Actions for build automation, and AWS CodePipeline for deployment orchestration. All infrastructure is version-controlled and deployed through a self-mutating pipeline pattern.

### Key Design Principles

1. **Infrastructure as Code**: All AWS resources defined in TypeScript using CDK
2. **Security by Default**: Least-privilege IAM roles, HTTPS everywhere, no long-lived credentials
3. **Automation First**: Zero-touch deployments from code commit to production
4. **Separation of Concerns**: Clear boundaries between static content, dynamic applications, and APIs
5. **Scalability**: Auto-scaling containers and serverless APIs

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Repository                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   CDK Code   │  │  Static Web  │  │  Dynamic Web │          │
│  │    (src/)    │  │  (homePage/) │  │(dynamichome/)│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ GitHub Actions   │
                    │  - Build & Test  │
                    │  - Docker Build  │
                    │  - Upload to S3  │
                    └──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          AWS Account                             │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              CodePipeline (Self-Mutating)                   │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │ │
│  │  │  Source  │→ │   Build  │→ │  Deploy  │                 │ │
│  │  │   (S3)   │  │   (CDK)  │  │ (Stages) │                 │ │
│  │  └──────────┘  └──────────┘  └──────────┘                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────┐      ┌─────────────────────┐          │
│  │   Static Website    │      │  Dynamic Website    │          │
│  │  ┌──────────────┐   │      │  ┌──────────────┐   │          │
│  │  │  CloudFront  │   │      │  │ API Gateway  │   │          │
│  │  └──────┬───────┘   │      │  └──────┬───────┘   │          │
│  │         │            │      │         │            │          │
│  │  ┌──────▼───────┐   │      │  ┌──────▼───────┐   │          │
│  │  │   S3 Bucket  │   │      │  │    Lambda    │   │          │
│  │  │   (React)    │   │      │  │   (React)    │   │          │
│  │  └──────────────┘   │      │  └──────────────┘   │          │
│  └─────────────────────┘      └─────────────────────┘          │
│                                                                   │
│  ┌─────────────────────┐      ┌─────────────────────┐          │
│  │   Backend APIs      │      │   Authentication    │          │
│  │  ┌──────────────┐   │      │  ┌──────────────┐   │          │
│  │  │ API Gateway  │   │      │  │    Cognito   │   │          │
│  │  └──────┬───────┘   │      │  │  User Pool   │   │          │
│  │         │            │      │  └──────────────┘   │          │
│  │  ┌──────▼───────┐   │      │                      │          │
│  │  │   Lambda     │   │      │                      │          │
│  │  │  Functions   │   │      │                      │          │
│  │  └──────┬───────┘   │      │                      │          │
│  │         │            │      │                      │          │
│  │  ┌──────▼───────┐   │      │                      │          │
│  │  │  DynamoDB    │   │      │                      │          │
│  │  └──────────────┘   │      │                      │          │
│  └─────────────────────┘      └─────────────────────┘          │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              DNS & Certificates (Route53)                │   │
│  │         test.tjeldnes.com + subdomains                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**Deployment Flow:**
1. Developer pushes code to GitHub
2. GitHub Actions builds artifacts and Docker images
3. Artifacts uploaded to S3 trigger EventBridge rule
4. CodePipeline executes, synthesizes CDK, and deploys infrastructure
5. Pipeline self-mutates if pipeline definition changes

**User Access Flow (Static):**
1. User navigates to test.tjeldnes.com
2. Route53 resolves to CloudFront distribution
3. CloudFront serves content from S3 bucket
4. React app makes API calls to Visitor Counter API

**User Access Flow (Dynamic):**
1. User navigates to dynamic.test.tjeldnes.com
2. Route53 resolves to API Gateway custom domain
3. API Gateway invokes Lambda function
4. Lambda serves React application (index.html and assets)
5. User authenticates via Cognito hosted UI
6. Protected routes validate JWT tokens in browser
7. Authenticated users can access Scoreboard API

## Components and Interfaces

### 1. CDK Infrastructure (`src/`)

**Purpose**: Define all AWS resources as code using TypeScript CDK constructs

**Structure**:
```
src/
├── app.ts                          # CDK app entry point
├── config.ts                       # Centralized configuration
├── pipelines/
│   └── pipeline.ts                 # CodePipeline definition
├── stacks/
│   ├── build-artifact-stack.ts     # GitHub OIDC & artifact storage
│   ├── certificate-stack.ts        # ACM certificates
│   ├── dns-stack.ts                # Route53 hosted zone
│   └── website-resources-stack.ts  # Static site, dynamic site, APIs, Cognito
└── stages/
    ├── build-artifact-stage.ts     # Build artifacts deployment stage
    └── webpage-stage.ts            # Website deployment stage
```

**Key Design Decisions**:
- **Stack Organization**: Separate stacks for logical grouping (DNS, certificates, build artifacts, website resources including dynamic site)
  - *Rationale*: Enables independent updates and follows AWS best practices for stack boundaries. Dynamic website moved to website-resources-stack since it no longer requires VPC infrastructure
- **Cross-Region Support**: Certificate stack deployed in us-east-1 for CloudFront, other resources in eu-central-1
  - *Rationale*: CloudFront requires certificates in us-east-1 region
- **Centralized Configuration**: Single `config.ts` file for project settings
  - *Rationale*: Simplifies environment-specific deployments and reduces duplication

**Interfaces**:
- Configuration object exported from `config.ts`:
  ```typescript
  {
    projectPrefix: string,
    region: string,
    account: string,
    domainName: string,
    githubRepo: string,
    githubOwner: string
  }
  ```

### 2. CI/CD Pipeline

**Purpose**: Automate build, test, and deployment processes

**Components**:

**GitHub Actions Workflow** (`.github/workflows/ci.yaml`):
- Triggers on all branch pushes
- Builds static and dynamic websites
- Runs tests and linting
- Builds Docker images for dynamic website
- On main branch: uploads artifacts to S3 and pushes images to ECR

**AWS CodePipeline**:
- Source stage: S3 bucket with EventBridge trigger
- Build stage: CDK synth using CodeBuild
- Deploy stages: Sequential deployment of build artifacts and webpage resources
- Self-mutating: Updates itself when pipeline definition changes

**Key Design Decisions**:
- **OIDC Authentication**: GitHub Actions uses OIDC federation instead of access keys
  - *Rationale*: Eliminates long-lived credentials, improves security posture
- **EventBridge Trigger**: S3 upload triggers pipeline via EventBridge
  - *Rationale*: Decouples GitHub Actions from AWS CodePipeline, enables flexible triggering
- **Self-Mutating Pipeline**: Pipeline can update its own definition
  - *Rationale*: Enables infrastructure changes without manual pipeline updates

**Interfaces**:
- GitHub Actions outputs: Artifacts in S3, Docker images in ECR
- Pipeline stages: CDK stages implementing `IStage` interface
- EventBridge rule: Matches S3 PutObject events on artifact bucket

### 3. Static Website (`homePage/`)

**Purpose**: Serve public-facing content without authentication

**Technology Stack**:
- React with TypeScript
- Vite for build tooling
- React Router for client-side routing

**AWS Infrastructure**:
- S3 bucket for static file storage
- CloudFront distribution for CDN
- Origin Access Identity for S3 security
- Route53 A record pointing to CloudFront

**Key Design Decisions**:
- **CloudFront Distribution**: Global CDN for low-latency access
  - *Rationale*: Improves performance for global users, provides HTTPS termination
- **Origin Access Identity**: CloudFront-only access to S3
  - *Rationale*: Prevents direct S3 access, enforces security boundary
- **Error Page Routing**: 403/404 errors redirect to index.html
  - *Rationale*: Enables client-side routing in single-page application
- **Cache Control**: Configured cache headers for optimal performance
  - *Rationale*: Reduces origin requests and improves load times

**Interfaces**:
- Public routes: `/`, `/about`, `/hangman`
- API integration: Visitor Counter API via fetch
- Environment variables: API endpoints injected at build time

### 4. Dynamic Website (`dynamichomePage/`)

**Purpose**: Serve authenticated content with user-specific features

**Technology Stack**:
- React with TypeScript
- Vite for build tooling
- React Router with protected routes
- AWS Amplify for Cognito integration
- Node.js Lambda handler for serving static assets

**AWS Infrastructure**:
- Lambda function with Node.js runtime
- API Gateway HTTP API with custom domain
- S3 bucket for deployment package storage
- CloudWatch Logs with 30-day retention

**Key Design Decisions**:
- **Lambda Function**: Serverless function serving pre-built React app
  - *Rationale*: Eliminates VPC costs (~$32/month NAT Gateway savings), automatic scaling, pay-per-request pricing, no infrastructure management
- **API Gateway HTTP API**: Modern HTTP API for routing
  - *Rationale*: Lower cost than REST API, built-in CORS support, simpler configuration, automatic HTTPS
- **Static Asset Serving**: Lambda serves pre-built HTML, CSS, JS files
  - *Rationale*: React SPA is just static files after build, no need for container runtime
- **Client-Side Routing**: All routes return index.html for React Router
  - *Rationale*: Enables single-page application routing without server-side logic
- **Automatic Scaling**: Lambda scales automatically with request volume
  - *Rationale*: No configuration needed, handles any traffic pattern, cost-efficient for variable load

**Interfaces**:
- Public routes: `/`, `/about`, `/hangman`
- Protected routes: `/resume`, `/crossword`, `/tictactoe`
- Authentication: Cognito OAuth 2.0 authorization code flow (client-side)
- API integration: Scoreboard API with JWT authentication
- Environment variables (injected at build time):
  ```
  VITE_COGNITO_USER_POOL_ID
  VITE_COGNITO_CLIENT_ID
  VITE_COGNITO_DOMAIN
  VITE_SCOREBOARD_API_URL
  ```

**Lambda Handler**:
- Serves index.html for all HTML requests (client-side routing)
- Serves static assets (JS, CSS, images) with proper MIME types
- Returns 404 for missing assets
- Implements caching headers for performance

### 5. Visitor Counter API

**Purpose**: Track and increment visitor counts for website analytics

**Technology Stack**:
- Python 3.x
- AWS Lambda for serverless execution
- DynamoDB for data persistence
- API Gateway for HTTP interface

**AWS Infrastructure**:
- Lambda function with Python runtime
- DynamoDB table with `id` as partition key
- API Gateway REST API with custom domain
- IAM role with DynamoDB read/write permissions

**Key Design Decisions**:
- **Serverless Architecture**: Lambda + DynamoDB
  - *Rationale*: Zero server management, automatic scaling, pay-per-request pricing
- **Atomic Increments**: DynamoDB UpdateExpression with ADD operation
  - *Rationale*: Ensures accurate counts under concurrent requests
- **CORS Support**: Preflight request handling
  - *Rationale*: Enables browser-based API calls from different domains

**API Interface**:
```
POST /increment
Content-Type: application/json

Request Body:
{
  "id": "homepage" | "about" | "resume" | etc.
}

Response:
{
  "count": number
}
```

**Error Handling**:
- 400: Missing or invalid `id` field
- 500: DynamoDB operation failures

### 6. Scoreboard API

**Purpose**: Track game wins for authenticated users

**Technology Stack**:
- Python 3.x
- AWS Lambda for serverless execution
- DynamoDB for data persistence
- API Gateway for HTTP interface
- JWT token validation

**AWS Infrastructure**:
- Lambda function with Python runtime
- DynamoDB table with `userId` as partition key
- API Gateway REST API with custom domain
- IAM role with DynamoDB read/write permissions

**Key Design Decisions**:
- **JWT Authentication**: Extract user ID from token sub claim
  - *Rationale*: Secure user identification without additional database lookups
- **User Isolation**: Each user can only access their own scores
  - *Rationale*: Prevents score manipulation and ensures data privacy
- **Automatic Initialization**: New users start with 0 wins
  - *Rationale*: Simplifies client logic and ensures consistent behavior

**API Interface**:
```
POST /wins
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "userId": string,
  "wins": number
}

GET /wins
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "userId": string,
  "wins": number
}
```

**Error Handling**:
- 401: Missing or invalid Authorization header
- 500: DynamoDB operation failures

### 7. Authentication System (AWS Cognito)

**Purpose**: Manage user registration, authentication, and authorization

**AWS Infrastructure**:
- Cognito User Pool with email-based authentication
- User Pool Client with OAuth 2.0 configuration
- Hosted UI for authentication flows
- User Pool Domain for hosted UI

**Key Design Decisions**:
- **Self-Service Registration**: Users can sign up without admin approval
  - *Rationale*: Reduces friction for new users, enables scalability
- **Email Verification**: Required for account activation
  - *Rationale*: Validates user identity and prevents spam accounts
- **Password Policy**: Minimum 8 characters with uppercase, lowercase, and digits
  - *Rationale*: Balances security with usability
- **OAuth 2.0 Authorization Code Flow**: Standard authentication pattern
  - *Rationale*: Industry-standard, secure, supports refresh tokens
- **JWT Tokens**: OpenID, email, and profile scopes
  - *Rationale*: Provides necessary user information for API authorization
- **Multi-Environment Callbacks**: Supports production and localhost URLs
  - *Rationale*: Enables local development without separate Cognito pools
- **Retention Policy**: User pool retained on stack deletion
  - *Rationale*: Prevents accidental user data loss

**Configuration**:
```typescript
{
  signInAliases: { email: true },
  selfSignUpEnabled: true,
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireDigits: true
  },
  oauth: {
    flows: { authorizationCodeGrant: true },
    scopes: [OAuthScope.OPENID, OAuthScope.EMAIL, OAuthScope.PROFILE],
    callbackUrls: [production_url, localhost_url],
    logoutUrls: [production_url, localhost_url]
  }
}
```

### 8. DNS and Certificate Management

**Purpose**: Provide custom domains with SSL/TLS encryption

**AWS Infrastructure**:
- Route53 Hosted Zone for test.tjeldnes.com
- ACM Certificates in us-east-1 (CloudFront) and eu-central-1 (ALB)
- DNS validation for certificate issuance
- A records for website and API endpoints

**Key Design Decisions**:
- **Subdomain Delegation**: Separate hosted zone for test.tjeldnes.com
  - *Rationale*: Isolates test environment DNS from production domain
- **Automated DNS Validation**: ACM certificates use DNS validation
  - *Rationale*: No manual intervention required, automatic renewal
- **Multi-Region Certificates**: Certificates in both us-east-1 and eu-central-1
  - *Rationale*: CloudFront requires us-east-1, ALB uses regional certificate
- **Wildcard Support**: Certificates support *.test.tjeldnes.com
  - *Rationale*: Enables flexible subdomain usage without new certificates

**DNS Records**:
```
test.tjeldnes.com           → CloudFront (Static Website)
dynamic.test.tjeldnes.com   → API Gateway (Dynamic Website)
api.test.tjeldnes.com       → API Gateway (Visitor Counter)
scoreboard.test.tjeldnes.com → API Gateway (Scoreboard)
```

### 9. Build Artifact Management

**Purpose**: Store and manage build artifacts and enable GitHub Actions authentication

**AWS Infrastructure**:
- S3 bucket for artifact storage (CDK code and dynamic website deployment packages)
- IAM OIDC identity provider for GitHub
- IAM role for GitHub Actions with S3 permissions
- EventBridge rule to trigger CodePipeline

**Key Design Decisions**:
- **OIDC Federation**: GitHub Actions authenticates via OIDC
  - *Rationale*: No long-lived credentials, improved security, automatic rotation
- **Repository Restriction**: IAM role limited to specific GitHub repository
  - *Rationale*: Prevents unauthorized access from other repositories
- **EventBridge Trigger**: S3 uploads trigger pipeline automatically
  - *Rationale*: Decouples build and deploy, enables flexible triggering patterns
- **Versioned Artifacts**: S3 versioning enabled for rollback capability
  - *Rationale*: Enables quick rollback to previous versions if needed

**Interfaces**:
- GitHub Actions role permissions: S3 PutObject
- EventBridge rule: Matches S3 PutObject events on artifact bucket
- Artifact types: CDK source code zip, dynamic website deployment package

## Data Models

### DynamoDB Tables

**Visitor Counter Table**:
```typescript
{
  TableName: "VisitorCounters",
  PartitionKey: "id" (String),
  Attributes: {
    id: string,        // e.g., "homepage", "about", "resume"
    count: number      // Visitor count
  }
}
```

**Scoreboard Table**:
```typescript
{
  TableName: "Scoreboard",
  PartitionKey: "userId" (String),
  Attributes: {
    userId: string,    // Cognito user sub claim
    wins: number       // Total wins across all games
  }
}
```

### Cognito User Attributes

```typescript
{
  sub: string,           // Unique user identifier (UUID)
  email: string,         // User email address
  email_verified: boolean,
  cognito:username: string
}
```

### JWT Token Structure

```typescript
{
  sub: string,           // User ID
  email: string,         // User email
  token_use: "id" | "access",
  auth_time: number,
  exp: number,
  iat: number,
  iss: string,           // Cognito issuer URL
  aud: string            // Client ID
}
```

## Error Handling

### Frontend Error Handling

**Static Website**:
- Network errors: Display user-friendly error messages
- API failures: Graceful degradation (e.g., visitor counter shows "N/A")
- Routing errors: 404 page redirects to home

**Dynamic Website**:
- Authentication errors: Redirect to login page
- Authorization errors: Display "Access Denied" message
- API failures: Toast notifications with retry options
- Network errors: Offline indicator with retry mechanism

### Backend Error Handling

**Lambda Functions**:
- Input validation: Return 400 with descriptive error message
- DynamoDB errors: Log error, return 500 with generic message
- Authentication errors: Return 401 with WWW-Authenticate header
- CORS errors: Ensure preflight responses include proper headers

**Error Response Format**:
```json
{
  "error": "Error message",
  "statusCode": 400 | 401 | 500
}
```

### Infrastructure Error Handling

**CDK Deployment**:
- Stack rollback on failure
- CloudFormation change sets for preview
- Manual approval gates for production (optional)

**Lambda Deployment**:
- Automatic versioning: Each deployment creates new Lambda version
- Alias support: Optional blue-green deployment with traffic shifting
- Rollback: Update function code to previous S3 object version

**Pipeline Error Handling**:
- Build failures: Stop pipeline, send notifications
- Deployment failures: Automatic rollback to previous version
- Manual approval: Optional gates for production deployments

## Testing Strategy

### Unit Testing

**CDK Infrastructure**:
- Test stack synthesis produces valid CloudFormation
- Verify resource properties match requirements
- Test cross-stack references resolve correctly
- Validate IAM policies follow least-privilege principle

**Lambda Functions**:
- Test input validation logic
- Mock DynamoDB operations
- Test JWT token parsing and validation
- Verify CORS header generation

**Frontend Components**:
- Test React component rendering
- Test protected route logic
- Mock API calls and test error handling
- Test authentication state management

### Integration Testing

**API Testing**:
- Test end-to-end API flows with real DynamoDB
- Verify CORS configuration with browser requests
- Test authentication flow with Cognito
- Validate API Gateway integration

**Website Testing**:
- Test static website deployment and CloudFront caching
- Test dynamic website container startup and health checks
- Verify authentication redirects and token handling
- Test API integration from frontend

### End-to-End Testing

**Deployment Pipeline**:
- Test full CI/CD flow from code commit to deployment
- Verify GitHub Actions artifact upload
- Test CodePipeline trigger and execution
- Validate self-mutation capability

**User Flows**:
- Test visitor counter increments on page load
- Test user registration and email verification
- Test login flow and protected route access
- Test game score tracking and persistence

### Manual Testing

**Security Testing**:
- Verify HTTPS enforcement on all endpoints
- Test IAM role permissions and boundaries
- Validate Cognito password policies
- Test CORS restrictions

**Performance Testing**:
- Load test APIs with concurrent requests
- Test auto-scaling behavior under load
- Verify CloudFront cache hit rates
- Test ECS task startup time

### Testing Tools

- **Jest**: Unit testing for TypeScript/JavaScript
- **AWS CDK Assertions**: Infrastructure testing
- **Pytest**: Lambda function testing
- **Postman/curl**: API integration testing
- **Browser DevTools**: Frontend debugging and network analysis
- **AWS CloudWatch**: Monitoring and log analysis

### Continuous Testing

- GitHub Actions runs tests on every push
- Pre-deployment validation in CodePipeline
- Health checks during ECS deployments
- CloudWatch alarms for production monitoring

## Deployment Strategy

### Multi-Stage Deployment

**Stage 1: Build Artifacts**
- Deploy S3 bucket for artifacts
- Deploy ECR repository for Docker images
- Deploy GitHub Actions IAM role and OIDC provider
- Deploy EventBridge rule for pipeline trigger

**Stage 2: Webpage Resources**
- Deploy DNS and certificates
- Deploy static website (S3 + CloudFront)
- Deploy dynamic website (Lambda + API Gateway)
- Deploy APIs (Lambda + API Gateway)
- Deploy Cognito User Pool

### Deployment Order

1. DNS Stack (Route53 Hosted Zone)
2. Certificate Stack (ACM Certificates with DNS validation)
3. Build Artifact Stack (S3, ECR, IAM, EventBridge)
4. Website Resources Stack (All application resources)

**Rationale**: DNS and certificates must exist before other resources can reference them. Build artifacts must be deployed before the pipeline can deploy application resources.

### Rollback Strategy

- CloudFormation automatic rollback on stack failure
- Lambda function versions for code rollback
- S3 versioning for artifact rollback
- Manual rollback via CloudFormation console if needed

### Blue-Green Deployment (Future Enhancement)

- Use Lambda aliases for blue-green deployments
- Gradual traffic shifting between versions
- Automatic rollback on error rate threshold
- CodeDeploy integration for advanced deployment patterns

## Security Considerations

### Authentication and Authorization

- Cognito manages all user authentication
- JWT tokens for API authorization
- Token validation in Lambda functions
- Secure token storage in browser (httpOnly cookies recommended for future)

### Network Security

- HTTPS enforced on all endpoints
- Lambda functions run in AWS-managed VPC (no customer VPC required)
- S3 bucket blocks all public access
- Origin Access Identity for CloudFront-S3 communication
- API Gateway resource policies for access control (if needed)

### IAM Security

- Least-privilege IAM roles for all services
- OIDC federation eliminates long-lived credentials
- Service-specific roles (Lambda, CodeBuild)
- Resource-based policies for cross-account access

### Data Security

- Encryption at rest for S3 and DynamoDB (AWS managed keys)
- Encryption in transit via HTTPS/TLS
- User pool retention policy prevents accidental deletion
- No sensitive data in logs or error messages

### Secrets Management

- Cognito credentials injected as environment variables
- No hardcoded secrets in code or configuration
- AWS Systems Manager Parameter Store for sensitive config (future)
- GitHub Secrets for CI/CD credentials

## Monitoring and Observability

### CloudWatch Logs

- Lambda function logs with 30-day retention
- API Gateway access logs
- CloudFront access logs (optional)

### CloudWatch Metrics

- Lambda invocation count, duration, errors, concurrent executions
- API Gateway request count, latency, errors
- DynamoDB read/write capacity and throttles

### Alarms (Future Enhancement)

- Lambda error rate threshold
- Lambda duration approaching timeout
- API Gateway 5xx error rate
- DynamoDB throttling events

### Distributed Tracing (Future Enhancement)

- AWS X-Ray for request tracing
- End-to-end latency analysis
- Service map visualization
- Performance bottleneck identification

## Future Enhancements

### Scalability Improvements

- DynamoDB on-demand pricing for unpredictable traffic
- CloudFront caching optimization
- Lambda provisioned concurrency for consistent performance
- API Gateway caching for read-heavy endpoints

### Feature Additions

- User profile management
- Game leaderboards (global scoreboard)
- Real-time multiplayer games via WebSockets
- Social authentication (Google, Facebook)
- Email notifications via SES

### Operational Improvements

- Automated backup and restore procedures
- Disaster recovery plan and testing
- Cost optimization analysis and recommendations
- Performance monitoring dashboards
- Automated security scanning and compliance checks

### Development Experience

- Local development environment with LocalStack
- Automated integration tests in CI/CD
- Infrastructure testing with CDK assertions
- Preview environments for pull requests
- Automated dependency updates with Dependabot
