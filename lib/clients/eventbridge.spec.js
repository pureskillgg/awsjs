import test from 'ava'
import * as td from 'testdouble'
import { createLogger } from '@meltwater/mlabs-logger'

import { EventbridgeClient } from './eventbridge.js'

test.beforeEach((t) => {
  t.context.EventBridge = td.constructor(['putEvents'])

  t.context.createClient = (t, options) => {
    const client = new EventbridgeClient({
      EventBridge: t.context.EventBridge,
      eventBusName,
      reqId,
      log: createLogger({ t }),
      ...options
    })

    return client
  }
})

test('constructor: passes params to AWS EventBridge', (t) => {
  const { EventBridge } = t.context
  const params = { foo: 'bar' }
  const client = new EventbridgeClient({
    EventBridge,
    eventBusName,
    params,
    log: createLogger({ t })
  })
  td.verify(new EventBridge({ params }))
  t.truthy(client)
})

test('putEvents: returns response', async (t) => {
  const { EventBridge, createClient } = t.context
  const client = createClient(t)
  const promise = td.func()
  const input = eventInput
  const entry = eventEntry

  td.when(EventBridge.prototype.putEvents({ Entries: [entry] })).thenReturn({
    promise
  })

  td.when(promise()).thenResolve(eventResponse)

  const data = await client.putEvents(input)

  t.deepEqual(data, putEventsResponseFormatted)
})

test('putEvents: passes params', async (t) => {
  const { EventBridge, createClient } = t.context
  const client = createClient(t)
  const promise = td.func()
  const input = eventInput
  const entry = eventEntry

  td.when(
    EventBridge.prototype.putEvents({ Entries: [entry], Bar: 3 })
  ).thenReturn({
    promise
  })

  td.when(promise()).thenResolve(eventResponse)

  const data = await client.putEvents(input, { Bar: 3 })

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
