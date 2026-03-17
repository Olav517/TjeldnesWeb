# Implementation Plan

- [ ] 1. Set up centralized configuration and project structure
  - Create or update `src/config.ts` with project settings (region, account, domain, GitHub repo details)
  - Ensure proper TypeScript configuration for CDK project
  - _Requirements: 1.1, 1.4_

- [ ] 2. Implement DNS infrastructure stack
  - [ ] 2.1 Create `src/stacks/dns-stack.ts` with Route53 Hosted Zone
    - Implement hosted zone for test.tjeldnes.com subdomain
    - Export hosted zone ID and name servers for cross-stack reference
    - Create NS records in parent domain (if not exists)
    - _Requirements: 8.1, 8.2_

- [ ] 3. Implement certificate management stack
  - [ ] 3.1 Create `src/stacks/certificate-stack.ts` for multi-region certificates
    - Implement ACM certificate in us-east-1 for CloudFront with DNS validation
    - Implement ACM certificate in eu-central-1 for ALB with DNS validation
    - Support wildcard certificates (*.test.tjeldnes.com)
    - Export certificate ARNs for cross-stack reference
    - _Requirements: 8.3, 8.4, 8.5, 8.7_

- [ ] 4. Implement build artifact infrastructure
  - [ ] 4.1 Create `src/stacks/build-artifact-stack.ts` with S3 bucket
    - Implement S3 bucket for artifact storage with versioning enabled
    - Configure bucket encryption and lifecycle policies
    - _Requirements: 2.2, 9.3_
  
  - [ ] 4.2 Implement GitHub Actions OIDC authentication
    - Create IAM OIDC identity provider for GitHub
    - Create IAM role with trust policy for specific GitHub repository
    - Grant S3 PutObject permissions to GitHub Actions role
    - _Requirements: 2.5, 10.1, 10.2_
  
  - [ ] 4.3 Implement EventBridge trigger for CodePipeline
    - Create EventBridge rule matching S3 PutObject events on artifact bucket
    - Configure rule to trigger CodePipeline execution
    - _Requirements: 2.3_

- [ ] 5. Implement static website infrastructure
  - [ ] 5.1 Create static website S3 bucket and CloudFront distribution
    - Implement S3 bucket with public access blocked
    - Create Origin Access Identity for CloudFront
    - Configure CloudFront distribution with S3 origin
    - Implement SSL certificate attachment (us-east-1 certificate)
    - Configure cache behaviors and error page routing (403/404 → index.html)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 10.3, 10.4_
  
  - [ ] 5.2 Create Route53 A record for static website
    - Implement A record pointing test.tjeldnes.com to CloudFront distribution
    - _Requirements: 3.5, 8.6_

- [ ] 6. Implement Cognito user authentication
  - [ ] 6.1 Create Cognito User Pool with configuration
    - Implement User Pool with email sign-in and self-registration
    - Configure password policy (min 8 chars, uppercase, lowercase, digits)
    - Enable email verification for new accounts
    - Set retention policy to RETAIN on stack deletion
    - _Requirements: 5.1, 5.2, 5.7, 10.7_
  
  - [ ] 6.2 Configure Cognito OAuth and hosted UI
    - Create User Pool Client with OAuth 2.0 authorization code flow
    - Configure OAuth scopes (OpenID, email, profile)
    - Set callback URLs for production and localhost
    - Set logout URLs for production and localhost
    - Create User Pool Domain for hosted UI
    - _Requirements: 5.3, 5.4, 5.5, 5.6_

- [ ] 7. Implement Visitor Counter API
  - [ ] 7.1 Create DynamoDB table for visitor counts
    - Implement DynamoDB table with `id` as partition key
    - Configure on-demand or provisioned billing mode
    - _Requirements: 6.1_
  
  - [ ] 7.2 Implement Visitor Counter Lambda function
    - Write Python Lambda function code in `APIs/visitorcounter/api.py`
    - Implement POST endpoint to increment counter using DynamoDB UpdateExpression
    - Implement request validation for required `id` field
    - Implement CORS preflight handling (OPTIONS method)
    - Return updated counter value in response
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 7.3 Create API Gateway and Lambda integration
    - Implement API Gateway REST API for Visitor Counter
    - Create Lambda integration with proxy configuration
    - Configure custom domain (api.test.tjeldnes.com)
    - Create Route53 A record pointing to API Gateway
    - Create IAM role for Lambda with DynamoDB read/write permissions
    - _Requirements: 6.6, 8.6_

