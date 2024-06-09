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

test('getSchedule: passes params', async (t) => {
  const { AwsSchedulerClient, createClient } = t.context
  const client = createClient(t)

  td.when(
    AwsSchedulerClient.prototype.send(
      td.matchers.isAwsSdkCommand(
        new GetScheduleCommand({ Name: scheduleName, GroupName: groupName })
      )
    )
  ).thenResolve(getScheduleResponse)

  const data = await client.getSchedule(scheduleName, { groupName })

  t.deepEqual(data, getScheduleResponseFormatted)
})

test('getSchedule: throws error from client', async (t) => {
  const { AwsSchedulerClient, createClient } = t.context
  const client = createClient(t)
  const err = new Error('foo')

  td.when(
    AwsSchedulerClient.prototype.send(
      td.matchers.isAwsSdkCommand(
        new GetScheduleCommand({ Name: scheduleName })
      )
    )
  ).thenReject(err)

  await t.throwsAsync(() => client.getSchedule(scheduleName), { is: err })
})

const reqId = 'mock-req-id'

const scheduleName = 'mock-schedule-name'
const groupName = 'mock-schedule-group'

const getScheduleResponse = {
  ActionAfterCompletion: 'NONE',
  Arn: 'mock-schedule-arn',
  CreationDate: '2024-06-09T22:40:07.749Z',
  FlexibleTimeWindow: { Mode: 'OFF' },
  groupName,
  LastModificationDate: '2024-06-09T22:40:07.749Z',
  Name: scheduleName,
  ScheduleExpression: 'rate(1 minute)',
  ScheduleExpressionTimezone: 'UTC',
  State: 'ENABLED',
  Target: {
    Arn: 'mock-arn',
    EventBridgeParameters: {
      DetailType: 'mock-detail-type',
      Source: 'mock-source'
    },
    RetryPolicy: { MaximumEventAgeInSeconds: 86400, MaximumRetryAttempts: 185 },
    RoleArn: 'mock-role-arn'
  }
}

const getScheduleResponseFormatted = {
  actionAfterCompletion: 'NONE',
  arn: 'mock-schedule-arn',
  creationDate: '2024-06-09T22:40:07.749Z',
  flexibleTimeWindow: { mode: 'OFF' },
  groupName,
  lastModificationDate: '2024-06-09T22:40:07.749Z',
  name: scheduleName,
  scheduleExpression: 'rate(1 minute)',
  scheduleExpressionTimezone: 'UTC',
  state: 'ENABLED',
  target: {
    arn: 'mock-arn',
    eventBridgeParameters: {
      detailType: 'mock-detail-type',
      source: 'mock-source'
    },
    retryPolicy: { maximumEventAgeInSeconds: 86400, maximumRetryAttempts: 185 },
    roleArn: 'mock-role-arn'
  }
}
