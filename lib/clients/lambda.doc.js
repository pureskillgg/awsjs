/**
 * AWS Lambda client.
 * @class LambdaClient
 * @param {Object} parameters
 * @param {string} parameters.functionName Lambda function name.
 * @param {string} [parameters.name=lambda] Client name.
 * @param {string} [parameters.reqId=<uuid>] Request id.
 * @param {Object} [parameters.log=<logger>] Pino compatible logger.
 * @param {Constructor} [parameters.AwsLambdaClient=LambdaClient]
 *        Constructor for a LambdaClient from the AWS SDK.
 * @param {Object} [parameters.params={}]
 *        Additional params to pass to the AwsLambdaClient constructor.
 */

/**
 * Invoke the Lambda function with a JSON payload.
 * @async
 * @function invokeJson
 * @memberof LambdaClient
 * @instance
 * @param {Object} payload JSON serializable request payload.
 * @param {Object} [params={}] Additional params to pass to the InvokeCommand.
 * @return {Promise<Object>} Lambda function response payload parsed as JSON.
 */
