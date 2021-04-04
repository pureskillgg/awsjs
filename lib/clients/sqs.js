import {
  SQSClient as AwsSdkSQSClient,
  SendMessageCommand
} from '@aws-sdk/client-sqs'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '@meltwater/mlabs-logger'
import { renameKeys, toJson } from '@meltwater/phi'

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
      clientQueueUrl: queueUrl,
      client: name,
      class: SqsClient.name,
      reqId
    })
  }

  async sendMessageJson(input, params = {}) {
    const log = this.#log.child({
      meta: params,
      method: SqsClient.prototype.sendMessageJson.name
    })
    try {
      log.info({ data: input }, 'start')

      const command = new SendMessageCommand({
        QueueUrl: this.#queueUrl,
        MessageBody: toJson(input),
        ...params,
        MessageAttributes: {
          ...params.MessageAttributes,
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
}

const formatMessageReceipt = renameKeys({
  MD5OfMessageBody: 'md5OfMessageBody',
  MD5OfMessageAttributes: 'md5OfMessageAttributes',
  MD5OfMessageSystemAttributes: 'md5OfMessageSystemAttributes',
  MessageId: 'messageId',
  SequenceNumber: 'sequenceNumber'
})
