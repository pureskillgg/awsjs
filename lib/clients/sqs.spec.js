import test from 'ava'
import * as td from 'testdouble'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '@meltwater/mlabs-logger'
import { SendMessageCommand } from '@aws-sdk/client-sqs'

import { registerTestdoubleMatchers } from '../../testdouble-matchers.js'

import { SqsClient } from './sqs.js'

test.before(() => {
  registerTestdoubleMatchers(td)
})

test.beforeEach((t) => {
  t.context.AwsSQSClient = td.constructor(['send'])

  t.context.createClient = (t) => {
    const client = new SqsClient({
      name: uuidv4(),
      AwsSQSClient: t.context.AwsSQSClient,
      queueUrl,
      reqId,
      log: createLogger({ t })
    })

    return client
  }
})

test('constructor: passes params to AWS SQSClient', (t) => {
  const { AwsSQSClient } = t.context
  const params = { foo: 'bar' }
  const client = new SqsClient({
    name: uuidv4(),
    AwsSQSClient,
    queueUrl,
    params,
    log: createLogger({ t })
  })
  td.verify(new AwsSQSClient(params))
  t.truthy(client)
})

test('sendMessageJson: returns response', async (t) => {
  const { AwsSQSClient, createClient } = t.context
  const client = createClient(t)
  const input = { foo: 2 }

  const MessageBody = JSON.stringify(input)
  td.when(
    AwsSQSClient.prototype.send(
      td.matchers.isAwsSdkCommand(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody,
          MessageAttributes: {
            reqId: { DataType: 'String', StringValue: reqId }
          }
        })
      )
    )
  ).thenResolve(messageReceipt)

  const data = await client.sendMessageJson(input)

  t.deepEqual(data, messageReceiptFormatted)
})

test('sendMessageJson: passes params', async (t) => {
  const { AwsSQSClient, createClient } = t.context
  const client = createClient(t)
  const input = { foo: 2 }

  const MessageBody = JSON.stringify(input)
  td.when(
    AwsSQSClient.prototype.send(
      td.matchers.isAwsSdkCommand(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody,
          MessageAttributes: {
            reqId: { DataType: 'String', StringValue: reqId },
            baz: { DataType: 'String', StringValue: '4' }
          },
          Bar: 3
        })
      )
    )
  ).thenResolve(messageReceipt)

  const data = await client.sendMessageJson(input, {
    bar: 3,
    MessageAttributes: { baz: { DataType: 'String', StringValue: '4' } }
  })

  t.deepEqual(data, messageReceiptFormatted)
})

test('sendMessageJson: throws error from client', async (t) => {
  const { AwsSQSClient, createClient } = t.context
  const client = createClient(t)
  const err = new Error('foo')

  td.when(AwsSQSClient.prototype.send(td.matchers.anything())).thenReject(err)

  await t.throwsAsync(() => client.sendMessageJson({}), { is: err })
})

const queueUrl = 'mock-queue-url'
const reqId = 'mock-req-id'

const messageReceipt = {
  MD5OfMessageBody: 'mock-md5-of-message-body',
  MD5OfMessageAttributes: 'mock-md5-of-message-attributes',
  MD5OfMessageSystemAttributes: 'mock-md5-of-message-system-attributes',
  MessageId: 'mock-message-id',
  SequenceNumber: 'mock-sequence-number'
}

const messageReceiptFormatted = {
  md5OfMessageBody: 'mock-md5-of-message-body',
  md5OfMessageAttributes: 'mock-md5-of-message-attributes',
  md5OfMessageSystemAttributes: 'mock-md5-of-message-system-attributes',
  messageId: 'mock-message-id',
  sequenceNumber: 'mock-sequence-number'
}
