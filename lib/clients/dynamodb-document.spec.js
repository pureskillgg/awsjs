import test from 'ava'
import * as td from 'testdouble'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '@meltwater/mlabs-logger'
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactGetCommand,
  TransactWriteCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb'

import { registerTestdoubleMatchers } from '../../testdouble-matchers.js'

import {
  DynamodbDocumentClient,
  DynamodbMissingKeyError
} from './dynamodb-document.js'

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
      name: uuidv4(),
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
    name: uuidv4(),
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
    name: uuidv4(),
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
        name: uuidv4(),
        createAwsDynamoDBDocumentClient,
        rangeKey: 'foo'
      }),
    { message: /hashKey/ },
    'cannot be nil'
  )
  t.throws(
    () =>
      new DynamodbDocumentClient({
        name: uuidv4(),
        createAwsDynamoDBDocumentClient,
        hashKey: ''
      }),
    { message: /hashKey/ },
    'cannot be empty'
  )
  t.throws(
    () =>
      new DynamodbDocumentClient({
        name: uuidv4(),
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
        name: uuidv4(),
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
        name: uuidv4(),
        createAwsDynamoDBDocumentClient,
        hashKey: 'foo',
        rangeKey: 2
      }),
    { message: /rangeKey/ },
    'must be string'
  )
  t.truthy(
    new DynamodbDocumentClient({
      name: uuidv4(),
      createAwsDynamoDBDocumentClient,
      hashKey: 'foo'
    }),
    'may be nil'
  )
})

