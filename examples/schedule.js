import { SchedulerClient } from '../index.js'

export const createSchedule =
  ({ log }) =>
  async (scheduleName, groupName, arn, roleArn) => {
    const client = new SchedulerClient({
      groupName,
      log
    })
    return client.createSchedule(scheduleName, {
      scheduleExpression: 'rate(1 minute)',
      flexibleTimeWindow: { mode: 'OFF' },
      input: { foo: 'bar' },
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
      groupName,
      log
    })
    return client.deleteSchedule(scheduleName)
  }

export const updateSchedule =
  ({ log }) =>
  async (scheduleName, groupName, arn, roleArn) => {
    const client = new SchedulerClient({
      groupName,
      log
    })
    return client.updateSchedule(scheduleName, {
      scheduleExpression: 'rate(2 minutes)',
      flexibleTimeWindow: { mode: 'OFF' },
      input: { foo: 'bar' },
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

export const getSchedule =
  ({ log }) =>
  async (scheduleName, groupName) => {
    const client = new SchedulerClient({
      groupName,
      log
    })
    return client.getSchedule(scheduleName)
  }
