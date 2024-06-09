/**
 * AWS ScheduleClient client.
 * @class ScheduleClient
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-eventbridge/index.html|@aws-sdk/client-scheduler}
 * @param {Object} parameters
 * @param {string} [parameters.name=schedule] Client name.
 * @param {string} [parameters.reqId=<uuid>] Request id.
 * @param {Object} [parameters.log=<logger>] Pino compatible logger.
 * @param {Constructor} [parameters.AwsSdkSchedulerClient=SchedulerClient]
 *        Constructor for a SchedulerClient from the AWS SDK.
 * @param {Object} [parameters.params={}]
 *        Additional params to pass to the AwsSdkSchedulerClient constructor.
 */

/**
 * Get a schedule.
 * @async
 * @function getSchedule
 * @memberof ScheduleClient
 * @instance
 * @param {Object[]} [name] Name of the schedule to get.
 * @param {Object} [params=[]] Additional params to pass to the GetScheduleCommand.
 * @return {Promise<Object>} Response normalized to camel case.
 */

/**
 * Create a schedule.
 * @async
 * @function createSchedule
 * @memberof ScheduleClient
 * @instance
 * @param {Object[]} [name] Name of the schedule to create.
 * @param {Object} [params=[]] Additional params to pass to the CreateScheduleCommand.
 * @return {Promise<Object>} Response normalized to camel case.
 */

/**
 * Delete a schedule.
 * @async
 * @function deleteSchedule
 * @memberof ScheduleClient
 * @instance
 * @param {Object[]} [name] Name of the schedule to delete.
 * @param {Object} [params=[]] Additional params to pass to the DeleteScheduleCommand.
 * @return {Promise<Object>} Response normalized to camel case.
 */

/**
 * Update a schedule.
 * AWS uses a replace all attributes strategy when updating schedules.
 * AWS schedules
 * @async
 * @function deleteSchedule
 * @memberof ScheduleClient
 * @instance
 * @param {Object[]} [name] Name of the schedule to update.
 * @param {Object} [params=[]] Additional params to pass to the UpdateScheduleCommand.
 * @return {Promise<Object>} Response normalized to camel case.
 */
