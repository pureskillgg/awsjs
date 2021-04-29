import {
  SQSClient as AwsSdkSQSClient,
  SendMessageCommand
} from '@aws-sdk/client-sqs'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '@meltwater/mlabs-logger'
import { pipe, renameKeys, toJson } from '@meltwater/phi'

import { keysToCamelCase, keysToPascalCase } from '../case.js'

export class SqsClient {
  #queueUrl
  #client
  #reqId
  #log

  constructor({
    queueUrl,
    name = 'sqs',
    reqId = uuidv4(),
    log = createLogger(),
    AwsSQSClient = AwsSdkSQSClient,
    params = {}
  }) {
    this.#queueUrl = queueUrl
    this.#client = new AwsSQSClient(params)
    this.#reqId = reqId
    this.#log = log.child({
      params,
      queueUrl,
      client: name,
      class: SqsClient.name,
      reqId
    })
  }

  async sendMessageJson(message, params = {}) {
    const messageId = uuidv4()
    const log = this.#log.child({
      messageId,
      meta: params,
      method: SqsClient.prototype.sendMessageJson.name
    })
    try {
      log.info('start')
      log.debug({ data: message }, 'message')

      const req = this.#formatReq({
        ...params,
        messageBody: toJson(message)
      })

      const command = new SendMessageCommand({
        ...req,
        MessageAttributes: {
          ...req.MessageAttributes,
          reqId: {
            DataType: 'String',
            StringValue: this.#reqId
          }
        }
      })

      const res = await this.#client.send(command)

      const data = formatMessageReceipt(res)

      log.debug({ data }, 'data')
      log.info('end')
      return data
    } catch (err) {
      log.error({ err }, 'fail')
      throw err
    }
  }

  #formatReq = (input) => {
    return keysToPascalCase({ ...input, queueUrl: this.#queueUrl })
  }
}

const formatRes = keysToCamelCase

const formatMessageReceipt = pipe(
  renameKeys({
    MD5OfMessageBody: 'md5OfMessageBody',
    MD5OfMessageAttributes: 'md5OfMessageAttributes',
    MD5OfMessageSystemAttributes: 'md5OfMessageSystemAttributes'
  }),
  formatRes
)
