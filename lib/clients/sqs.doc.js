/**
 * AWS SQS client.
 * @class SqsClient
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-sqs/index.html|@aws-sdk/client-sqs}
 * @param {Object} parameters
 * @param {string} parameters.queueUrl Queue URL.
 * @param {string} [parameters.name=sqs] Client name.
 * @param {string} [parameters.reqId=<uuid>] Request id.
 * @param {Object} [parameters.log=<logger>] Pino compatible logger.
 * @param {Constructor} [parameters.AwsSQSClient=SQSClient]
 *        Constructor for an SQSClient from the AWS SDK.
 * @param {Object} [parameters.params={}]
 *        Additional params to pass to the AwsSQSClient constructor.
 */

/**
 * Send a JSON serializable message to the SQS queue.
 * @async
 * @function sendMessageJson
 * @memberof SqsClient
 * @instance
 * @param {Object} message JSON serializable SQS message body.
 * @param {Object} [params={}] Additional params to pass to the SendMessageCommand.
 * @return {Promise<Object>} Response normalized to camel case.
 */
