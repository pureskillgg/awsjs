import {
  S3Client as AwsSdkS3Client,
  GetObjectCommand,
  PutObjectCommand
} from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '@meltwater/mlabs-logger'
import { fromJson, renameKeys, toJson } from '@meltwater/phi'

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
    this.#client = new AwsS3Client(params)
    this.#reqId = reqId
    this.#log = log.child({
      bucket,
      client: name,
      class: S3Client.name,
      reqId
    })
  }

  async putObjectJson(key, input, params = {}) {
    const log = this.#log.child({
      meta: { key, ...params },
      method: S3Client.prototype.putObjectJson.name
    })
    try {
      log.info({ data: input }, 'start')

      const command = new PutObjectCommand({
        Bucket: this.#bucket,
        Key: key,
        Body: toJson(input),
        ContentType: 'application/json',
        ...params,
        Metadata: {
          ...params.Metadata,
          'req-id': this.#reqId
        }
      })

      const res = await this.#client.send(command)

      const data = formatPutObjectResponse(res)

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
      meta: { key, ...params },
      method: S3Client.prototype.getObjectJson.name
    })
    try {
      log.info('start')

      const command = new GetObjectCommand({
        Bucket: this.#bucket,
        Key: key,
        ...params
      })

      const res = await this.#client.send(command)

      const formattedRes = formatGetObjectRes(res)
      const data = { ...formattedRes, data: fromJson(formattedRes.body) }

      log.debug({ data }, 'data')
      log.info('end')
      return data
    } catch (err) {
      log.error({ err }, 'fail')
      throw err
    }
  }
}

const formatPutObjectResponse = (res) => ({
  location: res.Location,
  eTag: res.ETag,
  bucket: res.Bucket,
  key: res.Key
})

const formatGetObjectRes = renameKeys({
  Body: 'body',
  DeleteMarker: 'deleteMarker',
  AcceptRanges: 'acceptRanges',
  Expiration: 'expiration',
  Restore: 'restore',
  LastModified: 'lastModified',
  ContentLength: 'contentLength',
  ETag: 'eTag',
  MissingMeta: 'missingMeta',
  VersionId: 'versionId',
  CacheControl: 'cacheControl',
  ContentDisposition: 'contentDisposition',
  ContentEncoding: 'contentEncoding',
  ContentLanguage: 'contentLanguage',
  ContentRange: 'contentRange',
  ContentType: 'contentType',
  Expires: 'expires',
  WebsiteRedirectLocation: 'websiteRedirectLocation',
  ServerSideEncryption: 'serverSideEncryption',
  Metadata: 'metadata',
  SSECustomerAlgorithm: 'sseCustomerAlgorithm',
  SSECustomerKeyMD5: 'sseCustomerKeyMd5',
  SSEKMSKeyId: 'sseKmsKeyId',
  BucketKeyEnabled: 'bucketKeyEnabled',
  StorageClass: 'storageClass',
  RequestCharged: 'requestCharged',
  ReplicationStatus: 'replicationStatus',
  PartsCount: 'partsCount',
  TagCount: 'tagCount',
  ObjectLockMode: 'objectLockMode',
  ObjectLockRetainUntilDate: 'objectLockRetainUntilDate',
  ObjectLockLegalHoldStatus: 'objectLockLegalHoldStatus'
})
