/**
 * AWS DynamoDB document client.
 * @class DynamodbDocumentClient
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/index.html|@aws-sdk/client-dynamodb}
 * @param {Object} parameters
 * @param {string} parameters.tableName Table name.
 * @param {string} parameters.hashKey Table hash key.
 * @param {string} [parameters.rangeKey] Table range key.
 * @param {Object} [parameters.translateConfig=defaultTranslateConfig]
 *        Translate config.
 * @param {function} [parameters.createAwsDynamoDBDocumentClient=DynamoDBDocumentClient.from]
 *        Factory to create a DynamoDBDocumentClient.
 * @param {string} [parameters.name=dynamodb-document] Client name.
 * @param {string} [parameters.reqId=<uuid>] Request id.
 * @param {Object} [parameters.log=<logger>] Pino compatible logger.
 * @param {Constructor} [parameters.AwsDynamoDBClient=DynamoDBClient]
 *        Constructor for a DynamoDBClient from the AWS SDK.
 * @param {Object} [parameters.params={}]
 *        Additional params to pass to the AwsDynamoDBClient constructor.
 * @property {Object} db Raw DynamoDBClient.
 * @property {Object} tableName Configured table name.
 */

/**
 * Get an item from the DynamoDB table.
 * @async
 * @function get
 * @memberof DynamodbDocumentClient
 * @instance
 * @param {Object} key Item hash and range key.
 * @param {Object} [params={}] Additional params to pass to the GetCommand.
 * @return {Promise<[Object, Object]>} Tuple of the item
 *         and other response properties normalized to camel case.
 * @throws {DynamodbMissingKeyError} Thrown when the input is missing the hashKey or rangeKey.
 */

/**
 * Put an item into the DynamoDB table.
 * @async
 * @function put
 * @memberof DynamodbDocumentClient
 * @instance
 * @param {Object} item Item to put.
 * @param {Object} [params={}] Additional params to pass to the PutCommand.
 * @return {Promise<Object>} Response normalized to camel case.
 * @throws {DynamodbMissingKeyError} Thrown when the input is missing the hashKey or rangeKey.
 */

/**
 * Update an item from the DynamoDB table.
 * @async
 * @function update
 * @memberof DynamodbDocumentClient
 * @instance
 * @param {Object} key Item hash and range key.
 * @param {Object} [params={}] Additional params to pass to the UpdateCommand.
 * @return {Promise<Object>} Response normalized to camel case.
 * @throws {DynamodbMissingKeyError} Thrown when the input is missing the hashKey or rangeKey.
 */

/**
 * Delete an item from the DynamoDB table.
 * @async
 * @function delete
 * @memberof DynamodbDocumentClient
 * @instance
 * @param {Object} key Item hash and range key.
 * @param {Object} [params={}] Additional params to pass to the DeleteCommand.
 * @return {Promise<Object>} Response normalized to camel case.
 * @throws {DynamodbMissingKeyError} Thrown when the input is missing the hashKey or rangeKey.
 */

/**
 * Query the DynamoDB table.
 * @async
 * @function query
 * @memberof DynamodbDocumentClient
 * @instance
 * @param {Object} [params={}] Additional params to pass to the QueryCommand.
 * @return {Promise<[Object[], Object]>} Tuple of the items
 *         and other response properties normalized to camel case.
 */

/**
 * Get items from one or more DynamoDB tables using a transaction.
 * @async
 * @function transactGet
 * @memberof DynamodbDocumentClient
 * @instance
 * @param {Object[]} transactItems Array of TransactGetItem objects.
 *        The default tableName will be used for each object if not overridden.
 * @param {Object} [params={}] Additional params to pass to the TransactGetCommand.
 * @return {Promise<[Object[], Object[]]>} Tuple of the array of transaction-ordered items
 *         and array of transaction-ordered metrics normalized to camel case.
 */

/**
 * Write items to one or more DynamoDB tables using a transaction.
 * @async
 * @function transactWrite
 * @memberof DynamodbDocumentClient
 * @instance
 * @param {Object[]} transactItems Array of TransactWriteItem objects.
 *        The default tableName will be used for each object if not overridden.
 * @param {Object} [params={}] Additional params to pass to the TransactWriteCommand.
 * @return {Promise<[Object[], Object]>} Tuple of the array of transaction-ordered metrics
 *         and other response properties normalized to camel case.
 */

/**
 * AWS DynamoDB missing key error.
 * @class DynamodbMissingKeyError
 * @extends Error
 * @param {string} keyType The type of key that is missing: hashKey or rangeKey.
 * @param {string} keyName The corresponding key name for this table.
 * @property {string} keyType The type of key that is missing: hashKey or rangeKey.
 * @property {string} keyName The corresponding key name for this table.
 */
