<h1 align="center">TAMS on Kubernetes</h1>

<p align="center">
  <b>TAMS on Kubernetes</b> is a containerized deployment solution that simplifies the deployment and management of the Time Addressable Media Store (TAMS) on Kubernetes infrastructure.
</p>

<p align="center">
  <b>Learn more about TAMS in this <a href="https://medium.com/trackit/tams-on-kubernetes-architecting-cloud-agnostic-time-addressable-media-storage-13355f3371ab">blog post</a></b>
</p>

## Table of contents

- [Overview](#overview)
  - [Architecture](#architecture)
  - [Project Structure](#project-structure)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Deploy the Controller](#deploy-the-controller)
  - [Create a Store](#create-a-store)
- [Store Resource Specification](#store-resource-specification)
  - [Database Configuration](#database-configuration)
  - [Backend Configuration](#backend-configuration)
  - [Service Configuration](#service-configuration)
- [API Usage](#api-usage)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Overview

TAMS on Kubernetes is designed for teams who need a scalable, declarative, and Kubernetes-native way to deploy and operate TAMS instances.
It abstracts infrastructure complexity by exposing a simple Custom Resource, while remaining flexible enough for production workloads.

**TAMS on Kubernetes** consists of two main components:

- **Kubernetes Controller**: A custom Kubernetes controller written in Go that manages `Store` custom resources and automatically deploys TAMS service instances
- **TAMS Service**: A TypeScript/Node.js service that provides REST APIs

### Architecture

<!-- Update with a reel diagram -->

```
┌─────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                   │
│                                                         │
│  ┌──────────────────┐      ┌──────────────────────┐     │
│  │ TAMS Controller  │──────│  Store CRD           │     │
│  │  (Go)            │      │  (Custom Resource)   │     │
│  └──────────────────┘      └──────────────────────┘     │
│           │                                             │
│           │ Creates/Manages                             │
│           ▼                                             │
│  ┌──────────────────┐                                   │
│  │ TAMS Service     │                                   │
│  │  (TypeScript)    │                                   │
│  │  - REST API       │                                  │
│  │  - Flow Management│                                  │
│  │  - Source Mgmt    │                                  │
│  └──────────────────┘                                   │
│           │                                             │
│           │ Connects to                                 │
│           ▼                                             │
│  ┌──────────────┐    ┌──────────────┐                   │
│  │  DynamoDB    │    │  S3 Backend  │                   │
│  └──────────────┘    └──────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

### Project Structure

```
tams-k8s/
├── k8s-controller/         # Kubernetes controller (Go)
│   ├── pkg/
│   │   ├── apis/           # CRD API definitions
│   │   └── controller/     # Controller logic
│   ├── artifacts/          # Deployment manifests
│   └── hack/               # Code generation scripts
├── service/                # TAMS service (TypeScript)
│   ├── src/
│   │   ├── api/            # REST API routes
│   │   ├── backend/        # Storage backend implementations
│   │   └── repository/     # Data access layer
│   └── config/             # Configuration files
└── example/                # Example configurations
```

## Getting started

### Prerequisites

- Kubernetes cluster (v1.20+)
- `kubectl` configured to access your cluster
- AWS credentials (if using DynamoDB and S3 backends)

### Quick start

Deploy the controller, create a Store, and access the API in a few minutes.

```bash
kubectl apply -f https://raw.githubusercontent.com/trackit/tams-k8s/refs/heads/master/k8s-controller/artifacts/tams/quick-deploy.yaml
kubectl apply -f example/store.yaml
kubectl port-forward svc/my-store 3000:3000
```

### Deploy the Controller

Deploy the TAMS controller and CRD using the quick-deploy manifest:

```bash
kubectl apply -f https://raw.githubusercontent.com/trackit/tams-k8s/refs/heads/master/k8s-controller/artifacts/tams/quick-deploy.yaml
```

Verify the controller is running:

```bash
kubectl get pods -n tams-system
```

### Create a Store

Create a Kubernetes secret with your AWS credentials:

```bash
kubectl create secret generic tams-aws-secret \
  --from-literal=AWS_ACCESS_KEY_ID=your-access-key \
  --from-literal=AWS_SECRET_ACCESS_KEY=your-secret-key
```

Create a Store resource:

```yaml
apiVersion: tams.trackit.io/v1alpha1
kind: Store
metadata:
  name: my-store
spec:
  database:
    type: dynamodb
    region: us-west-2
    flowTableName: "tams-flows"
    serviceTableName: "tams-services"
    mediaObjectTableName: "tams-media-objects"
  backends:
    - id: 4a6c17c4-977a-4e69-b5e1-c12cde6f9253
      type: s3
      default: true
      bucketName: my-tams-bucket
      region: us-west-2
  replicas: 1
  secretName: tams-aws-secret
  logs:
    level: info
```

Apply the Store:

```bash
kubectl apply -f store.yaml
```

Check the Store status:

```bash
kubectl get stores
kubectl describe store my-store
```

## Store Resource Specification

The `Store` custom resource describes the desired configuration of a TAMS instance.

### Database Configuration

| Field                      | Required       | Type   | Description                             |
| -------------------------- | -------------- | ------ | --------------------------------------- |
| type                       | yes            | string | `dynamodb` or `memory`                  |
| region                     | yes (dynamodb) | string | AWS region                              |
| flowTableName              | yes            | string | DynamoDB table for flows                |
| flowDeleteRequestTableName | yes            | string | DynamoDB table for flows delete request |
| sourceTableName            | yes            | string | DynamoDB table for sources              |
| serviceTableName           | yes            | string | DynamoDB table for services             |
| mediaObjectTableName       | yes            | string | DynamoDB table for media objects        |
| endpoint                   | no             | string | Custom database endpoint                |

**Manual table creation:** If you prefer to manage tables yourself, see [Database setup](docs/database/README.md). The guide [DynamoDB – Manual table creation](docs/database/dynamodb.md) describes the required table names, key schema, indexes, and how to create tables via AWS CLI, Terraform, or CloudFormation so the service can run without auto-creation.

### Backend Configuration

| Field      | Required | Type          | Description               |
| ---------- | -------- | ------------- | ------------------------- |
| id         | yes      | string (UUID) | Backend unique identifier |
| type       | yes      | string        | `s3`                      |
| default    | no       | boolean       | Marks the default backend |
| bucketName | yes      | string        | S3 bucket name            |
| region     | yes      | string        | AWS region                |

### Service Configuration

| Field              | Required | Type   | Description                        |
| ------------------ | -------- | ------ | ---------------------------------- |
| replicas           | no       | number | Number of replicas (default: 1)    |
| secretName         | yes      | string | Kubernetes secret with credentials |
| serviceAccountName | no       | string | Service account name               |
| logs.level         | no       | string | `debug`, `info`, `warn`, `error`   |
| server.port        | no       | number | API port (default: 3000)           |

## API Usage

Once a Store is deployed, the TAMS service exposes a REST API. Access the service:

```bash
# Port-forward to access the service locally
kubectl port-forward svc/my-store 3000:3000
```

### Example API Calls

```bash
# Create a flow
curl -X POST http://localhost:3000/flows \
  -H "Content-Type: application/json" \
  -d '{
    "label": "my-flow",
    "description": "Example flow"
  }'

# List flows
curl http://localhost:3000/flows

# Get a specific flow
curl http://localhost:3000/flows/{flowId}
```

## Development

This section is intended for contributors working on the controller or the service.

### Requirements

- Go 1.25.1+
- Node.js and npm
- Docker
- kubectl

### Controller

```bash
cd k8s-controller
go mod download
go test ./...
```

### Service

```bash
cd service
npm install
npm run test
```

# Contributing

Contributions of any kind are welcome to help improve this project.

- Bug reports and fixes
- Documentation improvements
- Feature proposals

Please read our [contributing guidelines](./CONTRIBUTING.md) before submitting a pull request or issue.

# License

Copyright 2025 TrackIt

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at [LICENSE](./LICENSE)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

# Contact

For questions, suggestions, or support, please open an issue on GitHub or contact us via the blog.
