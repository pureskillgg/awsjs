import test from 'ava'
import * as td from 'testdouble'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '@meltwater/mlabs-logger'
import {
  CreateScheduleCommand,
  DeleteScheduleCommand,
  GetScheduleCommand,
  UpdateScheduleCommand
} from '@aws-sdk/client-scheduler'

import { registerTestdoubleMatchers } from '../../testdouble-matchers.js'

import { SchedulerClient } from './scheduler.js'

test.before(() => {
  registerTestdoubleMatchers(td)
})

test.beforeEach((t) => {
  t.context.AwsSchedulerClient = td.constructor(['send'])

  t.context.createClient = (t, options) => {
    const client = new SchedulerClient({
      name: uuidv4(),
      AwsSchedulerClient: t.context.AwsSchedulerClient,
      reqId,
      log: createLogger({ t }),
      ...options
    })

    return client
  }
})

test('constructor: passes params to AWS SchedulerClient', (t) => {
  const { AwsSchedulerClient } = t.context
  const params = { foo: 'bar' }
  const client = new SchedulerClient({
    name: uuidv4(),
    AwsSchedulerClient,
    params,
    log: createLogger({ t })
  })
  td.verify(new AwsSchedulerClient(params))
  t.truthy(client)
})

test('getSchedule: returns response', async (t) => {
  const { AwsSchedulerClient, createClient } = t.context
  const client = createClient(t)

  td.when(
    AwsSchedulerClient.prototype.send(
      td.matchers.isAwsSdkCommand(
        new GetScheduleCommand({ Name: scheduleName })
      )
    )
  ).thenResolve(getScheduleResponse)

  const data = await client.getSchedule(scheduleName)

  t.deepEqual(data, getScheduleResponseFormatted)
})

const reqId = 'mock-req-id'

const scheduleName = 'mock-schedule-name'

const getScheduleResponse = { ScheduleArn: 'mock-schedule-arn' }

const getScheduleResponseFormatted = { scheduleArn: 'mock-schedule-arn' }
