# AWS Node.js Toolkit

[![npm](https://img.shields.io/npm/v/@pureskillgg/awsjs.svg)](https://www.npmjs.com/package/@pureskillgg/awsjs)
[![docs](https://img.shields.io/badge/docs-online-informational)](https://dev.pureskill.gg/awsjs/)
[![GitHub Actions](https://github.com/pureskillgg/awsjs/workflows/main/badge.svg)](https://github.com/pureskillgg/awsjs/actions)

Clients and tools for building on AWS.

`@pureskillgg/awsjs` is a shared Node.js library of thin, opinionated wrappers around the [AWS SDK for JavaScript v3]. It gives every PureSkill.gg Node service one uniform, camelCase interface for S3, DynamoDB, SQS, Lambda, EventBridge, and EventBridge Scheduler — with automatic request-id threading, gzip/JSON helpers, and structured [Pino] logging baked in.

## What it does

The package exports six client classes (re-exported through `index.js` → `lib/index.js` → `lib/clients/index.js`). Each class wraps exactly one AWS SDK v3 client and is constructed with a resource binding (a bucket, a `tableName`/`hashKey`/`rangeKey`, a `queueUrl`, a `functionName`, an `eventBusName`, or a scheduler `groupName`) plus an optional `reqId` (defaults to a UUID v4), a Pino child logger, and any SDK params.

Every method follows the same shape:

1. Build a child logger tagged with `client` / `class` / `method` / `reqId` and the resource binding.
2. Log `start`.
3. PascalCase the request keys (`keysToPascalCase`, via [@pureskillgg/phi]'s `renameKeysWith` + `change-case`) and inject the resource binding.
4. Send the AWS command.
5. camelCase the response (`keysToCamelCase`).
6. Log `end` (or `error` / `fail` with the error) and return the normalized data.

The result is a consistent camelCase API, automatic `reqId` propagation, and uniform structured logs across every AWS call in the platform.

Notable per-client behavior:

- **`S3Client`** — `putObjectJson` / `getObjectJson` serialize/deserialize JSON, set `ContentType: application/json`, transparently gzip/gunzip when `ContentEncoding` is `gzip` (detected by `isGzipped`, which splits the header on `,`, trims the first token, and checks it equals `gzip`), and stamp a `req-id` object **Metadata** header. `getObjectJson` returns both the raw body buffer and the parsed data.
- **`DynamodbDocumentClient`** — wraps the DynamoDB Document client (`get` / `put` / `update` / `delete` / `query` / `transactGet` / `transactWrite`) with marshall options (remove undefined, convert class instances to map, no number wrapping). It validates at construction that `hashKey` is a non-empty string and that `rangeKey`, if present, is a non-empty string, and throws `DynamodbMissingKeyError` (`err_dynamodb_missing_key`) when input is missing the configured keys. `get` / `query` return `[data, rest]` tuples. It also exposes the raw `this.db` client and `this.tableName` as public escape hatches.
- **`LambdaClient`** — `invokeJson` `Buffer`-encodes a JSON payload (injecting `reqId`), checks the HTTP `StatusCode` is 2xx (else `LambdaStatusCodeError`, `err_lambda_status_code`) and that there is no `FunctionError` (else `LambdaFunctionError`, `err_lambda_function_error`, carrying the decoded error payload), then decodes the JSON response payload.
- **`SqsClient`** — `sendMessageJson` JSON-stringifies the body and attaches a `reqId` **String** message attribute (note: the attribute key is literally `reqId`, distinct from S3's `req-id` metadata key).
- **`EventbridgeClient`** — `putEvents` stamps `EventBusName` on each entry, JSON-stringifies `detail`, normalizes the `time` field through [@pureskillgg/tau] (`fromIsoUtc` → `toIso`), drops nil fields, and throws `EventbridgeFailedEntriesError` (`err_eventbridge_failed_entries`) if `FailedEntryCount` is nonzero.
- **`SchedulerClient`** — `getSchedule` / `createSchedule` / `updateSchedule` / `deleteSchedule` do CRUD on EventBridge Scheduler schedules with deep PascalCase/camelCase conversion of the nested `Target` object. The schedule-group `groupName` defaults to `default`.

A small `createCache` helper (`lib/cache.js`) memoizes the underlying AWS SDK client instance per logical name so the raw client is reused across class instances within a process. ⚠️ See [Documentation](#documentation) — this caching has a footgun.

## Pipeline role

This is foundational infrastructure code, **not** a pipeline stage. It is published to npm as `@pureskillgg/awsjs` and imported by the platform's Node.js services (lambdas, handlers, web/API backends) wherever they need to talk to AWS — for example it is consumed by `csgo-profile` and other services.

It sits *underneath* the CS2 coaching pipeline: any Node service that reads/writes match, demo, replay/csds, or assessment data in S3/DynamoDB, sends SQS messages, invokes lambdas, emits EventBridge events, or manages EventBridge schedules does so through these clients. The library itself produces no domain data and owns no cloud resources; the consuming service supplies the concrete bucket / table / queue / function identity at construction time.

It consumes only the AWS SDK and sibling PSGG libraries: [@pureskillgg/phi] (FP / key-rename utilities), [@pureskillgg/tau] (ISO time), and [@pureskillgg/mlabs-logger] (logging).

## Exported clients and helpers

This library ships **no deployed AWS infrastructure** — there is no `serverless.yml`, no Terraform, no CDK, and no SAM template. It never hardcodes a table, queue, bucket, or function name; the consuming service passes the resource binding into the constructor. The real exports are:

| Export | Source | Wraps / does |
| --- | --- | --- |
| `S3Client` | `lib/clients/s3.js` | `putObjectJson` / `getObjectJson` — JSON (de)serialization to/from S3 with transparent gzip/gunzip and a `req-id` metadata header. |
| `DynamodbDocumentClient` | `lib/clients/dynamodb-document.js` | `get` / `put` / `update` / `delete` / `query` / `transactGet` / `transactWrite` over the DynamoDB Document client; key validation; `[data, rest]` tuples; throws `DynamodbMissingKeyError`. |
| `LambdaClient` | `lib/clients/lambda.js` | `invokeJson` — `Buffer`-encoded JSON invoke with `reqId` injection; throws `LambdaStatusCodeError` / `LambdaFunctionError` on bad status or function error. |
| `SqsClient` | `lib/clients/sqs.js` | `sendMessageJson` — JSON message body plus a `reqId` String message attribute. |
| `EventbridgeClient` | `lib/clients/eventbridge.js` | `putEvents` — batch event publishing with `detail` JSON-encoding, ISO time normalization, and `FailedEntryCount` checking (`EventbridgeFailedEntriesError`). |
| `SchedulerClient` | `lib/clients/scheduler.js` | `getSchedule` / `createSchedule` / `updateSchedule` / `deleteSchedule` — EventBridge Scheduler CRUD with nested `Target` case conversion. |
| `keysToCamelCase` / `keysToPascalCase` | `lib/case.js` | Request/response key-case normalization used by every client (phi `renameKeysWith` + `change-case`). |
| `createCache` | `lib/cache.js` | Memoizes underlying AWS SDK client instances per logical name to reuse connections. |

### Error codes

All client errors carry a stable `code` string for `instanceof`-free matching:

- `err_dynamodb_missing_key` — `DynamodbMissingKeyError`
- `err_lambda_status_code` — `LambdaStatusCodeError`
- `err_lambda_function_error` — `LambdaFunctionError`
- `err_eventbridge_failed_entries` — `EventbridgeFailedEntriesError`

## Logs and observability

This is a **pure published npm library** — it owns no CloudWatch log groups, DLQs, Step Functions, Sentry projects, or EventBridge buses. There is nothing in this repo to look up in CloudWatch.

- **Where its logs actually appear:** in the **consuming service's** logs. The library logs through [@pureskillgg/mlabs-logger] (Pino), created with `createLogger()` and child-scoped with `{ client, class, method, reqId, queueUrl/bucket/table, messageId }`. So to find a given AWS call, look at the log group of whatever lambda/service imported the client (e.g. `csgo-*-prod-*`), filtered by `reqId`.
- **Normal logs:** `start` and `end` events at `info`; payloads at `debug`.
- **Error logs:** each client method wraps the SDK call in `try`/`catch`, logs `log.error({ err }, 'fail')`, and re-throws. The error then propagates to the caller, where the caller's own infrastructure (Lambda DLQ, Step Functions state, Sentry) is where it ultimately lands.
- **Verbosity:** standard Pino `LOG_LEVEL` / `level` env behavior applies in the consuming process.
- **CI logs for this repo:** build/test output lives in this repo's [GitHub Actions], not in AWS.

## Documentation

- [Client caching, key-case, and error conventions](docs/conventions.md) — the shared-client memoization footgun in `createCache`, the PascalCase-in / camelCase-out request lifecycle, and the per-client error-code contract.

## Installation

Add this as a dependency to your project using [npm] with

```
$ npm install @pureskillgg/awsjs
```

[npm]: https://www.npmjs.com/

## Development and Testing

### Quickstart

```
$ git clone https://github.com/pureskillgg/awsjs.git
$ cd awsjs
$ nvm install
$ npm install
```

Run the command below in a separate terminal window:

```
$ npm run test:watch
```

Primary development tasks are defined under `scripts` in `package.json`
and available via `npm run`.
View them with

```
$ npm run
```

### Source code

The [source code] is hosted on GitHub.
Clone the project with

```
$ git clone git@github.com:pureskillgg/awsjs.git
```

[source code]: https://github.com/pureskillgg/awsjs

### Requirements

You will need [Node.js] with [npm] and a [Node.js debugging] client.

Be sure that all commands run under the correct Node version, e.g.,
if using [nvm], install the correct version with

```
$ nvm install
```

Set the active version for each shell session with

```
$ nvm use
```

Install the development dependencies with

```
$ npm install
```

[Node.js]: https://nodejs.org/
[Node.js debugging]: https://nodejs.org/en/docs/guides/debugging-getting-started/
[npm]: https://www.npmjs.com/
[nvm]: https://github.com/creationix/nvm

### Publishing

Use the [`npm version`][npm-version] command to release a new version.
This will push a new git tag which will trigger a GitHub action.

Publishing may be triggered using on the web
using a [workflow_dispatch on GitHub Actions].

[npm-version]: https://docs.npmjs.com/cli/version
[workflow_dispatch on GitHub Actions]: https://github.com/pureskillgg/awsjs/actions?query=workflow%3Aversion

## GitHub Actions

_GitHub Actions should already be configured: this section is for reference only._

The following repository secrets must be set on [GitHub Actions]:

- `NPM_TOKEN`: npm token for publishing packages.

These must be set manually.

### Secrets for Optional GitHub Actions

The docs, version, and format GitHub actions
require a user with write access to the repository
including access to read and write packages.
Set these additional secrets to enable the action:

- `GH_USER`: The GitHub user's username.
- `GH_TOKEN`: A personal access token for the user.
- `GIT_USER_NAME`: The GitHub user's real name.
- `GIT_USER_EMAIL`: The GitHub user's email.
- `GPG_PRIVATE_KEY`: The GitHub user's [GPG private key].
- `GPG_PASSPHRASE`: The GitHub user's GPG passphrase.

[GitHub Actions]: https://github.com/features/actions
[GPG private key]: https://github.com/marketplace/actions/import-gpg#prerequisites

## Contributing

Please submit and comment on bug reports and feature requests.

To submit a patch:

1. Fork it (https://github.com/pureskillgg/awsjs/fork).
2. Create your feature branch (`git checkout -b my-new-feature`).
3. Make changes.
4. Commit your changes (`git commit -am 'Add some feature'`).
5. Push to the branch (`git push origin my-new-feature`).
6. Create a new Pull Request.

## License

This npm package is licensed under the MIT license.

## Warranty

This software is provided by the copyright holders and contributors "as is" and
any express or implied warranties, including, but not limited to, the implied
warranties of merchantability and fitness for a particular purpose are
disclaimed. In no event shall the copyright holder or contributors be liable for
any direct, indirect, incidental, special, exemplary, or consequential damages
(including, but not limited to, procurement of substitute goods or services;
loss of use, data, or profits; or business interruption) however caused and on
any theory of liability, whether in contract, strict liability, or tort
(including negligence or otherwise) arising in any way out of the use of this
software, even if advised of the possibility of such damage.

[AWS SDK for JavaScript v3]: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/index.html
[Pino]: https://getpino.io/
[@pureskillgg/phi]: https://github.com/pureskillgg/phi
[@pureskillgg/tau]: https://github.com/pureskillgg/tau
[@pureskillgg/mlabs-logger]: https://github.com/pureskillgg/mlabs-logger
[mlabs-logger]: https://github.com/meltwater/mlabs-logger/