test('get: returns response', async (t) => {
  const { AwsDynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const key = { [hashKey]: 'foo', [rangeKey]: 'bar' }

  td.when(
    AwsDynamoDBDocumentClient.prototype.send(
      td.matchers.isAwsSdkCommand(
        new GetCommand({ TableName: tableName, Key: key })
      )
    )
  ).thenResolve(getResponse)

  const data = await client.get(key)

  const { Item, ...rest } = getResponse
  t.deepEqual(data, [Item, rest])
})

test('get: passes params', async (t) => {
  const { AwsDynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const key = { [hashKey]: 'foo', [rangeKey]: 'bar' }

  td.when(
    AwsDynamoDBDocumentClient.prototype.send(
      td.matchers.isAwsSdkCommand(
        new GetCommand({ TableName: tableName, Key: key, Bar: 3 })
      )
    )
  ).thenResolve(getResponse)

  const data = await client.get(key, { bar: 3 })

  const { Item, ...rest } = getResponse
  t.deepEqual(data, [Item, rest])
})

test('get: checks hashKey', async (t) => {
  const { createClient } = t.context
  const client = createClient(t)
  const key = { [rangeKey]: 'bar' }
  const error = await t.throwsAsync(() => client.get(key), {
    instanceOf: DynamodbMissingKeyError
  })
  t.is(error.keyType, 'hashKey')
  t.is(error.keyName, hashKey)
})

test('get: checks rangeKey', async (t) => {
  const { createClient } = t.context
  const client = createClient(t)
  const key = { [hashKey]: 'foo' }
  const error = await t.throwsAsync(() => client.get(key), {
    instanceOf: DynamodbMissingKeyError
  })
  t.is(error.keyType, 'rangeKey')
  t.is(error.keyName, rangeKey)
})

test('get: allows nil rangeKey', async (t) => {
  const { AwsDynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t, { rangeKey: undefined })
  const key = { [hashKey]: 'foo' }

  td.when(
    AwsDynamoDBDocumentClient.prototype.send(
      td.matchers.isAwsSdkCommand(
        new GetCommand({ TableName: tableName, Key: key })
      )
    )
  ).thenResolve(getResponse)

  const data = await client.get(key)

  const { Item, ...rest } = getResponse
  t.deepEqual(data, [Item, rest])
})

test('get: throws error from client', async (t) => {
  const { AwsDynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const key = { [hashKey]: 'foo', [rangeKey]: 'bar' }
  const err = new Error('foo')

  td.when(
    AwsDynamoDBDocumentClient.prototype.send(td.matchers.anything())
  ).thenReject(err)

  await t.throwsAsync(() => client.get(key), { is: err })
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

  const data = await client.put(input, { bar: 3 })

  t.deepEqual(data, putResponseFormatted)
})

test('put: checks hashKey', async (t) => {
  const { createClient } = t.context
  const client = createClient(t)
  const input = { [rangeKey]: 'bar' }
  const error = await t.throwsAsync(() => client.put(input), {
    instanceOf: DynamodbMissingKeyError
  })
  t.is(error.keyType, 'hashKey')
  t.is(error.keyName, hashKey)
})

test('put: checks rangeKey', async (t) => {
  const { createClient } = t.context
  const client = createClient(t)
  const input = { [hashKey]: 'foo' }
  const error = await t.throwsAsync(() => client.put(input), {
    instanceOf: DynamodbMissingKeyError
  })
  t.is(error.keyType, 'rangeKey')
  t.is(error.keyName, rangeKey)
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

test('put: throws error from client', async (t) => {
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

  const data = await client.update(key, { bar: 3 })

  t.deepEqual(data, updateResponseFormatted)
})

test('update: checks hashKey', async (t) => {
  const { createClient } = t.context
  const client = createClient(t)
  const key = { [rangeKey]: 'bar' }
  const error = await t.throwsAsync(() => client.update(key), {
    instanceOf: DynamodbMissingKeyError
  })
  t.is(error.keyType, 'hashKey')
  t.is(error.keyName, hashKey)
})

test('update: checks rangeKey', async (t) => {
  const { createClient } = t.context
  const client = createClient(t)
  const key = { [hashKey]: 'foo' }
  const error = await t.throwsAsync(() => client.update(key), {
    instanceOf: DynamodbMissingKeyError
  })
  t.is(error.keyType, 'rangeKey')
  t.is(error.keyName, rangeKey)
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

test('update: throws error from client', async (t) => {
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

  const data = await client.delete(key, { bar: 3 })

  t.deepEqual(data, deleteResponseFormatted)
})

test('delete: checks hashKey', async (t) => {
  const { createClient } = t.context
  const client = createClient(t)
  const key = { [rangeKey]: 'bar' }
  const error = await t.throwsAsync(() => client.delete(key), {
    instanceOf: DynamodbMissingKeyError
  })
  t.is(error.keyType, 'hashKey')
  t.is(error.keyName, hashKey)
})

test('delete: checks rangeKey', async (t) => {
  const { createClient } = t.context
  const client = createClient(t)
  const key = { [hashKey]: 'foo' }
  const error = await t.throwsAsync(() => client.delete(key), {
    instanceOf: DynamodbMissingKeyError
  })
  t.is(error.keyType, 'rangeKey')
  t.is(error.keyName, rangeKey)
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

test('delete: throws error from client', async (t) => {
  const { AwsDynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const key = { [hashKey]: 'foo', [rangeKey]: 'bar' }
  const err = new Error('foo')

  td.when(
    AwsDynamoDBDocumentClient.prototype.send(td.matchers.anything())
  ).thenReject(err)

  await t.throwsAsync(() => client.delete(key), { is: err })
})

test('query: returns response', async (t) => {
  const { AwsDynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)

  td.when(
    AwsDynamoDBDocumentClient.prototype.send(
      td.matchers.isAwsSdkCommand(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: 'foo = bar'
        })
      )
    )
  ).thenResolve(queryResponse)

  const data = await client.query({ keyConditionExpression: 'foo = bar' })

  t.deepEqual(data, queryResponseFormatted)
})

test('query: throws error from client', async (t) => {
  const { AwsDynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const params = { KeyConditionExpression: 'foo = bar' }
  const err = new Error('foo')

  td.when(
    AwsDynamoDBDocumentClient.prototype.send(td.matchers.anything())
  ).thenReject(err)

  await t.throwsAsync(() => client.query(params), { is: err })
})

test('transactGet: returns response', async (t) => {
  const { AwsDynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const key = { [hashKey]: 'foo', [rangeKey]: 'bar' }
  const TransactItems = [{ Get: { Key: key, TableName: tableName } }]

  td.when(
    AwsDynamoDBDocumentClient.prototype.send(
      td.matchers.isAwsSdkCommand(new TransactGetCommand({ TransactItems }))
    )
  ).thenResolve(transactGetResponse)

  const data = await client.transactGet([{ get: { key } }])

  t.deepEqual(data, transactGetResponseFormatted)
})

test('transactGet: returns response with consumed capacity', async (t) => {
  const { AwsDynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const key = { [hashKey]: 'foo', [rangeKey]: 'bar' }
  const TransactItems = [{ Get: { Key: key, TableName: tableName } }]

  td.when(
    AwsDynamoDBDocumentClient.prototype.send(
      td.matchers.isAwsSdkCommand(
        new TransactGetCommand({
          TransactItems,
          ReturnConsumedCapacity: 'TOTAL'
        })
      )
    )
  ).thenResolve(transactGetResponseWithConsumedCapacity)

  const data = await client.transactGet([{ get: { key } }], {
    returnConsumedCapacity: 'TOTAL'
  })

  t.deepEqual(data, transactGetResponseWithConsumedCapacityFormatted)
})

test('transactGet: throws error from client', async (t) => {
  const { AwsDynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const key = { [hashKey]: 'foo', [rangeKey]: 'bar' }
  const transactItems = [{ Get: { Key: key } }]
  const err = new Error('foo')

  td.when(
    AwsDynamoDBDocumentClient.prototype.send(td.matchers.anything())
  ).thenReject(err)

  await t.throwsAsync(() => client.transactGet(transactItems), { is: err })
})

test('transactWrite: returns response', async (t) => {
  const { AwsDynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const key = { [hashKey]: 'foo', [rangeKey]: 'bar' }
  const TransactItems = [{ Delete: { Key: key, TableName: tableName } }]

  td.when(
    AwsDynamoDBDocumentClient.prototype.send(
      td.matchers.isAwsSdkCommand(new TransactWriteCommand({ TransactItems }))
    )
  ).thenResolve(transactWriteResponse)

  const data = await client.transactWrite([{ delete: { key } }])

  t.deepEqual(data, transactWriteResponseFormatted)
})

test('transactWrite: returns response with consumed capacity and item collection metrics', async (t) => {
  const { AwsDynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const key = { [hashKey]: 'foo', [rangeKey]: 'bar' }
  const TransactItems = [{ Delete: { Key: key, TableName: tableName } }]

  td.when(
    AwsDynamoDBDocumentClient.prototype.send(
      td.matchers.isAwsSdkCommand(new TransactWriteCommand({ TransactItems }))
    )
  ).thenResolve(transactWriteResponseWithMetrics)

  const data = await client.transactWrite([{ delete: { key } }])

  t.deepEqual(data, transactWriteResponseWithMetricsFormatted)
})

test('transactWrite: throws error from client', async (t) => {
  const { AwsDynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const key = { [hashKey]: 'foo', [rangeKey]: 'bar' }
  const transactItems = [{ delete: { key } }]
  const err = new Error('foo')

  td.when(
    AwsDynamoDBDocumentClient.prototype.send(td.matchers.anything())
  ).thenReject(err)

  await t.throwsAsync(() => client.transactWrite(transactItems), { is: err })
})

test('DynamodbMissingKeyError', (t) => {
  const err = new DynamodbMissingKeyError('foo', 'bar')
  t.like(err, {
    name: 'DynamodbMissingKeyError',
    code: 'err_dynamodb_missing_key',
    keyType: 'foo',
    keyName: 'bar'
  })
})

const tableName = 'mock-table-name'
const hashKey = 'mock-hash-key'
const rangeKey = 'mock-range-key'
const reqId = 'mock-req-id'

const getResponse = { Item: { foo: 'bar' } }

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

const queryResponse = {
  Items: [{ foo: 'bar' }],
  LastEvaluatedKey: 'mock-last-evaluated-key'
}

const queryResponseFormatted = [
  [{ foo: 'bar' }],
  { lastEvaluatedKey: 'mock-last-evaluated-key' }
]

const transactGetResponse = {
  Responses: [getResponse]
}

const transactGetResponseFormatted = [
  [getResponse.Item],
  [{ consumedCapacity: undefined }]
]

const transactGetResponseWithConsumedCapacity = {
  Responses: [getResponse],
  ConsumedCapacity: [{ CapacityUnits: 10 }]
}

const transactGetResponseWithConsumedCapacityFormatted = [
  [getResponse.Item],
  [{ consumedCapacity: { CapacityUnits: 10 } }]
]

const transactWriteResponse = {}

const transactWriteResponseFormatted = [
  [{ consumedCapacity: undefined }],
  { itemCollectionMetrics: {} }
]

const transactWriteResponseWithMetrics = {
  ConsumedCapacity: [{ CapacityUnits: 10 }],
  ItemCollectionMetrics: { [tableName]: [{ ItemCollectionKey: {} }] }
}

const transactWriteResponseWithMetricsFormatted = [
  [{ consumedCapacity: { CapacityUnits: 10 } }],
  { itemCollectionMetrics: { [tableName]: [{ ItemCollectionKey: {} }] } }
]
