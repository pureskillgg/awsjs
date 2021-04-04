import test from 'ava'
import * as td from 'testdouble'
import { createLogger } from '@meltwater/mlabs-logger'
import { DeleteCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

import { registerTestdoubleMatchers } from '../../testdouble-matchers.js'
import { DynamodbDocumentClient } from './dynamodb-document.js'

test.before(() => {
  registerTestdoubleMatchers(td)
})

test.beforeEach((t) => {
  t.context.AwsDynamoDBClient = td.constructor()
  t.context.AwsDynamoDBDocumentClient = td.constructor(['send'])

  t.context.createAwsDynamoDBDocumentClient = () =>
    new t.context.AwsDynamoDBDocumentClient()

  t.context.createClient = (t, options) => {
    const client = new DynamodbDocumentClient({
      AwsDynamoDBClient: t.context.AwsDynamoDBClient,
      createAwsDynamoDBDocumentClient:
        t.context.createAwsDynamoDBDocumentClient,
      tableName,
      hashKey,
      rangeKey,
      reqId,
      log: createLogger({ t }),
      ...options
    })

    return client
  }
})

test('constructor: passes params to AWS DynamoDBClient', (t) => {
  const { AwsDynamoDBClient, createAwsDynamoDBDocumentClient } = t.context
  const params = { foo: 'bar' }
  const client = new DynamodbDocumentClient({
    AwsDynamoDBClient,
    createAwsDynamoDBDocumentClient,
    tableName,
    hashKey,
    rangeKey,
    params,
    log: createLogger({ t })
  })
  td.verify(new AwsDynamoDBClient(params))
  t.truthy(client)
})

test('constructor: calls createAwsDynamoDBDocumentClient', (t) => {
  const { AwsDynamoDBClient } = t.context
  const createAwsDynamoDBDocumentClient = td.func()

  const translateConfig = { marshallOptions: { fooOption: true } }
  const client = new DynamodbDocumentClient({
    AwsDynamoDBClient,
    createAwsDynamoDBDocumentClient,
    translateConfig,
    tableName,
    hashKey,
    rangeKey,
    log: createLogger({ t })
  })
  td.verify(
    createAwsDynamoDBDocumentClient(
      td.matchers.isA(AwsDynamoDBClient),
      translateConfig
    )
  )
  t.truthy(client)
})

test('constructor: validates hashKey', (t) => {
  const { createAwsDynamoDBDocumentClient } = t.context
  t.throws(
    () =>
      new DynamodbDocumentClient({
        createAwsDynamoDBDocumentClient,
        rangeKey: 'foo'
      }),
    { message: /hashKey/ },
    'cannot be nil'
  )
  t.throws(
    () =>
      new DynamodbDocumentClient({
        createAwsDynamoDBDocumentClient,
        hashKey: ''
      }),
    { message: /hashKey/ },
    'cannot be empty'
  )
  t.throws(
    () =>
      new DynamodbDocumentClient({
        createAwsDynamoDBDocumentClient,
        hashKey: 2
      }),
    { message: /hashKey/ },
    'must be string'
  )
})

test('constructor: validates rangeKey', (t) => {
  const { createAwsDynamoDBDocumentClient } = t.context
  t.throws(
    () =>
      new DynamodbDocumentClient({
        createAwsDynamoDBDocumentClient,
        hashKey: 'foo',
        rangeKey: ''
      }),
    { message: /rangeKey/ },
    'cannot be empty'
  )
  t.throws(
    () =>
      new DynamodbDocumentClient({
        createAwsDynamoDBDocumentClient,
        hashKey: 'foo',
        rangeKey: 2
      }),
    { message: /rangeKey/ },
    'must be string'
  )
  t.truthy(
    new DynamodbDocumentClient({
      createAwsDynamoDBDocumentClient,
      hashKey: 'foo'
    }),
    'may be nil'
  )
})

test('put: returns response', async (t) => {
  const { AwsDynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const input = { [hashKey]: 'foo', [rangeKey]: 'bar' }

  td.when(
    AwsDynamoDBDocumentClient.prototype.send(
      td.matchers.isAwsSdkCommand(
        new PutCommand({ TableName: tableName, Item: input })
      )
    )
  ).thenResolve(putResponse)

  const data = await client.put(input)

  t.deepEqual(data, putResponseFormatted)
})

test('put: passes params', async (t) => {
  const { AwsDynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const input = { [hashKey]: 'foo', [rangeKey]: 'bar' }

  td.when(
    AwsDynamoDBDocumentClient.prototype.send(
      td.matchers.isAwsSdkCommand(
        new PutCommand({ TableName: tableName, Item: input, Bar: 3 })
      )
    )
  ).thenResolve(putResponse)

  const data = await client.put(input, { Bar: 3 })

  t.deepEqual(data, putResponseFormatted)
})

test('put: checks hashKey', async (t) => {
  const { createClient } = t.context
  const client = createClient(t)
  const input = { [rangeKey]: 'bar' }
  await t.throwsAsync(() => client.put(input), { message: /hashKey/ })
})

test('put: checks rangeKey', async (t) => {
  const { createClient } = t.context
  const client = createClient(t)
  const input = { [hashKey]: 'foo' }
  await t.throwsAsync(() => client.put(input), { message: /rangeKey/ })
})

test('put: allows nil rangeKey', async (t) => {
  const { AwsDynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t, { rangeKey: undefined })
  const input = { [hashKey]: 'foo' }

  td.when(
    AwsDynamoDBDocumentClient.prototype.send(
      td.matchers.isAwsSdkCommand(
        new PutCommand({ TableName: tableName, Item: input })
      )
    )
  ).thenResolve(putResponse)

  const data = await client.put(input)

  t.deepEqual(data, putResponseFormatted)
})

test('put: throws client error', async (t) => {
  const { AwsDynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const input = { [hashKey]: 'foo', [rangeKey]: 'bar' }
  const err = new Error('foo')

  td.when(
    AwsDynamoDBDocumentClient.prototype.send(td.matchers.anything())
  ).thenReject(err)

  await t.throwsAsync(() => client.put(input), { is: err })
})

test('update: returns response', async (t) => {
  const { AwsDynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const key = { [hashKey]: 'foo', [rangeKey]: 'bar' }

  td.when(
    AwsDynamoDBDocumentClient.prototype.send(
      td.matchers.isAwsSdkCommand(
        new UpdateCommand({ TableName: tableName, Key: key })
      )
    )
  ).thenResolve(updateResponse)

  const data = await client.update(key)

  t.deepEqual(data, updateResponseFormatted)
})

test('update: passes params', async (t) => {
  const { AwsDynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const key = { [hashKey]: 'foo', [rangeKey]: 'bar' }

  td.when(
    AwsDynamoDBDocumentClient.prototype.send(
      td.matchers.isAwsSdkCommand(
        new UpdateCommand({ TableName: tableName, Key: key, Bar: 3 })
      )
    )
  ).thenResolve(updateResponse)

  const data = await client.update(key, { Bar: 3 })

  t.deepEqual(data, updateResponseFormatted)
})

test('update: checks hashKey', async (t) => {
  const { createClient } = t.context
  const client = createClient(t)
  const key = { [rangeKey]: 'bar' }
  await t.throwsAsync(() => client.update(key), { message: /hashKey/ })
})

test('update: checks rangeKey', async (t) => {
  const { createClient } = t.context
  const client = createClient(t)
  const key = { [hashKey]: 'foo' }
  await t.throwsAsync(() => client.update(key), { message: /rangeKey/ })
})

test('update: allows nil rangeKey', async (t) => {
  const { AwsDynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t, { rangeKey: undefined })
  const key = { [hashKey]: 'foo' }

  td.when(
    AwsDynamoDBDocumentClient.prototype.send(
      td.matchers.isAwsSdkCommand(
        new UpdateCommand({ TableName: tableName, Key: key })
      )
    )
  ).thenResolve(updateResponse)

  const data = await client.update(key)

  t.deepEqual(data, updateResponseFormatted)
})

test('update: throws client error', async (t) => {
  const { AwsDynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const key = { [hashKey]: 'foo', [rangeKey]: 'bar' }
  const err = new Error('foo')

  td.when(
    AwsDynamoDBDocumentClient.prototype.send(td.matchers.anything())
  ).thenReject(err)

  await t.throwsAsync(() => client.update(key), { is: err })
})

test('delete: returns response', async (t) => {
  const { AwsDynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const key = { [hashKey]: 'foo', [rangeKey]: 'bar' }

  td.when(
    AwsDynamoDBDocumentClient.prototype.send(
      td.matchers.isAwsSdkCommand(
        new DeleteCommand({ TableName: tableName, Key: key })
      )
    )
  ).thenResolve(deleteResponse)

  const data = await client.delete(key)

  t.deepEqual(data, deleteResponseFormatted)
})

test('delete: passes params', async (t) => {
  const { AwsDynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const key = { [hashKey]: 'foo', [rangeKey]: 'bar' }

  td.when(
    AwsDynamoDBDocumentClient.prototype.send(
      td.matchers.isAwsSdkCommand(
        new DeleteCommand({ TableName: tableName, Key: key, Bar: 3 })
      )
    )
  ).thenResolve(deleteResponse)

  const data = await client.delete(key, { Bar: 3 })

  t.deepEqual(data, deleteResponseFormatted)
})

test('delete: checks hashKey', async (t) => {
  const { createClient } = t.context
  const client = createClient(t)
  const key = { [rangeKey]: 'bar' }
  await t.throwsAsync(() => client.delete(key), { message: /hashKey/ })
})

test('delete: checks rangeKey', async (t) => {
  const { createClient } = t.context
  const client = createClient(t)
  const key = { [hashKey]: 'foo' }
  await t.throwsAsync(() => client.delete(key), { message: /rangeKey/ })
})

test('delete: allows nil rangeKey', async (t) => {
  const { AwsDynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t, { rangeKey: undefined })
  const key = { [hashKey]: 'foo' }

  td.when(
    AwsDynamoDBDocumentClient.prototype.send(
      td.matchers.isAwsSdkCommand(
        new DeleteCommand({ TableName: tableName, Key: key })
      )
    )
  ).thenResolve(deleteResponse)

  const data = await client.delete(key)

  t.deepEqual(data, deleteResponseFormatted)
})

test('delete: throws client error', async (t) => {
  const { AwsDynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const key = { [hashKey]: 'foo', [rangeKey]: 'bar' }
  const err = new Error('foo')

  td.when(
    AwsDynamoDBDocumentClient.prototype.send(td.matchers.anything())
  ).thenReject(err)

  await t.throwsAsync(() => client.delete(key), { is: err })
})

const tableName = 'some-table-name'
const hashKey = 'some-hash-key'
const rangeKey = 'some-range-key'
const reqId = 'some-req-id'

const putResponse = {
  Attributes: { a: 1 },
  ConsumedCapacity: { TableName: 'bar' },
  ItemCollectionMetrics: { ItemCollectionKey: 'baz' }
}

const putResponseFormatted = {
  attributes: { a: 1 },
  consumedCapacity: { TableName: 'bar' },
  itemCollectionMetrics: { ItemCollectionKey: 'baz' }
}

const updateResponse = putResponse
const updateResponseFormatted = putResponseFormatted

const deleteResponse = putResponse
const deleteResponseFormatted = putResponseFormatted
