import {
  LambdaClient as AwsSdkLambdaClient,
  InvokeCommand
} from '@aws-sdk/client-lambda'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '@meltwater/mlabs-logger'
import { fromJson, toJson } from '@meltwater/phi'

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
      clientFunctionName: functionName,
      client: name,
      class: LambdaClient.name,
      reqId
    })
  }

  async invokeJson(input, params = {}) {
    const log = this.#log.child({
      meta: params,
      method: LambdaClient.prototype.invokeJson.name
    })
    try {
      log.info({ data: input }, 'start')

      const command = new InvokeCommand({
        Payload: encodePayload({ ...input, reqId: this.#reqId }),
        FunctionName: this.#functionName,
        ...params
      })

      const res = await this.#client.send(command)
      const statusCode = res.StatusCode

      checkStatusCode(statusCode)
      checkFunctionError(res)

      const data = decodePayload(res.Payload)
      log.debug({ data, statusCode }, 'data')
      log.info({ statusCode }, 'end')
      return data
    } catch (err) {
      log.error({ err }, 'fail')
      throw err
    }
  }
}

// NOTE: https://docs.amazonaws.cn/en_us/lambda/latest/dg/nodejs-exceptions.html
const checkStatusCode = (statusCode) => {
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
  const data = fromJson(res.Payload)
  const { errorType, errorMessage } = data
  const err = new Error(`Lambda function error: ${errorType}<${errorMessage}>`)
  err.data = data
  err.code = 'err_lambda_function'
  throw err
}

const encodePayload = (input) => {
  const data = toJson(input)
  return Buffer.from(data)
}

const decodePayload = (input) => {
  const data = Buffer.from(input)
  return fromJson(data)
}
