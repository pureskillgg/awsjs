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
 * Send events to the event bus.
 * @function putEvents
 * @memberof EventbridgeClient
 * @instance
 * @param {Object} events Event entries to send (with EventBusName omitted).
 * @param {Object} params Additional params to pass to the putEvents method.
 * @return {Object} The response normalized to camel case.
 */