- [ ] 8. Implement Scoreboard API with authentication
  - [ ] 8.1 Create DynamoDB table for scoreboard
    - Implement DynamoDB table with `userId` as partition key
    - Configure on-demand or provisioned billing mode
    - _Requirements: 7.6_
  
  - [ ] 8.2 Implement Scoreboard Lambda function
    - Write Python Lambda function code in `APIs/scoreboard/api.py`
    - Implement JWT token extraction and validation from Authorization header
    - Implement POST endpoint to increment wins using DynamoDB UpdateExpression
    - Implement GET endpoint to retrieve current win count
    - Initialize win count to 0 for new users
    - Implement CORS preflight handling (OPTIONS method)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7_
  
  - [ ] 8.3 Create API Gateway and Lambda integration
    - Implement API Gateway REST API for Scoreboard
    - Create Lambda integration with proxy configuration
    - Configure custom domain (scoreboard.test.tjeldnes.com)
    - Create Route53 A record pointing to API Gateway
    - Create IAM role for Lambda with DynamoDB read/write permissions
    - _Requirements: 8.6_

- [ ] 9. Implement dynamic website infrastructure
  - [ ] 9.1 Create Lambda function for serving React app
    - Write Node.js Lambda handler in `dynamichomePage/lambda/handler.js`
    - Implement logic to serve index.html for all HTML requests (client-side routing)
    - Implement logic to serve static assets (JS, CSS, images) with proper MIME types
    - Implement caching headers for performance
    - Configure CloudWatch log group with 30-day retention
    - _Requirements: 4.1, 4.6, 12.1_
  
  - [ ] 9.2 Create API Gateway HTTP API
    - Implement HTTP API with custom domain (dynamic.test.tjeldnes.com)
    - Create Lambda integration with proxy configuration
    - Configure CORS settings
    - Attach SSL certificate (eu-central-1 certificate)
    - _Requirements: 4.2, 4.3_
  
  - [ ] 9.3 Create Route53 A record for dynamic website
    - Implement A record pointing dynamic.test.tjeldnes.com to API Gateway
    - _Requirements: 8.6_
  
  - [ ] 9.4 Grant Lambda execution role permissions
    - Create IAM role for Lambda function
    - Grant CloudWatch Logs write permissions
    - _Requirements: 10.6_

- [ ] 10. Implement website resources stack
  - [ ] 10.1 Create `src/stacks/website-resources-stack.ts`
    - Integrate all website components (static site, Cognito, APIs, dynamic site Lambda)
    - Import DNS and certificate resources from other stacks
    - Export relevant outputs (CloudFront URL, API Gateway URL, API endpoints, Cognito details)
    - _Requirements: 1.3_

- [ ] 11. Implement deployment stages
  - [ ] 11.1 Create `src/stages/build-artifact-stage.ts`
    - Implement CDK Stage for build artifact stack deployment
    - Configure stage name and environment
    - _Requirements: 11.1, 11.2, 11.4_
  
  - [ ] 11.2 Create `src/stages/webpage-stage.ts`
    - Implement CDK Stage for webpage resources deployment
    - Include DNS, certificate, and website resources stacks
    - Configure stage name and environment
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 12. Implement self-mutating CodePipeline
  - [ ] 12.1 Create `src/pipelines/pipeline.ts`
    - Implement CodePipeline with S3 source stage
    - Configure CodeBuild for CDK synth
    - Add build artifact deployment stage
    - Add webpage deployment stage
    - Enable self-mutation capability
    - _Requirements: 2.3, 2.4, 11.5_

- [ ] 13. Update CDK app entry point
  - [ ] 13.1 Update `src/app.ts` to instantiate pipeline
    - Import configuration from config.ts
    - Instantiate pipeline stack with proper environment
    - Add necessary stack dependencies
    - _Requirements: 1.1, 1.2_

