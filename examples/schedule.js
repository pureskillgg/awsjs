import { SchedulerClient } from '../index.js'

export const createSchedule =
  ({ log }) =>
  async (scheduleName, groupName, arn, roleArn) => {
    const client = new SchedulerClient({
      log
    })
    return client.createSchedule(scheduleName, {
      scheduleExpression: 'rate(1 minute)',
      flexibleTimeWindow: { mode: 'OFF' },
      input: { foo: 'bar' },
      groupName,
      target: {
        arn,
        roleArn,
        eventBridgeParameters: {
          detailType: 'example',
          source: 'example'
        }
      }
    })
  }

export const deleteSchedule =
  ({ log }) =>
  async (scheduleName, groupName) => {
    const client = new SchedulerClient({
      log
    })
    return client.deleteSchedule(scheduleName, { groupName })
  }

export const updateSchedule =
  ({ log }) =>
  async (scheduleName, groupName) => {
    const client = new SchedulerClient({
      log
    })
    return client.updateSchedule(scheduleName, {
      scheduleExpression: 'rate(2 minute)',
      groupName
    })
  }

export const getSchedule =
  ({ log }) =>
  async (scheduleName, groupName) => {
    const client = new SchedulerClient({
      log
    })
    return client.getSchedule(scheduleName, { groupName })
  }
