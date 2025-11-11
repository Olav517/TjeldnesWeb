terraform {
  required_providers {
    aws = ">= 3.0.0"
  }
  backend "s3" {
    bucket = "<your-s3-bucket-name>"
    key    = "terraform/state.tfstate"
    region = "eu-central-1"
    # Optional: encrypt = true
    # Optional: dynamodb_table = "<your-lock-table>"
  }
}


provider "aws" {
  region = "eu-central-1"
}


resource "aws_s3_bucket" "this" {
  bucket = "<your-s3-bucket-name> "

  acl    = "private"

  versioning {
    enabled = true
  }

  lifecycle {
    prevent_destroy = true
  }
}