- [ ] 14. Implement GitHub Actions workflow
  - [ ] 14.1 Create or update `.github/workflows/ci.yaml`
    - Configure workflow triggers (push to all branches)
    - Implement job to build static website (homePage)
    - Implement job to build dynamic website (dynamichomePage) with Vite
    - Implement job to package Lambda deployment (built React app + handler)
    - Configure OIDC authentication to AWS
    - Implement conditional artifact upload to S3 (main branch only)
    - _Requirements: 2.1, 2.2, 2.5, 9.1, 9.2, 9.3_

- [ ] 15. Implement frontend authentication integration
  - [ ] 15.1 Update dynamic website with Cognito integration
    - Install and configure AWS Amplify library in `dynamichomePage/`
    - Implement Cognito configuration using environment variables
    - Create ProtectedRoute component for route guarding
    - Update router to protect resume, crossword, and tictactoe routes
    - Implement login/logout functionality
    - _Requirements: 4.4, 4.5, 4.6_
  
  - [ ] 15.2 Implement Scoreboard API integration
    - Create API client in `dynamichomePage/src/components/scoreboardApi.ts`
    - Implement functions to get and increment wins with JWT authentication
    - Integrate scoreboard calls into game components
    - Handle authentication errors and token refresh
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 16. Implement Visitor Counter integration in static website
  - [ ] 16.1 Update static website with Visitor Counter API calls
    - Update `homePage/src/components/visitorcounter.tsx` to call API
    - Implement error handling and graceful degradation
    - Display visitor count on relevant pages
    - _Requirements: 6.1, 6.2_

- [ ] 17. Configure Lambda deployment package for dynamic website
  - [ ] 17.1 Create deployment package script
    - Create script to build React app with Vite
    - Package built assets with Lambda handler into zip file
    - Configure environment variable injection at build time
    - _Requirements: 4.1, 9.1, 9.2_

- [ ] 18. Implement infrastructure deployment scripts
  - [ ] 18.1 Update package.json with CDK deployment scripts
    - Add scripts for CDK synth, diff, and deploy
    - Add scripts for running tests
    - Document deployment process in README
    - _Requirements: 1.2_

- [ ] 19. Implement monitoring and logging
  - [ ] 19.1 Add CloudWatch log groups with retention policies
    - Configure 30-day retention for Lambda function logs
    - Configure retention for API Gateway access logs
    - _Requirements: 12.1, 12.4_
  
  - [ ] 19.2 Configure Lambda monitoring
    - Enable X-Ray tracing for Lambda function (optional)
    - Configure Lambda reserved concurrency if needed
    - _Requirements: 12.3_

- [ ] 20. Write infrastructure tests
  - [ ] 20.1 Create CDK stack tests
    - Write tests to verify stack synthesis
    - Test resource properties match requirements
    - Test cross-stack references resolve correctly
    - Validate IAM policies follow least-privilege
    - _Requirements: 1.1, 1.2_

- [ ] 21. Write Lambda function tests
  - [ ] 21.1 Create unit tests for Visitor Counter Lambda
    - Test input validation logic
    - Mock DynamoDB operations
    - Test CORS header generation
    - _Requirements: 6.4, 6.5_
  
  - [ ] 21.2 Create unit tests for Scoreboard Lambda
    - Test JWT token parsing and validation
    - Mock DynamoDB operations
    - Test CORS header generation
    - Test error handling for missing/invalid tokens
    - _Requirements: 7.3, 7.4, 7.5_

- [ ] 22. Write frontend tests
  - [ ] 22.1 Create tests for protected route logic
    - Test ProtectedRoute component behavior
    - Mock authentication state
    - Test redirect logic for unauthenticated users
    - _Requirements: 4.5, 4.6_
  
  - [ ] 22.2 Create tests for API integration
    - Mock API calls to Visitor Counter and Scoreboard
    - Test error handling and retry logic
    - Test authentication token handling
    - _Requirements: 6.2, 7.1, 7.2_

- [ ] 23. Document deployment and usage
  - [ ] 23.1 Update README with deployment instructions
    - Document prerequisites (AWS CLI, CDK, Node.js)
    - Document configuration steps
    - Document deployment commands
    - Document local development setup
    - _Requirements: 1.1, 1.2_
  
  - [ ] 23.2 Document API endpoints and usage
    - Document Visitor Counter API interface
    - Document Scoreboard API interface
    - Provide example requests and responses
    - _Requirements: 6.1, 7.1, 7.2_
