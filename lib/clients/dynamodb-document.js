import AWS from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '@meltwater/mlabs-logger'
import {
  both,
  complement,
  has,
  isNonEmptyString,
  isNotNil
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
    name = 'sqs',
    reqId = uuidv4(),
    log = createLogger(),
    DynamoDBDocumentClient,
    params = {}
  }) {
    validateHashAndRangeKeys(hashKey, rangeKey)
    const defaultParams = { TableName: tableName, ...params }
    const Client = DynamoDBDocumentClient || AWS.DynamoDB.DocumentClient
    this.#hashKey = hashKey
    this.#rangeKey = rangeKey
    this.#client = new Client({ params: defaultParams })
    this.#reqId = reqId
    this.#log = log.child({
      defaultParams,
      client: name,
      class: 'DynamodbDocumentClient',
      reqId
    })
  }

  #validateInputHasKeys(input) {
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
