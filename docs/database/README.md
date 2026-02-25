# Database setup

The TAMS service supports multiple database engines for storing flows, sources, service configuration, and media object references.

## Automatic vs manual table creation

- **Automatic (default)**: At startup, the service checks that the required tables exist. If a table is missing, it creates it with a default schema and on-demand billing. This is convenient for development and simple deployments.
- **Manual**: You create the tables yourself (e.g. via Terraform, CloudFormation, or AWS CLI) so you can control names, billing mode, capacity, and compliance. The service then uses your tables and does not create or alter them.

To use manual creation, create the tables **before** starting the service and configure the same table names in the [Store resource](../../README.md#database-configuration). See the per-engine documentation below for exact schemas and examples.

## Per-engine documentation

| Engine    | Documentation | Description |
| ---------| -------------- | ----------- |
| **DynamoDB** | [dynamodb.md](./dynamodb.md) | Table names, key schema, indexes, and instructions to create tables manually (AWS CLI, Terraform, CloudFormation). |

## Configuration

Table names and connection settings are configured in the Store spec under `spec.database` (see [Database Configuration](../../README.md#database-configuration) in the main README).
