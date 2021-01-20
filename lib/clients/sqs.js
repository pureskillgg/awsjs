import AWS from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '@meltwater/mlabs-logger'
import { renameKeys, toJson } from '@meltwater/phi'

export class SqsClient {
  #client
  #reqId
  #log

  constructor({
    queueUrl,
    name = 'sqs',
    reqId = uuidv4(),
    log = createLogger(),
    SQS = AWS.SQS,
    params = {}
  }) {
    const defaultParams = { QueueUrl: queueUrl, ...params }
    this.#client = new SQS({ params: defaultParams })
    this.#reqId = reqId
    this.#log = log.child({
      defaultParams,
      client: name,
      class: 'SqsClient',
      reqId
    })
  }

  async sendMessageJson(input, params = {}) {
    const log = this.#log.child({
      meta: params,
      method: 'sendMessageJson'
    })
    try {
      log.info({ data: input }, 'start')

      const req = {
        MessageBody: toJson(input),
        ...params,
        MessageAttributes: {
          ...params.MessageAttributes,
          reqId: {
            DataType: 'String',
            StringValue: this.#reqId
          }
        }
      }

      const res = await this.#client.sendMessage(req).promise()

      const data = formatMessageReceipt(res)

      log.debug({ data }, 'data')
      log.info('end')
      return data
    } catch (err) {
      log.error({ err }, 'fail')
      throw err
    }
  }
}

const formatMessageReceipt = renameKeys({
  MD5OfMessageBody: 'md5OfMessageBody',
  MD5OfMessageAttributes: 'md5OfMessageAttributes',
  MD5OfMessageSystemAttributes: 'md5OfMessageSystemAttributes',
  MessageId: 'messageId',
  SequenceNumber: 'sequenceNumber'
})
