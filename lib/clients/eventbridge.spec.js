import test from 'ava'
import * as td from 'testdouble'
import { createLogger } from '@meltwater/mlabs-logger'
import { PutEventsCommand } from '@aws-sdk/client-eventbridge'

import { registerTestdoubleMatchers } from '../../testdouble-matchers.js'
import { EventbridgeClient } from './eventbridge.js'

test.before(() => {
  registerTestdoubleMatchers(td)
})

test.beforeEach((t) => {
  t.context.AwsEventBridgeClient = td.constructor(['send'])

  t.context.createClient = (t, options) => {
    const client = new EventbridgeClient({
      AwsEventBridgeClient: t.context.AwsEventBridgeClient,
      eventBusName,
      reqId,
      log: createLogger({ t }),
      ...options
    })

    return client
  }
})

test('constructor: passes params to AWS EventBridgeClient', (t) => {
  const { AwsEventBridgeClient } = t.context
  const params = { foo: 'bar' }
  const client = new EventbridgeClient({
    AwsEventBridgeClient,
    eventBusName,
    params,
    log: createLogger({ t })
  })
  td.verify(new AwsEventBridgeClient(params))
  t.truthy(client)
})

test('putEvents: returns response', async (t) => {
  const { AwsEventBridgeClient, createClient } = t.context
  const client = createClient(t)
  const input = eventInput
  const entry = eventEntry

  td.when(
    AwsEventBridgeClient.prototype.send(
      td.matchers.isAwsSdkCommand(new PutEventsCommand({ Entries: [entry] }))
    )
  ).thenResolve(eventResponse)

  const data = await client.putEvents(input)

  t.deepEqual(data, putEventsResponseFormatted)
})

test('putEvents: passes params', async (t) => {
  const { AwsEventBridgeClient, createClient } = t.context
  const client = createClient(t)
  const input = eventInput
  const entry = eventEntry

  td.when(
    AwsEventBridgeClient.prototype.send(
      td.matchers.isAwsSdkCommand(
        new PutEventsCommand({ Entries: [entry], Bar: 3 })
      )
    )
  ).thenResolve(eventResponse)

  const data = await client.putEvents(input, { bar: 3 })

  t.deepEqual(data, putEventsResponseFormatted)
})

test('putEvents: throws failed entries error', async (t) => {
  const { AwsEventBridgeClient, createClient } = t.context
  const client = createClient(t)
  const err = new Error('foo')

  td.when(
    AwsEventBridgeClient.prototype.send(td.matchers.anything())
  ).thenReject(err)

  await t.throwsAsync(() => client.putEvents(), { is: err })
})

test('putEvents: throws client error', async (t) => {
  const { AwsEventBridgeClient, createClient } = t.context
  const client = createClient(t)
  const input = eventInput
  const entry = eventEntry

  td.when(
    AwsEventBridgeClient.prototype.send(
      td.matchers.isAwsSdkCommand(new PutEventsCommand({ Entries: [entry] }))
    )
  ).thenResolve({
    ...eventResponse,
    FailedEntryCount: 1
  })

  const { data, code } = await t.throwsAsync(() => client.putEvents(input), {
    message: /1/
  })
  t.is(code, 'err_event_bus_failed_entries')
  t.deepEqual(data, putEventsResponseFormatted)
})

const eventBusName = 'mock-event-bus'
const reqId = 'mock-req-id'

const eventInput = [
  {
    time: '2020',
    source: 'mock-source',
    resources: ['mock-resource'],
    detailType: 'mock-detail-type',
    detail: { foo: 2 }
  }
]

const eventEntry = {
  Time: '2020-01-01T00:00:00.000Z',
  Source: 'mock-source',
  Resources: ['mock-resource'],
  DetailType: 'mock-detail-type',
  Detail: '{"foo":2}',
  EventBusName: eventBusName
}

const eventResponse = {
  FailedEntryCount: 0,
  Entries: [
    {
      EventId: 'mock-event-id',
      ErrorCode: 'mock-error-code',
      ErrorMessage: 'mock-error-message'
    }
  ]
}

const putEventsResponseFormatted = [
  {
    eventId: 'mock-event-id',
    errorCode: 'mock-error-code',
    errorMessage: 'mock-error-message'
  }
]
