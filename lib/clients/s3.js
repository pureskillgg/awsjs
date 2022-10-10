import { promisify } from 'util'
import { gunzip, gzip } from 'zlib'

import getStream from 'get-stream'
import {
  S3Client as AwsSdkS3Client,
  GetObjectCommand,
  PutObjectCommand
} from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '@meltwater/mlabs-logger'
import {
  both,
  compose,
  equals,
  fromJson,
  head,
  isNotNil,
  pipe,
  renameKeys,
  split,
  toJson,
  trim
} from '@meltwater/phi'

import { createCache } from '../cache.js'
import { keysToCamelCase, keysToPascalCase } from '../case.js'

const gzipAsync = promisify(gzip)
const gunzipAsync = promisify(gunzip)

const createClient = createCache()

export class S3Client {
  #bucket
  #client
  #reqId
  #log

  constructor({
    bucket,
    name = 's3',
    reqId = uuidv4(),
    log = createLogger(),
    AwsS3Client = AwsSdkS3Client,
    params = {}
  }) {
    this.#bucket = bucket
    this.#client = createClient(name, () => new AwsS3Client(params))
    this.#reqId = reqId
    this.#log = log.child({
      bucket,
      client: name,
      class: S3Client.name,
      reqId
    })
  }

  async putObjectJson(key, body, params = {}) {
    const log = this.#log.child({
      key,
      meta: params,
      method: S3Client.prototype.putObjectJson.name
    })
    try {
      log.info('start')
      log.debug({ data: body }, 'body')

      let Body = toJson(body)
      const { contentEncoding } = this.#formatReq(params)
      if (isGzipped(contentEncoding)) {
        Body = await gzipAsync(Body)
      }

      const req = this.#formatReq({
        key,
        Body,
        ContentType: 'application/json',
        ...params
      })

      const command = new PutObjectCommand({
        ...req,
        Metadata: {
          ...req.Metadata,
          'req-id': this.#reqId
        }
      })

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

  async getObjectJson(key, params = {}) {
    const log = this.#log.child({
      key,
      meta: params,
      method: S3Client.prototype.getObjectJson.name
    })
    try {
      log.info('start')

      const req = this.#formatReq({ key, ...params })
      const command = new GetObjectCommand(req)

      const res = await this.#client.send(command)

      const formattedRes = formatGetObjectRes(res)

      let Body = await getStream.buffer(res.Body)
      const { ContentEncoding } = res
      if (isGzipped(ContentEncoding)) {
        Body = await gunzipAsync(Body)
      }

      const data = {
        ...formattedRes,
        body: Body,
        data: fromJson(Body.toString())
      }

      log.debug({ data }, 'data')
      log.info('end')
      return data
    } catch (err) {
      log.error({ err }, 'fail')
      throw err
    }
  }

  #formatReq = (input) => {
    return keysToPascalCase({ ...input, Bucket: this.#bucket })
  }
}

const formatRes = keysToCamelCase

const formatGetObjectRes = pipe(
  renameKeys({
    SSECustomerAlgorithm: 'sseCustomerAlgorithm',
    SSECustomerKeyMD5: 'sseCustomerKeyMd5',
    SSEKMSKeyId: 'sseKmsKeyId'
  }),
  formatRes
)

const isGzipped = both(
  isNotNil,
  compose(equals('gzip'), trim, head, split(','))
)
