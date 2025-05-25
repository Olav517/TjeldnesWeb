import json
import logging
import os
from decimal import Decimal

import boto3

dynamodb = boto3.resource("dynamodb")
table_name = os.environ["TABLE_NAME"]
table = dynamodb.Table(table_name)


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def handler(event, context):
    try:
        # Handle CORS preflight request
        if event["httpMethod"] == "OPTIONS":
            return {
                "statusCode": 200,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
                "body": json.dumps("Preflight response"),
            }

        if "body" not in event or not event["body"]:
            raise ValueError("Missing event body, event is " + json.dumps(event))

        body = json.loads(event["body"])
        if "id" not in body:
            raise ValueError("missing 'id' in request body")

        item_id = body["id"]

        response = table.update_item(
            Key={"id": item_id},
            UpdateExpression="ADD #ctr :inc",
            ExpressionAttributeNames={"#ctr": "counter"},
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

    except json.JSONDecodeError:
        logging.exception("invalid JSON")
        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
            },
            "body": json.dumps({"error": "Invalid JSON"}),
        }
    except ValueError as e:
        logging.exception(json.dumps({"error": str(e)}))
        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
            },
            "body": json.dumps({"error": str(e)}),
        }

    except Exception as e:
        logging.exception(json.dumps({"error": str(e)}))
        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
            },
            "body": json.dumps({"error": str(e)}),
        }
