/**
 * AWS EventBridge client.
 * @class EventbridgeClient
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-eventbridge/index.html|@aws-sdk/client-eventbridge}
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
 * @param {Object[]} [events=[]] Event entries to send (with EventBusName omitted).
 * @param {Object} [params=[]] Additional params to pass to the PutEventsCommand.
 * @return {Promise<Object>} Response normalized to camel case.
 * @throws {EventbridgeFailedEntriesError} Thrown when the response contains failed entries.
 */

/**
 * AWS EventBridge failed entries error.
 * @class EventbridgeFailedEntriesError
 * @extends Error
 * @param {PutEventsCommandOutput} res
 * @property {number} failedEntryCount Number of failed entries.
 * @property {Object[]} data Event entries response normalized to camel case.
 */

/**
 * @external PutEventsCommandOutput
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-eventbridge/interfaces/puteventscommandoutput.html|PutEventsCommandOutput}
 */
