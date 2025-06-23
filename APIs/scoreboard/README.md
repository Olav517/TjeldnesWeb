# Scoreboard Lambda

This Lambda function provides a per-user scoreboard using DynamoDB. It supports:

- Incrementing a user's win count (POST)
- Retrieving a user's win count (GET)

## Endpoints

- `POST /` — Increment the authenticated user's win count
- `GET /` — Get the authenticated user's win count

## Authentication

- Requires a Cognito JWT in the `Authorization` header (Bearer token)
- Uses the `sub` claim as the user ID

## DynamoDB Table

- Table name: `Scoreboard`
- Partition key: `userId` (string)
- Attribute: `wins` (number)

## Environment Variables

- `TABLE_NAME` — Name of the DynamoDB table (default: `Scoreboard`)

## Dependencies

- boto3
- PyJWT

## CORS

- CORS is enabled for all origins and methods

## Deployment

- Deploy as an AWS Lambda function
- Set the `TABLE_NAME` environment variable if needed
- Attach IAM permissions for DynamoDB access 