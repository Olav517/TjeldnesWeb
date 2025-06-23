import json
import logging
import os
from decimal import Decimal
import boto3
import jwt

dynamodb = boto3.resource("dynamodb")
table_name = os.environ.get("TABLE_NAME", "Scoreboard")
table = dynamodb.Table(table_name)

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def get_user_id(event):
    auth_header = event["headers"].get("Authorization")
    if not auth_header:
        raise ValueError("Missing Authorization header")
    token = auth_header.split(" ")[-1]
    try:
        # Decode without verification (for demo; use PyJWT verify in prod)
        decoded = jwt.decode(token, options={"verify_signature": False})
        return decoded["sub"]
    except Exception:
        raise ValueError("Invalid JWT token")

def handler(event, context):
    try:
        # Handle CORS preflight
        if event["httpMethod"] == "OPTIONS":
            return {
                "statusCode": 200,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization",
                },
                "body": json.dumps("Preflight response"),
            }

        user_id = get_user_id(event)

        if event["httpMethod"] == "POST":
            # Increment win count
            response = table.update_item(
                Key={"userId": user_id},
                UpdateExpression="ADD #wins :inc",
                ExpressionAttributeNames={"#wins": "wins"},
                ExpressionAttributeValues={":inc": 1},
                ReturnValues="UPDATED_NEW",
            )
            return {
                "statusCode": 200,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "*",
                },
                "body": json.dumps(response["Attributes"], cls=DecimalEncoder),
            }

        elif event["httpMethod"] == "GET":
            # Get win count
            result = table.get_item(Key={"userId": user_id})
            wins = result.get("Item", {}).get("wins", 0)
            return {
                "statusCode": 200,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "*",
                },
                "body": json.dumps({"wins": wins}, cls=DecimalEncoder),
            }
        else:
            return {
                "statusCode": 405,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "*",
                },
                "body": json.dumps({"error": "Method not allowed"}),
            }

    except Exception as e:
        logging.exception(json.dumps({"error": str(e)}))
        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
            },
            "body": json.dumps({"error": str(e)}),
        } 