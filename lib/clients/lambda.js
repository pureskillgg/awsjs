import {
  LambdaClient as AwsSdkLambdaClient,
  InvokeCommand
} from '@aws-sdk/client-lambda'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '@meltwater/mlabs-logger'
import { fromJson, toJson } from '@meltwater/phi'

import { keysToCamelCase, keysToPascalCase } from '../case.js'

export class LambdaClient {
  #functionName
  #client
  #reqId
  #log

  constructor({
    functionName,
    name = 'lambda',
    reqId = uuidv4(),
    log = createLogger(),
    AwsLambdaClient = AwsSdkLambdaClient,
    params = {}
  }) {
    this.#functionName = functionName
    this.#client = new AwsLambdaClient(params)
    this.#reqId = reqId
    this.#log = log.child({
      params,
      functionName,
      client: name,
      class: LambdaClient.name,
      reqId
    })
  }

  async invokeJson(payload, params = {}) {
    const invokeId = uuidv4()
    const log = this.#log.child({
      invokeId,
      meta: params,
      method: LambdaClient.prototype.invokeJson.name
    })
    try {
      log.info('start')
      log.debug({ data: payload }, 'payload')

      const req = this.#formatReq({
        payload: this.#encodePayload(payload),
        ...params
      })
      const command = new InvokeCommand(req)

      const res = await this.#client.send(command)
      const statusCode = res.StatusCode

      checkStatusCode(res)
      checkFunctionError(res)

      const { payload: Payload, ...rest } = formatRes(res)
      const data = decodePayload(Payload)
      log.debug({ data, statusCode, meta: rest }, 'data')
      log.info({ statusCode }, 'end')
      return data
    } catch (err) {
      log.error({ err }, 'fail')
      throw err
    }
  }

  #formatReq = (input) => {
    return keysToPascalCase({ ...input, functionName: this.#functionName })
  }

  #encodePayload = (payload) => {
    const data = toJson({ ...payload, reqId: this.#reqId })
    return Buffer.from(data)
  }
}

export class LambdaStatusCodeError extends Error {
  constructor(res) {
    const statusCode = res.StatusCode
    super(`Status code error: ${statusCode}`)
    this.name = this.constructor.name
    this.code = 'err_lambda_status_code'
    Error.captureStackTrace(this, this.constructor)
    this.statusCode = statusCode
  }
}

export class LambdaFunctionError extends Error {
  constructor(res) {
    const payload = decodePayload(res.Payload)
    const { errorType, errorMessage } = payload
    super(`Lambda function error: ${errorType}<${errorMessage}>`)
    this.name = this.constructor.name
    this.code = 'err_lambda_function_error'
    Error.captureStackTrace(this, this.constructor)
    this.data = payload
  }
}

const checkStatusCode = (res) => {
  const statusCode = res.StatusCode
  // UPSTREAM: https://github.com/aws/aws-sdk-js-v3/issues/2021
  if (statusCode == null) return
  const is200StatusCode = statusCode > 199 && statusCode < 300
  if (is200StatusCode) return
  throw new LambdaStatusCodeError(res)
}

const checkFunctionError = (res) => {
  if (!res.FunctionError) return
  throw new LambdaFunctionError(res)
}

const decodePayload = (input) => {
  const data = Buffer.from(input)
  return fromJson(data)
}

const formatRes = keysToCamelCase
