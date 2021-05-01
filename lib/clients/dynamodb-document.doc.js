/**
 * AWS DynamoDB document client.
 * @class DynamodbDocumentClient
 * @param {Object} parameters
 * @param {string} parameters.tableName Table name.
 * @param {string} parameters.hashKey Table hash key.
 * @param {string} [parameters.rangeKey] Table range key.
 * @param {string} [parameters.name=dynamodb-document] Client name.
 * @param {string} [parameters.reqId=<uuid>] Request id.
 * @param {Object} [parameters.log=<logger>] Pino compatible logger.
 * @param {Constructor} [parameters.AwsDynamoDBClient=DynamoDBClient]
 *        Constructor for a DynamoDBClient from the AWS SDK.
 * @param {Object} [parameters.params={}]
 *        Additional params to pass to the AwsDynamoDBClient constructor.
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
 */

/**
 * Query the DynamoDB table.
 * @async
 * @function query
 * @memberof DynamodbDocumentClient
 * @instance
 * @param {Object} [params={}] Additional params to pass to the QueryCommand.
 * @return {Promise<[Object, Object]>} Tuple of the items
 *         and other response properties normalized to camel case.
 */
