import AWS from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '@meltwater/mlabs-logger'
import { fromIsoUtc, toIso } from '@meltwater/tau'
import {
  assoc,
  compose,
  evolve,
  filter,
  map,
  pipe,
  reject,
  renameKeys,
  isNil,
  toJson
} from '@meltwater/phi'

export class EventbridgeClient {
  #eventBusName
  #client
  #reqId
  #log

  constructor({
    eventBusName,
    name = 'sqs',
    reqId = uuidv4(),
    log = createLogger(),
    EventBridge = AWS.EventBridge,
    params = {}
  }) {
    const defaultParams = params
    this.#eventBusName = eventBusName
    this.#client = new EventBridge({ params: defaultParams })
    this.#reqId = reqId
    this.#log = log.child({
      defaultParams,
      client: name,
      class: 'EventbridgeClient',
      reqId
    })
  }

  async putEvents(input = [], params = {}) {
    const log = this.#log.child({
      meta: params,
      method: 'putEvents'
    })
    try {
      log.info({ data: input }, 'start')

      const toEntries = map(formatEventInput(this.#eventBusName))

      const req = {
        Entries: toEntries(input),
        ...params
      }

      const res = await this.#client.putEvents(req).promise()

      checkFailedEntries(res)

      const data = res.Entries.map(formatEventResponse)

      log.debug({ data }, 'data')
      log.info('end')
      return data
    } catch (err) {
      log.error({ err }, 'fail')
      throw err
    }
  }
}

const checkFailedEntries = (res) => {
  const { FailedEntryCount, Entries } = res
  if (FailedEntryCount === 0) return
  const err = new Error(`Failed to send ${FailedEntryCount} events`)
  err.data = formatEventResponse(Entries)
  err.code = 'event_bus_failed_entries'
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
    renameKeys({
      time: 'Time',
      source: 'Source',
      resources: 'Resources',
      detailType: 'DetailType',
      detail: 'Detail'
    })
  )

const formatEventResponse = renameKeys({
  EventId: 'eventId',
  ErrorCode: 'errorCode',
  ErrorMessage: 'errorMessage'
})
