/**
 * AWS EventBridge client.
 * @class EventbridgeClient
 * @param {Object} parameters
 * @param {string} parameters.eventBusName Event bus name.
 * @param {string} [parameters.name=eventbridge] Client name.
 * @param {string} [parameters.reqId=<uuid>] Request id.
 * @param {Object} [parameters.log=<logger>] Pino compatible logger.
 * @param {Constructor} [parameters.AwsEventBridgeClient=EventBridgeClient]
 *        Constructor for an EventBridgeClient from the AWS SDK.
 * @param {Object} [parameters.params={}]
 *        Additional params to pass to the AwsEventBridgeClient constructor.
 */

/**
 * Send events to the EventBridge Event Bus.
 * @async
 * @function putEvents
 * @memberof EventbridgeClient
 * @instance
 * @param {Object[]} [events=[]]Event entries to send (with EventBusName omitted).
 * @param {Object} [params=[]] Additional params to pass to the PutEventsCommand.
 * @return {Promise<Object>} Response normalized to camel case.
 */
