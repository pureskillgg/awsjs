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

  const data = await client.putEvents(input, { Bar: 3 })

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

const eventBusName = 'some-event-bus'
const reqId = 'some-req-id'

const eventInput = [
  {
    time: '2020',
    source: 'some-source',
    resources: ['some-resource'],
    detailType: 'some-detail-type',
    detail: { foo: 2 }
  }
]

const eventEntry = {
  Time: '2020-01-01T00:00:00.000Z',
  Source: 'some-source',
  Resources: ['some-resource'],
  DetailType: 'some-detail-type',
  Detail: '{"foo":2}',
  EventBusName: eventBusName
}

const eventResponse = {
  FailedEntryCount: 0,
  Entries: [
    {
      EventId: 'some-event-id',
      ErrorCode: 'some-error-code',
      ErrorMessage: 'some-error-message'
    }
  ]
}

const putEventsResponseFormatted = [
  {
    eventId: 'some-event-id',
    errorCode: 'some-error-code',
    errorMessage: 'some-error-message'
  }
]
