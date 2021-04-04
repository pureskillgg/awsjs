import { DynamoDBClient as AwsSdkDynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '@meltwater/mlabs-logger'
import {
  both,
  complement,
  has,
  isNonEmptyString,
  isNotNil,
  renameKeys
} from '@meltwater/phi'

const defaultTranslateConfig = {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true
  },
  unmarshallOptions: { wrapNumbers: false }
}

const defaultCreateAwsDynamoDBDocumentClient = (...args) =>
  DynamoDBDocumentClient.from(...args)

export class DynamodbDocumentClient {
  #tableName
  #hashKey
  #rangeKey
  #client
  #reqId
  #log

  constructor({
    tableName,
    hashKey,
    rangeKey,
    name = 'dynamodb-document',
    reqId = uuidv4(),
    log = createLogger(),
    AwsDynamoDBClient = AwsSdkDynamoDBClient,
    translateConfig = defaultTranslateConfig,
    createAwsDynamoDBDocumentClient = defaultCreateAwsDynamoDBDocumentClient,
    params = {}
  }) {
    validateHashAndRangeKeys(hashKey, rangeKey)
    this.#tableName = tableName
    this.#hashKey = hashKey
    this.#rangeKey = rangeKey
    const client = new AwsDynamoDBClient(params)
    this.#client = createAwsDynamoDBDocumentClient(client, translateConfig)
    this.#reqId = reqId
    this.#log = log.child({
      params,
      tableName,
      client: name,
      class: DynamodbDocumentClient.name,
      reqId
    })
  }

  async put(input, params = {}) {
    const log = this.#log.child({
      meta: params,
      method: DynamodbDocumentClient.prototype.put.name
    })
    try {
      log.info({ data: input }, 'start')

      this._validateInputHasKeys(input)

      const command = new PutCommand({
        TableName: this.#tableName,
        Item: input,
        ...params
      })

      const res = await this.#client.send(command)

      const data = formatPutResponse(res)

      log.debug({ data }, 'data')
      log.info('end')
      return data
    } catch (err) {
      log.error({ err }, 'fail')
      throw err
    }
  }

  async update(key, params = {}) {
    const log = this.#log.child({
      meta: { key, ...params },
      method: DynamodbDocumentClient.prototype.update.name
    })
    try {
      log.info('start')

      this._validateInputHasKeys(key)

      const command = new UpdateCommand({
        TableName: this.#tableName,
        Key: key,
        ...params
      })

      const res = await this.#client.send(command)

      const data = formatUpdateResponse(res)

      log.debug({ data }, 'data')
      log.info('end')
      return data
    } catch (err) {
      log.error({ err }, 'fail')
      throw err
    }
  }

  _validateInputHasKeys(input) {
    if (notHave(this.#hashKey, input)) {
      throw new Error(`Input missing hashKey ${this.#hashKey}`)
    }

    if (isNotNil(this.#rangeKey) && notHave(this.#rangeKey, input)) {
      throw new Error(`Input missing rangeKey ${this.#rangeKey}`)
    }
  }
}

const validateHashAndRangeKeys = (hashKey, rangeKey) => {
  if (isNotNonEmptyString(hashKey)) {
    throw new Error(`Expected hashKey to be non-empty string, got, ${hashKey}`)
  }

  if (isInvalidRangeKey(rangeKey)) {
    throw new Error(
      `Expected rangeKey to be non-empty string, got, ${rangeKey}`
    )
  }
}

const isNotNonEmptyString = complement(isNonEmptyString)
const isInvalidRangeKey = both(isNotNil, isNotNonEmptyString)
const notHave = complement(has)

const formatPutResponse = renameKeys({
  Attributes: 'attributes',
  ConsumedCapacity: 'consumedCapacity',
  ItemCollectionMetrics: 'itemCollectionMetrics'
})

const formatUpdateResponse = formatPutResponse
