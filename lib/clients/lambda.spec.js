import test from 'ava'
import * as td from 'testdouble'
import { createLogger } from '@meltwater/mlabs-logger'
import { InvokeCommand } from '@aws-sdk/client-lambda'

import { registerTestdoubleMatchers } from '../../testdouble-matchers.js'
import { LambdaClient } from './lambda.js'

test.before(() => {
  registerTestdoubleMatchers(td)
})

test.beforeEach((t) => {
  t.context.AwsLambdaClient = td.constructor(['send'])

  t.context.createClient = (t) => {
    const client = new LambdaClient({
      AwsLambdaClient: t.context.AwsLambdaClient,
      functionName,
      reqId,
      log: createLogger({ t })
    })

    return client
  }
})

test('constructor: passes params to AWS LambdaClient', (t) => {
  const { AwsLambdaClient } = t.context
  const functionName = 'some-function-name'
  const params = { foo: 'bar' }
  const client = new LambdaClient({
    AwsLambdaClient,
    functionName,
    params,
    log: createLogger({ t })
  })
  td.verify(new AwsLambdaClient(params))
  t.truthy(client)
})

test('invokeJson: returns parsed payload', async (t) => {
  const { AwsLambdaClient, createClient } = t.context
  const client = createClient(t)
  const payload = { success: true }
  const input = { foo: 2 }

  const Payload = Buffer.from(JSON.stringify({ ...input, reqId }))
  td.when(
    AwsLambdaClient.prototype.send(
      td.matchers.isAwsSdkCommand(
        new InvokeCommand({ Payload, FunctionName: functionName })
      )
    )
  ).thenResolve({
    Payload: Buffer.from(JSON.stringify(payload)),
    StatusCode: 200
  })

  const data = await client.invokeJson(input)

  t.deepEqual(data, payload)
})

test('invokeJson: passes params', async (t) => {
  const { AwsLambdaClient, createClient } = t.context
  const client = createClient(t)
  const payload = { success: true }
  const input = { foo: 2 }

  const Payload = Buffer.from(JSON.stringify({ ...input, reqId }))
  td.when(
    AwsLambdaClient.prototype.send(
      td.matchers.isAwsSdkCommand(
        new InvokeCommand({ Payload, Bar: 3, FunctionName: functionName })
      )
    )
  ).thenResolve({
    Payload: Buffer.from(JSON.stringify(payload)),
    StatusCode: 200
  })

  const data = await client.invokeJson(input, { Bar: 3 })

  t.deepEqual(data, payload)
})

test('invokeJson: throws low status code error', async (t) => {
  const { AwsLambdaClient, createClient } = t.context
  const client = createClient(t)
  const statusCode = 199

  td.when(AwsLambdaClient.prototype.send(td.matchers.anything())).thenResolve({
    StatusCode: statusCode
  })

  const error = await t.throwsAsync(() => client.invokeJson({}), {
    message: /status code/i
  })

  t.like(error, { code: 'err_lambda_status_code', statusCode })
})

test('invokeJson: throws high status code error', async (t) => {
  const { AwsLambdaClient, createClient } = t.context
  const client = createClient(t)
  const statusCode = 300

  td.when(AwsLambdaClient.prototype.send(td.matchers.anything())).thenResolve({
    StatusCode: statusCode
  })

  const error = await t.throwsAsync(() => client.invokeJson({}), {
    message: /status code/i
  })

  t.like(error, { code: 'err_lambda_status_code', statusCode })
})

test('invokeJson: throws high function error', async (t) => {
  const { AwsLambdaClient, createClient } = t.context
  const client = createClient(t)

  td.when(AwsLambdaClient.prototype.send(td.matchers.anything())).thenResolve({
    StatusCode: 200,
    FunctionError: 'Unhandled',
    Payload: Buffer.from(JSON.stringify(errorPayload))
  })

  const error = await t.throwsAsync(() => client.invokeJson({}), {
    message: /ReferenceError/i
  })

  t.like(error, { code: 'err_lambda_function', data: errorPayload })
})

test('invokeJson: throws client error', async (t) => {
  const { AwsLambdaClient, createClient } = t.context
  const client = createClient(t)
  const err = new Error('foo')

  td.when(AwsLambdaClient.prototype.send(td.matchers.anything())).thenReject(
    err
  )

  await t.throwsAsync(() => client.invokeJson({}), { is: err })
})

const functionName = 'some-function-name'
const reqId = 'some-req-id'

const errorPayload = {
  errorType: 'ReferenceError',
  errorMessage: 'x is not defined',
  trace: [
    'ReferenceError: x is not defined',
    '    at Runtime.exports.handler (/var/task/index.js:2:3)',
    '    at Runtime.handleOnce (/var/runtime/Runtime.js:63:25)',
    '    at process._tickCallback (internal/process/next_tick.js:68:7)'
  ]
}
