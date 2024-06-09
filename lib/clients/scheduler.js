import {
  SchedulerClient as AwsSdkSchedulerClient,
  CreateScheduleCommand,
  DeleteScheduleCommand,
  GetScheduleCommand,
  UpdateScheduleCommand
} from '@aws-sdk/client-scheduler'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '@meltwater/mlabs-logger'
import {
  has,
  identity,
  ifElse,
  isObjectLike,
  map,
  mapPath,
  pipe
} from '@meltwater/phi'

import { createCache } from '../cache.js'
import { keysToCamelCase, keysToPascalCase } from '../case.js'

const createClient = createCache()

export class SchedulerClient {
  #client
  #reqId
  #log

  constructor({
    name = 'scheduler',
    reqId = uuidv4(),
    log = createLogger(),
    AwsSchedulerClient = AwsSdkSchedulerClient,
    params = {}
  }) {
    this.#client = createClient(name, () => new AwsSchedulerClient(params))
    this.#reqId = reqId
    this.#log = log.child({
      params,
      client: name,
      class: SchedulerClient.name,
      reqId
    })
  }

  async getSchedule(scheduleName, params = {}) {
    const log = this.#log.child({
      scheduleName,
      meta: params,
      method: SchedulerClient.prototype.getSchedule.name
    })
    try {
      log.info('start')
      const req = formatReq({ ...params, name: scheduleName })
      const command = new GetScheduleCommand(req)

      const res = await this.#client.send(command)

      const data = formatRes(res)

      log.debug({ data }, 'data')
      log.info('end')
      return data
    } catch (err) {
      log.error({ err }, 'fail')
      throw err
    }
  }

  async createSchedule(scheduleName, params = {}) {
    const log = this.#log.child({
      scheduleName,
      meta: params,
      method: SchedulerClient.prototype.createSchedule.name
    })
    try {
      log.info('start')
      const req = formatReq({ ...params, name: scheduleName })
      const command = new CreateScheduleCommand(req)

      const res = await this.#client.send(command)

      const data = formatRes(res)

      log.debug({ data }, 'data')
      log.info('end')
      return data
    } catch (err) {
      log.error({ err }, 'fail')
      throw err
    }
  }

  async deleteSchedule(scheduleName, params = {}) {
    const log = this.#log.child({
      scheduleName,
      meta: params,
      method: SchedulerClient.prototype.deleteSchedule.name
    })
    try {
      log.info('start')
      const req = formatReq({ ...params, name: scheduleName })
      const command = new DeleteScheduleCommand(req)

      const res = await this.#client.send(command)

      const data = formatRes(res)

      log.debug({ data }, 'data')
      log.info('end')
      return data
    } catch (err) {
      log.error({ err }, 'fail')
      throw err
    }
  }

  async updateSchedule(scheduleName, params = {}) {
    const log = this.#log.child({
      scheduleName,
      meta: params,
      method: SchedulerClient.prototype.updateSchedule.name
    })
    try {
      log.info('start')
      const schedule = await this.getSchedule(scheduleName, {
        groupName: params.groupName
      })

      const req = formatReq({ ...schedule, ...params, name: scheduleName })
      const command = new UpdateScheduleCommand(req)

      const res = await this.#client.send(command)

      const data = formatRes(res)

      log.debug({ data }, 'data')
      log.info('end')
      return data
    } catch (err) {
      log.error({ err }, 'fail')
      throw err
    }
  }
}

const formatReq = pipe(
  keysToPascalCase,
  map(ifElse(isObjectLike, keysToPascalCase, identity)),
  ifElse(
    has('Target'),
    mapPath(
      ['Target'],
      pipe(
        keysToPascalCase,
        map(ifElse(isObjectLike, keysToPascalCase, identity))
      )
    ),
    identity
  )
)

const formatRes = pipe(
  ifElse(
    has('Target'),
    mapPath(
      ['Target'],
      pipe(
        keysToCamelCase,
        map(ifElse(isObjectLike, keysToCamelCase, identity))
      )
    ),
    identity
  ),
  map(ifElse(isObjectLike, keysToCamelCase, identity)),
  keysToCamelCase
)
