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
    const log = this.#log.child({
      meta: params,
      method: LambdaClient.prototype.invokeJson.name
    })
    try {
      log.info({ data: payload }, 'start')

      const req = this.#formatReq({
        payload: this.#encodePayload(payload),
        ...params
      })
      const command = new InvokeCommand(req)

      const res = await this.#client.send(command)
      const statusCode = res.StatusCode

      checkStatusCode(statusCode)
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

  #encodePayload = (input) => {
    const data = toJson({ ...input, reqId: this.#reqId })
    return Buffer.from(data)
  }
}

// NOTE: https://docs.amazonaws.cn/en_us/lambda/latest/dg/nodejs-exceptions.html
const checkStatusCode = (statusCode) => {
  // UPSTREAM: https://github.com/aws/aws-sdk-js-v3/issues/2021
  if (statusCode == null) return

  const is200StatusCode = statusCode > 199 && statusCode < 300

  if (is200StatusCode) return

  const err = new Error(`Status code error: ${statusCode}`)
  err.statusCode = statusCode
  err.code = 'err_lambda_status_code'
  throw err
}

// NOTE: https://docs.amazonaws.cn/en_us/lambda/latest/dg/nodejs-exceptions.html
const checkFunctionError = (res) => {
  if (!res.FunctionError) return
  const data = decodePayload(res.Payload)
  const { errorType, errorMessage } = data
  const err = new Error(`Lambda function error: ${errorType}<${errorMessage}>`)
  err.data = data
  err.code = 'err_lambda_function'
  throw err
}

const decodePayload = (input) => {
  const data = Buffer.from(input)
  return fromJson(data)
}

const formatRes = keysToCamelCase
