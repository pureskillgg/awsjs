import AWS from 'aws-sdk'
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

export class DynamodbDocumentClient {
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
    DocumentClient = AWS.DynamoDB.DocumentClient,
    params = {}
  }) {
    validateHashAndRangeKeys(hashKey, rangeKey)
    const defaultParams = { TableName: tableName, ...params }
    this.#hashKey = hashKey
    this.#rangeKey = rangeKey
    this.#client = new DocumentClient({ params: defaultParams })
    this.#reqId = reqId
    this.#log = log.child({
      defaultParams,
      client: name,
      class: 'DynamodbDocumentClient',
      reqId
    })
  }

  async put(input, params = {}) {
    const log = this.#log.child({
      meta: params,
      method: 'put'
    })
    try {
      log.info({ data: input }, 'start')

      this._validateInputHasKeys(input)

      const req = {
        Item: input,
        ...params
      }

      const res = await this.#client.put(req).promise()

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
      method: 'update'
    })
    try {
      log.info('start')

      this._validateInputHasKeys(key)

      const req = {
        Key: key,
        ...params
      }

      const res = await this.#client.update(req).promise()

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
