# Client caching, key-case, and error conventions

This companion explains three behaviors of `@pureskillgg/awsjs` that are not obvious from the method signatures and that bite consumers in practice.

## 1. Shared-client memoization (the `createCache` footgun)

`lib/cache.js` exposes `createCache`, which each client module calls **once at module scope**. The cache memoizes the underlying AWS SDK v3 client instance keyed on a logical `name` (e.g. `s3`, `sqs`, `dynamodb`). Because the cache lives at module scope, the raw SDK client is shared across **all instances** of that class within a single Node process whenever they share the same `name`.

Consequences:

- **The first constructor wins.** The first time a class is instantiated, its SDK params (region, endpoint, credentials, etc.) build the underlying client. Later instances with the *same* `name` but *different* params silently reuse that first client — their params are ignored.
- The `namespace` argument to `createCache` is currently **unused**; memoization is keyed purely on the second-level `name`.
- This is a connection-reuse optimization (good for Lambda warm starts), but it means you cannot have two `S3Client` instances in one process pointed at, say, two different regions via SDK params. Override the resource *binding* (bucket/table/queue) per call all you like — that is per-instance — but the SDK client config is process-global per `name`.

If you genuinely need a differently-configured SDK client, construct the raw AWS SDK client yourself and pass it in (or use the public escape hatches such as `DynamodbDocumentClient.db`).

## 2. Request lifecycle: PascalCase in, camelCase out

Every method runs the same pipeline (see `lib/case.js`):

1. **Request keys → PascalCase.** `keysToPascalCase` (phi `renameKeysWith` + `change-case`) converts your camelCase params to the PascalCase the AWS SDK expects. So you call `getObject({ key })` and the library sends `{ Key }`.
2. **Resource binding injected.** The constructor binding (`Bucket`, `TableName`, `QueueUrl`, `FunctionName`, `EventBusName`, schedule `GroupName`) is merged in so you never repeat it per call.
3. **Command sent** to the wrapped SDK client.
4. **Response keys → camelCase.** `keysToCamelCase` converts the SDK's PascalCase response back to camelCase for you.

Two return-shape conventions to know:

- `DynamodbDocumentClient.get` and `.query` return a `[data, rest]` tuple — `data` is the item/items, `rest` is the remaining response metadata.
- `S3Client.getObjectJson` returns both the raw body buffer and the parsed `data`.

Key-naming gotcha: S3 stamps the request id as object **Metadata** under the key `req-id`, while SQS attaches it as a **MessageAttribute** under the key `reqId`. Same value, different key — do not conflate them when grepping logs or reading raw records.

### gzip detection

`S3Client` gzips/gunzips transparently when `ContentEncoding` is `gzip`. Detection (`isGzipped`) splits the header on `,`, trims the first token, and checks it equals `gzip` — so `gzip, identity` is correctly treated as gzipped.

## 3. Error-code contract

Each client throws a typed error carrying a stable `code` string, so callers can branch without `instanceof` across module boundaries:

| Error | `code` | Thrown when |
| --- | --- | --- |
| `DynamodbMissingKeyError` | `err_dynamodb_missing_key` | input is missing a configured `hashKey`/`rangeKey` |
| `LambdaStatusCodeError` | `err_lambda_status_code` | invoke `StatusCode` is not 2xx (check is `> 199 && < 300`) |
| `LambdaFunctionError` | `err_lambda_function_error` | the invoked function returned a `FunctionError`; carries the decoded error payload |
| `EventbridgeFailedEntriesError` | `err_eventbridge_failed_entries` | `FailedEntryCount` is nonzero |

Edge case worth noting: the EventBridge check is a strict `if (FailedEntryCount === 0) return`. A missing/`undefined` `FailedEntryCount` would *not* short-circuit and would fall through to throwing — so treat an unexpected response shape as a failure, not a success.

All four errors are also logged via `log.error({ err }, 'fail')` before being re-thrown, so they appear in the consuming service's structured logs scoped by `reqId`.
