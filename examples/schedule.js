import { ScheduleClient } from '../index.js'

export const createSchedule =
  ({ log }) =>
  async (scheduleName, groupName, arn, roleArn) => {
    const client = new ScheduleClient({
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
    const client = new ScheduleClient({
      log
    })
    return client.deleteSchedule(scheduleName, { groupName })
  }

export const updateSchedule =
  ({ log }) =>
  async (scheduleName, groupName, arn, roleArn) => {
    const client = new ScheduleClient({
      log
    })
    return client.updateSchedule(scheduleName, {
      scheduleExpression: 'rate(2 minutes)',
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

export const getSchedule =
  ({ log }) =>
  async (scheduleName, groupName) => {
    const client = new ScheduleClient({
      log
    })
    return client.getSchedule(scheduleName, { groupName })
  }
