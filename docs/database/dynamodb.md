# DynamoDB – Manual table creation

This document describes how to create the DynamoDB tables required by the TAMS service **manually**, so you can manage table names, billing, capacity, and IaC yourself instead of relying on automatic creation at startup.

## When to use manual creation

- **Billing and capacity**: Use provisioned capacity (RCU/WCU) or reserved capacity.
- **Compliance and governance**: Tables must be created via approved pipelines (Terraform, CloudFormation, etc.).
- **Existing infrastructure**: Reuse existing tables or naming conventions in your AWS account.

## Behaviour of the service

- At startup, the service checks that each required table **exists** (via `DescribeTable`).
- If a table is missing, the service **creates it** with the schema described below and `BillingMode: PAY_PER_REQUEST`.
- If you create the tables yourself **before** starting the service, the service will use them and **will not** create or alter them.

Table names are configured in the Store spec (or service config) via: `flowTableName`, `flowDeleteRequestsTableName`, `serviceTableName`, `sourceTableName`, `mediaObjectTableName`. You can choose any names as long as they match your configuration.

---

## Required tables

The application expects exactly **five** tables. Each has a **partition key** only (no sort key) and **no global or local secondary indexes**.

| Config key                     | Purpose                             |
| ------------------------------ | ----------------------------------- |
| `flowTableName`                | Flow metadata and listing           |
| `flowDeleteRequestsTableName`  | Flow delete requests                |
| `serviceTableName`             | Service-level settings (single row) |
| `sourceTableName`              | Source metadata and listing         |
| `mediaObjectTableName`         | Media object references and TTL     |

---

## 1. Flows table

Stores flow metadata (one item per flow).

| Property          | Value             |
| ----------------- | ----------------- |
| **Partition key** | `flowId` (String) |
| **Sort key**      | None              |
| **Indexes**       | None              |

**Attributes used as key:**

| Attribute  | Type   | Description                                   |
| ---------- | ------ | --------------------------------------------- |
| `flowId`   | String | Unique flow ID (UUID). Used as partition key. |

The application also stores many optional attributes (e.g. `sourceId`, `label`, `description`, `tags`, `codec`, `container`, `created`, `metadataUpdated`, `segmentsUpdated`, nested maps/lists). You do **not** need to define them in the table schema; DynamoDB is schemaless for non-key attributes.

---

## 2. Flow delete requests table

Stores flow delete requests (one item per request).

| Property          | Value         |
| ----------------- | ------------- |
| **Partition key** | `id` (String) |
| **Sort key**      | None          |
| **Indexes**       | None          |

**Attributes used as key:**

| Attribute | Type   | Description                                  |
| --------- | ------ | -------------------------------------------------- |
| `id`      | String | Flow delete request ID (UUID). Partition key.     |

Other attributes (e.g. `flowId`, `timerangeToDelete`, `status`, `progress`, `created`, `updated`, `expiry`, `error`) are stored as needed; no schema definition required for them.

---

## 3. Service table

Stores service-level configuration. The application uses a **single item** with partition key value `serviceKey = 'service'`.

| Property          | Value                  |
| ----------------- | ---------------------- |
| **Partition key** | `serviceKey` (String)  |
| **Sort key**      | None                   |
| **Indexes**       | None                   |

**Attributes used as key:**

| Attribute    | Type   | Description                                  |
| ------------ | ------ | -------------------------------------------- |
| `serviceKey` | String | Fixed value `'service'` for the single row.  |

Other attributes (e.g. `name`, `description`) are stored in the same item; no need to declare them in the table definition.

---

## 4. Sources table

Stores source metadata (one item per source).

| Property          | Value         |
| ----------------- | ------------- |
| **Partition key** | `id` (String) |
| **Sort key**      | None          |
| **Indexes**       | None          |

**Attributes used as key:**

| Attribute | Type   | Description                                      |
| --------- | ------ | ------------------------------------------------ |
| `id`      | String | Unique source ID (UUID). Used as partition key.  |

Additional attributes (e.g. `label`, `format`, `description`, `tags`, `created`, `updated`) are stored as needed; no schema definition required for them.

---

## 5. Media objects table

Stores media object references. Items can use DynamoDB TTL for expiration.

| Property          | Value               |
| ----------------- | ------------------- |
| **Partition key** | `objectId` (String) |
| **Sort key**      | None                |
| **Indexes**       | None                |

**Attributes used as key:**

| Attribute  | Type   | Description                                  |
| ---------- | ------ | -------------------------------------------- |
| `objectId` | String | Unique object ID. Used as partition key.     |

Other attributes include `flowId`, `storageId`, `expiresAt` (ISO date string). For automatic expiration, enable **TTL** on the table with attribute name `expiresAt` (Unix timestamp in seconds). If you do not enable TTL, the application can still write and read items; expiration will not be enforced by DynamoDB.

---

## Creating tables manually

### Option A: AWS CLI

Use the same key schema and attribute definitions as the service. Replace table names and adjust `BillingMode` or provisioned capacity as needed.

**Flows:**

