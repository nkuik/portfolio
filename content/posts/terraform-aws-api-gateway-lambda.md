---
title: "Terraforming a Custom Domained Lambda Function Behind API Gateway"
date: 2021-04-02T07:00:00+01:00
draft: false
---

I was setting up a Lambda Function that sat behind a specific route of an API Gateway the other day at work, and while specific parts of this setup can be found here and there on the interwebs, I didn't find an end-to-end solution that just worked "out of the box." This post shows how to create the following using Terraform:

* V2 HTTP API Gateway
* Gateway stage, route, and integration that point to a Lambda Function
* Adding a custom domain using Amazon Certificate Manager and Route 53

It is important to note that API Gateway has two versions, with V1 allowing a REST API and V2 allowing HTTP and Websocket. In looking over the resources I would need to create and the considerations of my API, I decided that HTTP would be enough and that the V2 Gateway setup was more straightforward. You can read more about the difference between the HTTP and REST API Gateways [here](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-vs-rest.html).

First, we will need the Lambda function that we want to run behind the Gateway endpoint. There are several ways to do this, but since this post is mostly about the setup _around_ the function, and less about the function itself, we will take the easy route of storing the code directly in the Terraform directory (change me). For this post, we will assume a module structure like this:

```
source/
    lambda_function.py
<layer-file>.zip
main.tf
```

My function was in python, so let's say you have a python Lambda Function such as this:

```
data "archive_file" "source" {
  type        = "zip"
  source_dir  = "${path.module}/source"
  output_path = "${path.module}/.temp/source.zip"
}

resource "aws_lambda_layer_version" "<layer-file>" {
  layer_name = "aws-lambda-${var.name}-<layer_file>"
  filename                       = "${path.module}/<layer-file>.zip"
  source_code_hash               = filebase64sha256("${path.module}/<layer-file>.zip")
  lifecycle {
    ignore_changes = [filename]
  }
}

resource "aws_lambda_function" "this" {
  function_name                  = var.name
  filename                       = data.archive_file.source.output_path
  handler                        = "lambda_function.lambda_handler"
  description                    = "A useful lambda function"
  source_code_hash               = data.archive_file.source.output_base64sha256
  runtime                        = "python3.8"
  memory_size                    = 256
  timeout                        = 60
  reserved_concurrent_executions = 5
  role                           = aws_iam_role.this.arn
  layers = [
    aws_lambda_layer_version.<layer-file>.arn,
  ]
}

```
