---
title: "Terraformed AWS API Gateway Lambda Function with Custom Domain"
date: 2021-04-18T12:00:00+01:00
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
│   ├── requirements.txt
│   ├── aws-layer/
│   │   ├── custom_layer.zip
│   │   ├── python/lib/python28.8/site-packages/<pip installed packages>
├── main.tf
├── variables.tf
```

The example code for this post can be found in [this repo](https://github.com/nkuik/terraform-aws-api-gateway-lambda-demo).

## Lambda Function

This setup requires zipping a custom Lambda layer of the dependencies required for the `lambda_function.py`; creating the `.zip` is largely a matter of `pip` installing and then zipping. A more detailed description of layer-creation can be found in [this guide](https://towardsdatascience.com/building-custom-layers-on-aws-lambda-35d17bd9abbb).

After the layer is zipped, the HCL for creating the Lambda function (`main.tf`) would look something like this:

```
resource "aws_iam_role" "this" {
  name               = "aws-lambda-${var.name}"
  assume_role_policy = data.aws_iam_policy_document.assume.json
}

data "aws_iam_policy_document" "assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

data "archive_file" "source" {
  type        = "zip"
  source_dir  = "${path.module}/source"
  output_path = "${path.module}/.temp/source.zip"
}

resource "aws_lambda_layer_version" "this" {
  layer_name       = "aws-lambda-${var.name}-custom-layer"
  filename         = "${path.module}/source/aws-layer/custom-layer.zip"
  source_code_hash = filebase64sha256("${path.module}/source/aws-layer/custom-layer.zip")
}

resource "aws_lambda_function" "this" {
  function_name    = var.name
  filename         = data.archive_file.source.output_path
  handler          = "lambda_function.lambda_handler"
  description      = var.description
  source_code_hash = data.archive_file.source.output_base64sha256
  runtime          = "python3.8"
  memory_size      = 256
  timeout          = 60
  role             = aws_iam_role.this.arn
  layers = [
    aws_lambda_layer_version.this.arn,
  ]
}

resource "aws_cloudwatch_log_group" "this" {
  name              = "/aws/lambda/${aws_lambda_function.this.function_name}"
  retention_in_days = 14
}
```

## API Gateway V2

The Lambda function now exists, but we cannot trigger it by hitting and endpoint yet. Let's create the API Gateway and "hook" our Lambda into it. This requires the creation of some additional API Gateway resources, and doing so will allow additional Lambda functions to be added to separate paths on your API Gateway. Creating the Gateway, stage, integration, and route is something like this:

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
  route_key = "POST /{proxy+}"

  target = "integrations/${aws_apigatewayv2_integration.this.id}"
}

resource "aws_lambda_permission" "this" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this.arn
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}

output "api_gateway_endpoint" {
  value = aws_apigatewayv2_api.this.api_endpoint
}
```

At this point, it should be possible to hit the Lambda function at the correct path (`route_key` in the gateway route) at the url output as `api_gateway_endpoint`. Make sure this is reachable before moving onto any additional steps, as it will make things only more complicated as we add a custom domain and certificate to an endpoint that doesn't work.

There are a few things to note the resources created here. First, we add `access_log_settings` to gateway stage, and the fields here correspond to what is available on the `$context` variable (more on that [here](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-mapping-template-reference.html#context-variable-reference)). This gives us a bit more logging context in the CloudWatch logroup that we create, and these logs can be quite helpful when determining if there any issues that occur between the gateway stage and the execution of the Lambda function.

Second, the values for `integration_type`, `connection_type`, and `integration_method` in the gateway integration are also notable, as these would change depending on your use case.

Third, the `route_key` is also important, and the way this is setup will depend on the way your API Gateway is organized. Here, I only want to create a single endpoint, but I might also want to add an additional `/v1/` or not add the `{proxy+}`, which is a way to indicate that requests at any paths past `/` will still be sent to this route. If `{proxy+}` was not added here, a request at any path past just `/` would not be routed to this path, resulting in `404`.

Finally, it's necessary to create a Lambda permission for the API Gateway, or the Gateway will not be able to run the Lambda. I spent considerable time trying to figure this out, and when I finally added the `integrationErrorMessage` to the `access_log_settings`, I was able to determine the problem.

## Domain Name, Certificate, & Route 53

Now we have a working API Gateway that routes a specific path url to a specific Lambda function. However, we are still stuck with the API url that AWS has generated for us. In the next section, we will be creating a Route 53 zone, certificate using AWS certificate manager, and the necessary records/permissions to be able to add a custom domain for our API Gateway. 

```
resource "aws_route53_zone" "this" {
  name = "${var.name}.com"
}

resource "aws_acm_certificate" "this" {
  domain_name = aws_route53_zone.this.name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "zone" {
  for_each = {
    for dvo in aws_acm_certificate.this.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 300
  type            = each.value.type
  zone_id         = aws_route53_zone.this.zone_id
}

resource "aws_acm_certificate_validation" "this" {
  certificate_arn         = aws_acm_certificate.this.arn
  validation_record_fqdns = [for record in aws_route53_record.zone : record.fqdn]
}

resource "aws_apigatewayv2_domain_name" "this" {
  domain_name = aws_route53_zone.this.name

  domain_name_configuration {
    certificate_arn = aws_acm_certificate.this.arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }

  depends_on = [
    aws_acm_certificate_validation.this,
  ]
}

resource "aws_route53_record" "api_gateway_record" {
  name    = aws_apigatewayv2_domain_name.this.domain_name
  type    = "A"
  zone_id = aws_route53_zone.this.zone_id

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

You can see that the Lambda function name is being used for the Route 53 zone, and also for the name of the custom domain for the API Gateway. As it was not completely obvious to me at the time, creating a Route 53 zone does not automatically also register the domain for you automatically; the domain can be purchases and registered using Route 53, or any other service that sells domains, but buying from an external service results in additional creation of DNS records on that service.

Just make sure that whatever is used as the Route 53 zone name and API Gateway domain name is one you own and can create records on.

At this point it should be possible to call our Lambda function at the corresponding path using the custom domain that was just added.

### Disable execute endpoint

With things in relative order, it can also be a good idea to disable the execute endpoint, as this is no longer needed. Route 53 will point to the API Gateway's endpoint instead, and it will still be possible to call the custom domain endpoint without the execute API endpoint enabled. Just remember to also remove any references to the execute API endpoint, such as the output that was included earlier in the post.

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

## Summary

At this point, it should be possible to hit your Lambda function at the domain name of your Route 53 zone using SSL. You can see that it's only a `POST` method as of now, and if you read up on the [AWS API Gateway documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html), you can read about all the additional features that can be utilized, such as route responses, integration responses, and authorizers. 

And once again, here's the [link](https://github.com/nkuik/terraform-aws-api-gateway-lambda-demo) to the repo with the example code. Keep in mind that the code included there doesn't really take into consideration multiple routes with multiple Lambdas. Examples of such modules can be found relatively easily through a web search.
