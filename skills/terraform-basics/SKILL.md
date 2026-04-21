---
name: terraform-basics
description: Infrastructure as Code with Terraform. Define cloud resources in HCL, manage state, create modules, and implement CI/CD for infrastructure deployments.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: operations
  tags:
    - terraform
    - infrastructure
    - iac
    - aws
    - cloud
  personas:
    developer: 55
    researcher: 30
    analyst: 20
    operator: 90
    creator: 25
    support: 35
  summary: Infrastructure as Code with Terraform for provisioning and managing cloud resources
  featured: false
  requires:
    tools: [command-exec, file-read, file-write]
    mcp: []
    env: [AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY]
  author:
    name: Myah Team
    url: https://myah.dev
---

# Terraform Basics

Terraform is HashiCorp's Infrastructure as Code tool. Define your infrastructure in declarative HCL configuration files.

## Core Commands

```bash
terraform init      # Initialize working directory
terraform plan      # Preview changes
terraform apply     # Apply changes
terraform destroy   # Tear down infrastructure
terraform show      # Show current state
terraform state     # Advanced state management
```

## Basic Structure

```hcl
provider "aws" {
  region = "us-east-1"
}

resource "aws_s3_bucket" "app_bucket" {
  bucket = "my-app-${var.environment}"
  
  tags = {
    Name        = "my-app-${var.environment}"
    Environment = var.environment
  }
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

output "bucket_name" {
  value       = aws_s3_bucket.app_bucket.id
  description = "The name of the created S3 bucket"
}
```

## State Management

Terraform stores state in `terraform.tfstate`. For teams, use remote backends:

```hcl
terraform {
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}
```

### State Commands

```bash
terraform state list              # List resources
terraform state show aws_s3_bucket.app_bucket  # Show resource details
terraform state mv aws_s3_bucket.app_bucket aws_s3_bucket.new_name  # Rename
terraform state rm aws_s3_bucket.old_bucket   # Remove from state
```

## Variables and Outputs

### variables.tf

```hcl
variable "instance_type" {
  type    = string
  default = "t3.micro"
}

variable "tags" {
  type = map(string)
  default = {}
}
```

### terraform.tfvars

```hcl
instance_type = "t3.small"
environment   = "production"

tags = {
  Team     = "Platform"
  CostCode = "ABC123"
}
```

## Modules

### Creating a Module

```
modules/
  └── ec2-instance/
      ├── main.tf
      ├── variables.tf
      └── outputs.tf
```

### Using a Module

```hcl
module "web_server" {
  source = "./modules/ec2-instance"
  
  name           = "web-server"
  instance_type  = var.instance_type
  ami_id         = "ami-0c55b159cbfafe1f0"
  security_groups = [aws_security_group.web.id]
}
```

## Common Patterns

### Count and for_each

```hcl
resource "aws_instance" "server" {
  count = 3
  
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  tags = {
    Name = "server-${count.index}"
  }
}

resource "aws_instance" "server" {
  for_each = toset(["web", "api", "db"])
  
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  tags = {
    Name = "server-${each.value}"
  }
}
```

## Import Existing Resources

```bash
terraform import aws_s3_bucket.my_bucket my-bucket-name
```

## Workspaces

```bash
terraform workspace new prod
terraform workspace select prod
terraform workspace list
```
