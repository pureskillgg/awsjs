import test from 'ava'
import * as td from 'testdouble'
import { createLogger } from '@meltwater/mlabs-logger'

import { DynamodbDocumentClient } from './dynamodb-document.js'

test.beforeEach((t) => {
  t.context.DynamoDBDocumentClient = td.constructor(['put'])

  t.context.createClient = (t) => {
    const client = new DynamodbDocumentClient({
      DynamoDBDocumentClient: t.context.DynamoDBDocumentClient,
      hashKey,
      rangeKey,
      reqId,
      log: createLogger({ t })
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

const reqId = 'some-req-id'
const hashKey = 'some-hash-key'
const rangeKey = 'some-range-key'
