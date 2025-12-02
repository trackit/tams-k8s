# Contributing to TAMS Kubernetes

Thank you for your interest in contributing to TAMS Kubernetes! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

- Be respectful and considerate of others
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## Getting Started

### Prerequisites

- Go 1.25.1 or later (for the Kubernetes controller)
- Node.js and npm (for the service)
- kubectl configured to access a Kubernetes cluster
- Docker (for building container images)

### Setting Up the Development Environment

1. Clone the repository:

```bash
git clone https://github.com/trackit/tams-k8s.git
cd tams-k8s
```

2. For the Kubernetes controller:

```bash
cd k8s-controller
go mod download
```

3. For the service:

```bash
cd service
npm install
```

## Development Workflow

### Making Changes

1. Create a new branch from `master`:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes following the coding standards below

3. Test your changes:

   - For Go code: Run tests with `go test ./...`
   - For TypeScript code: Run tests with `npm test`

4. Commit your changes with clear, descriptive commit messages

5. Push your branch and create a Pull Request

### Coding Standards

#### Go (Kubernetes Controller)

- Follow the [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)
- Use `gofmt` to format your code
- Run `go vet ./...` before committing
- Add unit tests for new functionality
- Update generated code using the provided scripts in `hack/`

#### TypeScript (Service)

- Follow the existing code style
- Use TypeScript strict mode
- Add tests for new routes and functionality
- Run `npm run build` to ensure the code compiles
- Use meaningful variable and function names

### Commit Messages

- Use clear, descriptive commit messages
- Start with a verb in imperative mood following by ": " (e.g., "Add: ", "Fix: ", "Update: ")
- Reference issue numbers when applicable (e.g., "Fix #123: ...")
- Keep the first line under 72 characters
- Add a detailed description if needed

Example:

```
Add: validation for Store CRD

This change adds validation logic to ensure Store resources
have required fields before processing.

Fixes #456
```

## Pull Request Process

1. Ensure your code follows the project's coding standards
2. Update documentation if you've changed functionality
3. Add or update tests as needed
4. Ensure all tests pass
5. Request review from maintainers
6. Address any feedback from reviewers
7. Once approved, a maintainer will merge your PR

### PR Checklist

- [ ] Code follows the project's style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] No new warnings introduced

## Testing

### Kubernetes Controller

Run the test suite:

```bash
cd k8s-controller
go test ./...
```

Run with coverage:

```bash
go test -cover ./...
```

### Service

Run the test suite:

```bash
cd service
npm test
```

Run with UI and coverage:

```bash
npm run test:ui
```

## Building and Deploying

### Building the Controller

```bash
cd k8s-controller
docker build -t tams-controller:latest .
```

### Building the Service

```bash
cd service
npm run build
docker build -t tams-service:latest .
```

## Reporting Issues

When reporting issues, please include:

- Description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (Kubernetes version, Go version, etc.)
- Relevant logs or error messages

## Feature Requests

For feature requests, please:

- Check if the feature has already been requested
- Provide a clear description of the feature
- Explain the use case and benefits
- Consider implementation complexity

## Questions?

If you have questions, feel free to:

- Open an issue for discussion
- Contact the maintainers

Thank you for contributing to TAMS Kubernetes!
