# TAMS on Kubernetes

This repository provides a Kubernetes deployment of TAMS (Time Addressable Media Store), a system for managing time-addressable media storage.

## Overview

TAMS Kubernetes consists of two main components:

- **Kubernetes Controller**: A custom Kubernetes controller written in Go that manages `Store` custom resources and automatically deploys TAMS service instances
- **TAMS Service**: A TypeScript/Node.js service that provides REST APIs

## Features

- Custom Resource Definition (CRD) for declarative Store management
- Automatic deployment and scaling of TAMS service instances
- Support for multiple storage backends (S3)
- Database support (DynamoDB, in-memory)
- RESTful API for media management
- Kubernetes-native integration

## Prerequisites

- Kubernetes cluster (v1.20+)
- `kubectl` configured to access your cluster
- AWS credentials (if using DynamoDB and S3 backends)

## Quick Start

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
    flowTableName: 'tams-flows'
    serviceTableName: 'tams-services'
    mediaObjectTableName: 'tams-media-objects'
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

## Architecture

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

## Store Resource Specification

The `Store` custom resource defines a TAMS instance configuration:

### Database Configuration

- **type**: Database type (`dynamodb` or `memory`)
- **region**: AWS region (required for DynamoDB)
- **flowTableName**: DynamoDB table name for flows
- **serviceTableName**: DynamoDB table name for services
- **mediaObjectTableName**: DynamoDB table name for media objects
- **endpoint**: Optional custom endpoint URL

### Backend Configuration

- **id**: Unique backend identifier (UUID)
- **type**: Backend type (`s3`)
- **default**: Whether this is the default backend
- **bucketName**: S3 bucket name
- **region**: AWS region

### Service Configuration

- **replicas**: Number of service replicas (default: 1)
- **secretName**: Kubernetes secret name containing AWS credentials
- **serviceAccountName**: Optional service account name
- **logs.level**: Log level (`debug`, `info`, `warn`, `error`)
- **server.port**: Service port (default: 3000)

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

### Prerequisites

- Go 1.25.1+ (for controller development)
- Node.js and npm (for service development)
- Docker (for building images)
- kubectl and access to a Kubernetes cluster

### Building the Controller

```bash
cd k8s-controller
go mod download
go build -o bin/controller main.go
```

### Building the Service

```bash
cd service
npm install
npm run build
```

### Running Tests

Controller tests:

```bash
cd k8s-controller
go test ./...
```

Service tests:

```bash
cd service
npm test
```

### Local Development

For local controller development, you can run the controller outside the cluster:

```bash
cd k8s-controller
go run main.go
```

For local service development:

```bash
cd service
npm run dev
```

## Project Structure

```
tams-k8s/
├── k8s-controller/          # Kubernetes controller (Go)
│   ├── pkg/
│   │   ├── apis/            # CRD API definitions
│   │   └── controller/      # Controller logic
│   ├── artifacts/           # Deployment manifests
│   └── hack/               # Code generation scripts
├── service/                 # TAMS service (TypeScript)
│   ├── src/
│   │   ├── api/            # REST API routes
│   │   ├── backend/        # Storage backend implementations
│   │   └── repository/     # Data access layer
│   └── config/             # Configuration files
└── example/                # Example configurations
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- Code of conduct
- Development workflow
- Coding standards
- Pull request process
- Testing requirements

## License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.

## Support

For issues, questions, or feature requests, please open an issue on the GitHub repository.

## Additional Resources

- Example Store configuration: `k8s-controller/artifacts/tams/example.yaml`
- Quick deploy manifest: `k8s-controller/artifacts/tams/quick-deploy.yaml`