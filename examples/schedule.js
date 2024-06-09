import { SchedulerClient } from '../index.js'

export const createSchedule =
  ({ log }) =>
  async (scheduleName) => {
    const client = new SchedulerClient({
      log
    })
    return client.createSchedule(scheduleName, {})
  }

export const deleteSchedule =
  ({ log }) =>
  async (scheduleName) => {
    const client = new SchedulerClient({
      log
    })
    return client.deleteSchedule(scheduleName)
  }

export const updateSchedule =
  ({ log }) =>
  async (scheduleName) => {
    const client = new SchedulerClient({
      log
    })
    return client.updateSchedule(scheduleName, {})
  }

export const getSchedule =
  ({ log }) =>
  async (scheduleName) => {
    const client = new SchedulerClient({
      log
    })
    return client.getSchedule(scheduleName)
  }
