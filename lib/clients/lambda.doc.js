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
 * @see {@link https://docs.amazonaws.cn/en_us/lambda/latest/dg/nodejs-exceptions.html|AWS Lambda function errors in Node.js}
 * @throws {LambdaFunctionError} Thrown when the response contains a FunctionError.
 * @throws {LambdaStatusCodeError} Thrown when the response StatusCode is not 2xx.
 */

/**
 * AWS Lambda function error.
 * @class LambdaFunctionError
 * @extends Error
 * @param {InvokeCommandOutput} res
 * @property {Object} data Lambda function response payload parsed as JSON.
 */

/**
 * AWS Lambda status code error.
 * @class LambdaStatusCodeError
 * @extends Error
 * @param {InvokeCommandOutput} res
 * @property {number} statusCode Status code from invoking the Lambda function.
 */

/**
 * @external InvokeCommandOutput
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-lambda/interfaces/invokecommandoutput.html|InvokeCommandOutput}
 */