```bash
aws dynamodb create-table \
  --table-name tams-flows \
  --attribute-definitions AttributeName=flowId,AttributeType=S \
  --key-schema AttributeName=flowId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

**Flow delete requests:**

```bash
aws dynamodb create-table \
  --table-name tams-flow-delete-requests \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

**Service:**

```bash
aws dynamodb create-table \
  --table-name tams-services \
  --attribute-definitions AttributeName=serviceKey,AttributeType=S \
  --key-schema AttributeName=serviceKey,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

**Sources:**

```bash
aws dynamodb create-table \
  --table-name tams-sources \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

**Media objects (with TTL):**

```bash
aws dynamodb create-table \
  --table-name tams-media-objects \
  --attribute-definitions AttributeName=objectId,AttributeType=S \
  --key-schema AttributeName=objectId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# Enable TTL for automatic expiration (optional)
aws dynamodb update-time-to-live \
  --table-name tams-media-objects \
  --time-to-live-specification "Enabled=true, AttributeName=expiresAt"
```

For **provisioned capacity**, replace `--billing-mode PAY_PER_REQUEST` with for example:

`--provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5`

---

### Option B: Terraform (example)

```hcl
resource "aws_dynamodb_table" "flows" {
  name         = "tams-flows"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "flowId"

  attribute {
    name = "flowId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "flow_delete_requests" {
  name         = "tams-flow-delete-requests"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }
}

resource "aws_dynamodb_table" "service" {
  name         = "tams-services"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "serviceKey"

  attribute {
    name = "serviceKey"
    type = "S"
  }
}

resource "aws_dynamodb_table" "sources" {
  name         = "tams-sources"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }
}

resource "aws_dynamodb_table" "media_objects" {
  name         = "tams-media-objects"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "objectId"

  attribute {
    name = "objectId"
    type = "S"
  }

  # Optional: enable TTL when the application writes Unix timestamp (seconds) to expiresAt
  # ttl {
  #   attribute_name = "expiresAt"
  #   enabled        = true
  # }
}
```

(Adjust table names and switch to `read_capacity` / `write_capacity` if you use provisioned billing.)

---

### Option C: CloudFormation (example)

```yaml
Resources:
  FlowsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: tams-flows
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: flowId
          AttributeType: S
      KeySchema:
        - AttributeName: flowId
          KeyType: HASH

  FlowDeleteRequestsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: tams-flow-delete-requests
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH

  ServiceTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: tams-services
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: serviceKey
          AttributeType: S
      KeySchema:
        - AttributeName: serviceKey
          KeyType: HASH

  SourcesTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: tams-sources
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH

  MediaObjectsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: tams-media-objects
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: objectId
          AttributeType: S
      KeySchema:
        - AttributeName: objectId
          KeyType: HASH
```

---

## Engine-specific considerations

### Billing mode

- **PAY_PER_REQUEST (on-demand)**: Default when the service auto-creates tables. No capacity planning; you pay per read/write request.
- **Provisioned**: Set `ReadCapacityUnits` and `WriteCapacityUnits` (or equivalent in IaC). Use when you have predictable traffic or want to control cost with reserved capacity.

Choose the same billing mode when creating tables manually if you want to mirror default behaviour; otherwise set provisioned capacity as required by your organisation.

### Partitioning

- Each table has only a **partition key** (no sort key). Partition key design is already fixed:
  - **flows**: `flowId`
  - **flow delete requests**: `id`
  - **service**: `serviceKey` (single value `'service'`)
  - **sources**: `id`
  - **media objects**: `objectId`
- There are no global or local secondary indexes. Queries that filter by other attributes (e.g. `sourceId`, `label`) are implemented with **Scan** and `FilterExpression`. For very large tables, consider adding GSIs in the future if the application adds support; current code does not require them.

### TTL (media objects)

- The application currently stores `expiresAt` as an **ISO date string** in item attributes. DynamoDB TTL requires the TTL attribute to be a **Unix timestamp in seconds**. So with the current implementation, TTL on the media objects table will not work as expected unless the service is updated to write Unix timestamps. You can still create the table without TTL; the service will read and write items normally. Enable TTL only when the application writes a numeric Unix timestamp to the chosen TTL attribute.

### Region and endpoint

- Create tables in the same **region** (and account) as configured in the Store/service. If you use a custom **endpoint** (e.g. DynamoDB Local), create the tables against that endpoint so the service finds them at startup.

---

## Checklist for running without auto-creation

1. Create all five tables with the **exact** key schema and attribute types described above (partition key name and type must match).
2. Set table names in your Store spec (or service config): `flowTableName`, `flowDeleteRequestsTableName`, `serviceTableName`, `sourceTableName`, `mediaObjectTableName`.
3. Ensure the service has IAM permissions to **describe** and **use** these tables (GetItem, PutItem, Scan, etc.). It does not need `dynamodb:CreateTable` if tables are pre-created.
4. Start the service; it will detect existing tables and skip creation.

For more on configuration, see the main [README](../../README.md) and [Database Configuration](../../README.md#database-configuration).
