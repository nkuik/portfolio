---
title: "Terraforming a Custom Domained Lambda Function Behind V2 API Gateway"
date: 2021-04-04T07:00:00+01:00
draft: false
---

## API Gateway V1 (REST) vs. V2 (Websocket and HTTP)

I was setting up a Lambda Function that sat behind a specific route of an API Gateway the other day at work, instead of setting up a microservice on a Kubernetes cluster and dealing with the ingress/deployment setup. While I was able to find specific parts of this setup out there on the interwebs, I didn't find an end-to-end solution that just worked "out of the box." This post shows how to create the following using Terraform:

* V2 HTTP API Gateway
* Gateway stage, route, and integration that point to a Lambda Function
* Adding a custom domain using Amazon Certificate Manager and Route 53

It is important to note that API Gateway has two versions, with V1 allowing a REST API and V2 allowing HTTP and Websocket. In looking over the resources I would need to create and the considerations of my API, I decided that HTTP would be enough and that the V2 Gateway setup was more straightforward. You can read more about the difference between the HTTP and REST API Gateways [here](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-vs-rest.html) and a brief overview of the additional features introduced in API Gateway V2 can be found [here](https://www.serverless.com/blog/api-gateway-v2-http-apis).

## Setup

First, we will need the Lambda function that we want to run behind the Gateway endpoint. There are several ways to do this, but since this post is mostly about the setup _around_ the function, and less about the function itself, we will take an easier route of storing the code directly in the Terraform directory (change me). For this post, while it won't really be reusable, due to the custom creation of the custom layer, we will assume a module structure of something like this:

```
├── source/
│   ├── lambda_function.py
├── custom_layer.zip
├── main.tf
├── variables.tf (TODO)
```

## Lambda Function

This setup requires zipping a custom Lambda layer of the dependencies required for the `lambda_function.py`; creating the `.zip` is largely a matter of `pip` installing and then zipping. A more detailed description of layer-creation can be found in [this guide](https://towardsdatascience.com/building-custom-layers-on-aws-lambda-35d17bd9abbb).

After the layer is zipped, the TCL for creating the Lambda function (`main.tf`) would look something like this:

```
data "archive_file" "source" {
  type        = "zip"
  source_dir  = "${path.module}/source"
  output_path = "${path.module}/.temp/source.zip"
}

resource "aws_lambda_layer_version" "custom_layer" {
  layer_name       = "aws-lambda-${var.name}-custom-layer"
  filename         = "${path.module}/custom_layer.zip"
  source_code_hash = filebase64sha256("${path.module}/custom_layer.zip")
  lifecycle {
  # TODO: Why needed?
    ignore_changes = [filename]
  }
}

resource "aws_lambda_function" "" {
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
    aws_lambda_layer_version.custom_layer.arn,
  ]
}
```

## The Gateway

The Lambda function now exists, but we cannot trigger it by hitting and endpoint yet. Let's create the API Gateway and "hook" our Lambda into it. This requires the creation of some additional API Gateway resources, but doing so will allow additional Lambda functions to be added to separate paths on your API Gateway. Creating the Gateway, stage, integration, and route is something like this:

```
resource "aws_apigatewayv2_api" "this" {
  name          = var.name
  protocol_type = "HTTP"

  cors_configuration {
    allow_headers = [
      "content-type",
    ]
    allow_methods = [
      "POST",
    ]
    allow_origins = [
      "*",
    ]
  }
}

resource "aws_apigatewayv2_stage" "this" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.this.arn
    format = jsonencode(
      {
        httpMethod              = "$context.httpMethod"
        ip                      = "$context.identity.sourceIp"
        protocol                = "$context.protocol"
        requestId               = "$context.requestId"
        requestTime             = "$context.requestTime"
        responseLength          = "$context.responseLength"
        routeKey                = "$context.routeKey"
        status                  = "$context.status"
        integrationStatus       = "$context.integration.integrationStatus"
        integrationErrorMessage = "$context.integration.error"
      }
    )
  }
}

resource "aws_apigatewayv2_integration" "this" {
  api_id           = aws_apigatewayv2_api.this.id
  integration_type = "AWS_PROXY"

  connection_type      = "INTERNET"
  description          = var.description
  integration_method   = "POST"
  integration_uri      = aws_lambda_function.this.invoke_arn
}

resource "aws_apigatewayv2_route" "this" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "POST /v1/webhook"

  target = "integrations/${aws_apigatewayv2_integration.this.id}"
}

resource "aws_lambda_permission" "this" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this.arn
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}

resource "aws_apigatewayv2_domain_name" "this" {
  domain_name = "${var.name}${local.unstarred_domain_name}"

  domain_name_configuration {
    certificate_arn = var.certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

output {

}
```


Route53
```
resource "aws_route53_record" "this" {
  name    = aws_apigatewayv2_domain_name.this.domain_name
  type    = "A"
  zone_id = var.route_53_zone_id

  alias {
    name                   = aws_apigatewayv2_domain_name.this.domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.this.domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = true
  }
}

resource "aws_apigatewayv2_api_mapping" "this" {
  api_id      = aws_apigatewayv2_api.this.id
  domain_name = aws_apigatewayv2_domain_name.this.id
  stage       = aws_apigatewayv2_stage.this.id
}

```


Disable execute endpoint
```
resource "aws_apigatewayv2_api" "this" {
  name                         = var.name
  protocol_type                = "HTTP"
  disable_execute_api_endpoint = true

  cors_configuration {
    allow_headers = [
      "content-type",
    ]
    allow_methods = ["POST"]
    allow_origins = [
      "*",
    ]
  }
}
```
