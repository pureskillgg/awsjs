import { DynamoDBClient as AwsSdkDynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactGetCommand,
  TransactWriteCommand,
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
  map,
  pick
} from '@meltwater/phi'

import { createCache } from '../cache.js'
import { keysToCamelCase, keysToPascalCase } from '../case.js'

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

const createClient = createCache()

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
    const client = createClient(name, () => new AwsDynamoDBClient(params))
    this.db = client
    this.tableName = tableName
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

  async get(key, params = {}) {
    const log = this.#log.child({
      ...key,
      meta: params,
      method: DynamodbDocumentClient.prototype.get.name
    })

    try {
      log.info('start')
      this.#validateInputKeys(key)

      const req = this.#formatReq({ key, ...params })
      const command = new GetCommand(req)

      const res = await this.#client.send(command)

      const { item: data, ...rest } = formatRes(res)
      log.debug({ data, meta: rest }, 'data')
      log.info('end')
      return [data, rest]
    } catch (err) {
      log.error({ err }, 'fail')
      throw err
    }
  }

  async put(item, params = {}) {
    const key = pick([this.#hashKey, this.#rangeKey].filter(isNotNil), item)

    const log = this.#log.child({
      ...key,
      meta: params,
      method: DynamodbDocumentClient.prototype.put.name
    })
    try {
      log.info('start')
      log.debug({ data: item }, 'item')

      this.#validateInputKeys(item)

      const req = this.#formatReq({ item, ...params })
      const command = new PutCommand(req)

      const res = await this.#client.send(command)

      const data = formatRes(res)
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
      ...key,
      meta: params,
      method: DynamodbDocumentClient.prototype.update.name
    })
    try {
      log.info('start')
      this.#validateInputKeys(key)

      const req = this.#formatReq({ key, ...params })
      const command = new UpdateCommand(req)

      const res = await this.#client.send(command)

      const data = formatRes(res)

      log.debug({ data }, 'data')
      log.info('end')
      return data
    } catch (err) {
      log.error({ err }, 'fail')
      throw err
    }
  }

  async delete(key, params = {}) {
    const log = this.#log.child({
      ...key,
      meta: params,
      method: DynamodbDocumentClient.prototype.delete.name
    })
    try {
      log.info('start')
      this.#validateInputKeys(key)

      const req = this.#formatReq({ key, ...params })
      const command = new DeleteCommand(req)

      const res = await this.#client.send(command)

      const data = formatRes(res)

      log.debug({ data }, 'data')
      log.info('end')
      return data
    } catch (err) {
      log.error({ err }, 'fail')
      throw err
    }
  }

  async query(params = {}) {
    const log = this.#log.child({
      meta: params,
      method: DynamodbDocumentClient.prototype.query.name
    })
    try {
      log.info('start')

      const req = this.#formatReq(params)
      const command = new QueryCommand(req)

      const res = await this.#client.send(command)

      const { items: data, ...rest } = formatRes(res)
      log.debug({ data, meta: rest }, 'data')
      log.info('end')
      return [data, rest]
    } catch (err) {
      log.error({ err }, 'fail')
      throw err
    }
  }

  async transactGet(transactItems = [], params = {}) {
    const log = this.#log.child({
      meta: params,
      method: DynamodbDocumentClient.prototype.transactGet.name
    })

    try {
      log.info('start')

      const req = keysToPascalCase({
        transactItems: transactItems.map(this.#formatTransactItem),
        ...params
      })

      const command = new TransactGetCommand(req)

      const res = await this.#client.send(command)

      const [data, rest] = formatTransactGetRes(res)

      log.debug({ data, meta: rest }, 'data')
      log.info('end')
      return [data, rest]
    } catch (err) {
      log.error({ err }, 'fail')
      throw err
    }
  }

  async transactWrite(transactItems = [], params = {}) {
    const log = this.#log.child({
      meta: params,
      method: DynamodbDocumentClient.prototype.transactWrite.name
    })

    try {
      log.info('start')

      const req = keysToPascalCase({
        transactItems: transactItems.map(this.#formatTransactItem),
        ...params
      })

      const command = new TransactWriteCommand(req)

      const res = await this.#client.send(command)

      const [data, rest] = formatTransactWriteRes(res, transactItems)

      log.debug({ data, meta: rest }, 'data')
      log.info('end')
      return [data, rest]
    } catch (err) {
      log.error({ err }, 'fail')
      throw err
    }
  }

  #validateInputKeys = (input) => {
    if (notHave(this.#hashKey, input)) {
      throw new DynamodbMissingKeyError('hashKey', this.#hashKey)
    }

    if (isNotNil(this.#rangeKey) && notHave(this.#rangeKey, input)) {
      throw new DynamodbMissingKeyError('rangeKey', this.#rangeKey)
    }
  }

  #formatReq = (input) => {
    return { TableName: this.#tableName, ...keysToPascalCase(input) }
  }

  #formatTransactItem = (input) => {
    return keysToPascalCase(map(this.#formatReq, input))
  }
}

export class DynamodbMissingKeyError extends Error {
  constructor(keyType, keyName) {
    super(`Missing ${keyType} ${keyName}`)
    this.name = this.constructor.name
    this.code = 'err_dynamodb_missing_key'
    Error.captureStackTrace(this, this.constructor)
    this.keyType = keyType
    this.keyName = keyName
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
const formatRes = keysToCamelCase

const formatTransactGetRes = (res) => {
  const { Responses = [], ConsumedCapacity = [] } = res
  const data = Responses.map(formatRes).map(({ item }) => item)
  const rest = Responses.map((_, idx) => ({
    consumedCapacity: ConsumedCapacity[idx]
  }))
  return [data, rest]
}

const formatTransactWriteRes = (res, transactItems) => {
  const { ConsumedCapacity = [], ItemCollectionMetrics = {} } = res
  const data = transactItems.map((_, idx) => ({
    consumedCapacity: ConsumedCapacity[idx]
  }))
  return [data, { itemCollectionMetrics: ItemCollectionMetrics }]
}
