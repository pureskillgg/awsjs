import test from 'ava'
import * as td from 'testdouble'
import { createLogger } from '@meltwater/mlabs-logger'

import { DynamodbDocumentClient } from './dynamodb-document.js'

test.beforeEach((t) => {
  t.context.DynamoDBDocumentClient = td.constructor(['put', 'update'])

  t.context.createClient = (t, options) => {
    const client = new DynamodbDocumentClient({
      DynamoDBDocumentClient: t.context.DynamoDBDocumentClient,
      hashKey,
      rangeKey,
      reqId,
      log: createLogger({ t }),
      ...options
    })

    return client
  }
})

test('constructor: passes tableName to AWS DynamoDBDocumentClient', (t) => {
  const { DynamoDBDocumentClient } = t.context
  const tableName = 'some-table-name'
  const client = new DynamodbDocumentClient({
    DynamoDBDocumentClient,
    hashKey,
    rangeKey,
    tableName,
    log: createLogger({ t })
  })
  td.verify(new DynamoDBDocumentClient({ params: { TableName: tableName } }))
  t.truthy(client)
})

test('constructor: passes params to AWS DynamoDBDocumentClient', (t) => {
  const { DynamoDBDocumentClient } = t.context
  const tableName = 'some-table-name'
  const params = { foo: 'bar' }
  const client = new DynamodbDocumentClient({
    DynamoDBDocumentClient,
    hashKey,
    rangeKey,
    tableName,
    params,
    log: createLogger({ t })
  })
  td.verify(
    new DynamoDBDocumentClient({ params: { ...params, TableName: tableName } })
  )
  t.truthy(client)
})

test('constructor: validates hashKey', (t) => {
  t.throws(
    () => new DynamodbDocumentClient({ rangeKey: 'foo' }),
    { message: /hashKey/ },
    'cannot be nil'
  )
  t.throws(
    () => new DynamodbDocumentClient({ hashKey: '' }),
    { message: /hashKey/ },
    'cannot be empty'
  )
  t.throws(
    () => new DynamodbDocumentClient({ hashKey: 2 }),
    { message: /hashKey/ },
    'must be string'
  )
})

test('constructor: validates rangeKey', (t) => {
  t.throws(
    () => new DynamodbDocumentClient({ hashKey: 'foo', rangeKey: '' }),
    { message: /rangeKey/ },
    'cannot be empty'
  )
  t.throws(
    () => new DynamodbDocumentClient({ hashKey: 'foo', rangeKey: 2 }),
    { message: /rangeKey/ },
    'must be string'
  )
  t.truthy(new DynamodbDocumentClient({ hashKey: 'foo' }), 'may be nil')
})

test('put: returns response', async (t) => {
  const { DynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const promise = td.func()
  const input = { [hashKey]: 'foo', [rangeKey]: 'bar' }

  td.when(DynamoDBDocumentClient.prototype.put({ Item: input })).thenReturn({
    promise
  })

  td.when(promise()).thenResolve(putResponse)

  const data = await client.put(input)

  t.deepEqual(data, putResponseFormatted)
})

test('put: passes params', async (t) => {
  const { DynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const promise = td.func()
  const input = { [hashKey]: 'foo', [rangeKey]: 'bar' }

  td.when(
    DynamoDBDocumentClient.prototype.put({ Item: input, Bar: 3 })
  ).thenReturn({
    promise
  })

  td.when(promise()).thenResolve(putResponse)

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
  const { DynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t, { rangeKey: undefined })
  const promise = td.func()
  const input = { [hashKey]: 'foo' }

  td.when(DynamoDBDocumentClient.prototype.put({ Item: input })).thenReturn({
    promise
  })

  td.when(promise()).thenResolve(putResponse)

  const data = await client.put(input)

  t.deepEqual(data, putResponseFormatted)
})

test('put: throws client error', async (t) => {
  const { DynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const promise = td.func()
  const input = { [hashKey]: 'foo', [rangeKey]: 'bar' }
  const err = new Error('foo')

  td.when(
    DynamoDBDocumentClient.prototype.put(td.matchers.anything())
  ).thenReturn({
    promise
  })
  td.when(promise()).thenReject(err)

  await t.throwsAsync(() => client.put(input), { is: err })
})

test('update: returns response', async (t) => {
  const { DynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const promise = td.func()
  const key = { [hashKey]: 'foo', [rangeKey]: 'bar' }

  td.when(DynamoDBDocumentClient.prototype.update({ Key: key })).thenReturn({
    promise
  })

  td.when(promise()).thenResolve(updateResponse)

  const data = await client.update(key)

  t.deepEqual(data, updateResponseFormatted)
})

test('update: passes params', async (t) => {
  const { DynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const promise = td.func()
  const key = { [hashKey]: 'foo', [rangeKey]: 'bar' }

  td.when(
    DynamoDBDocumentClient.prototype.update({ Key: key, Bar: 3 })
  ).thenReturn({
    promise
  })

  td.when(promise()).thenResolve(updateResponse)

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
  const { DynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t, { rangeKey: undefined })
  const promise = td.func()
  const key = { [hashKey]: 'foo' }

  td.when(DynamoDBDocumentClient.prototype.update({ Key: key })).thenReturn({
    promise
  })

  td.when(promise()).thenResolve(updateResponse)

  const data = await client.update(key)

  t.deepEqual(data, updateResponseFormatted)
})

test('update: throws client error', async (t) => {
  const { DynamoDBDocumentClient, createClient } = t.context
  const client = createClient(t)
  const promise = td.func()
  const key = { [hashKey]: 'foo', [rangeKey]: 'bar' }
  const err = new Error('foo')

  td.when(
    DynamoDBDocumentClient.prototype.update(td.matchers.anything())
  ).thenReturn({
    promise
  })
  td.when(promise()).thenReject(err)

  await t.throwsAsync(() => client.update(key), { is: err })
})

const reqId = 'some-req-id'
const hashKey = 'some-hash-key'
const rangeKey = 'some-range-key'

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
