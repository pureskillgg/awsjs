/**
 * AWS S3 client.
 * @class S3Client
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/index.html|@aws-sdk/client-s3}
 * @param {Object} parameters
 * @param {string} parameters.bucket Bucket name.
 * @param {string} [parameters.name=s3] Client name.
 * @param {string} [parameters.reqId=<uuid>] Request id.
 * @param {Object} [parameters.log=<logger>] Pino compatible logger.
 * @param {Constructor} [parameters.AwsS3Client=S3Client]
 *        Constructor for an S3Client from the AWS SDK.
 * @param {Object} [parameters.params={}]
 *        Additional params to pass to the AwsS3Client constructor.
 */

/**
 * Put a JSON serializable object to the S3 bucket.
 * If a gzip Content-Encoding is set, automatically compress.
 * @async
 * @function putObjectJson
 * @memberof S3Client
 * @instance
 * @param {string} key S3 object key.
 * @param {Object} body JSON serializable S3 object body.
 * @param {Object} [params={}] Additional params to pass to the PutObjectCommand.
 * @return {Promise<Object>} Response normalized to camel case.
 */

/**
 * Get a JSON serializable object from the S3 bucket.
 * If a gzip Content-Encoding is set, automatically decompress.
 * @async
 * @function getObjectJson
 * @memberof S3Client
 * @instance
 * @param {string} key S3 object key.
 * @param {Object} [params={}] Additional params to pass to the GetObjectCommand.
 * @return {Promise<Object>} Response normalized to camel case.
 */
