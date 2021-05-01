import {
  EventBridgeClient as AwsSdkEventBridgeClient,
  PutEventsCommand
} from '@aws-sdk/client-eventbridge'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '@meltwater/mlabs-logger'
import { fromIsoUtc, toIso } from '@meltwater/tau'
import {
  assoc,
  compose,
  dissoc,
  evolve,
  filter,
  isNil,
  map,
  pipe,
  reject,
  toJson
} from '@meltwater/phi'

import { keysToCamelCase, keysToPascalCase } from '../case.js'

export class EventbridgeClient {
  #eventBusName
  #client
  #reqId
  #log

  constructor({
    eventBusName,
    name = 'eventbridge',
    reqId = uuidv4(),
    log = createLogger(),
    AwsEventBridgeClient = AwsSdkEventBridgeClient,
    params = {}
  }) {
    this.#eventBusName = eventBusName
    this.#client = new AwsEventBridgeClient(params)
    this.#reqId = reqId
    this.#log = log.child({
      params,
      eventBusName,
      client: name,
      class: EventbridgeClient.name,
      reqId
    })
  }

  async putEvents(events = [], params = {}) {
    const eventBatchId = uuidv4()
    const log = this.#log.child({
      eventCount: events.length,
      eventBatchId,
      meta: params,
      method: EventbridgeClient.prototype.putEvents.name
    })
    try {
      log.info({ data: map(dissoc('detail'), events) }, 'start')
      for (const event of events) log.debug({ data: event }, 'event')

      const entries = this.#toEntries(events)
      const req = formatReq({ entries, ...params })
      const command = new PutEventsCommand(req)

      const res = await this.#client.send(command)

      checkFailedEntries(res)

      const { entries: Entries, ...rest } = formatRes(res)
      const data = Entries.map(formatEventResponse)

      log.debug({ data, meta: rest }, 'data')
      log.info('end')
      return data
    } catch (err) {
      log.error({ err }, 'fail')
      throw err
    }
  }

  #toEntries = (events) => {
    return events.map(formatEventInput(this.#eventBusName))
  }
}

const checkFailedEntries = (res) => {
  const { FailedEntryCount, Entries } = res
  if (FailedEntryCount === 0) return
  const err = new Error(`Failed to send ${FailedEntryCount} events`)
  err.data = Entries.map(formatEventResponse)
  err.code = 'err_event_bus_failed_entries'
  throw err
}

const formatEventInput = (eventBusName) =>
  pipe(
    assoc('EventBusName', eventBusName),
    filter(reject(isNil)),
    evolve({
      detail: toJson,
      time: compose(toIso, fromIsoUtc)
    }),
    keysToPascalCase
  )

const formatReq = keysToPascalCase
const formatRes = keysToCamelCase
const formatEventResponse = formatRes
