import AWS from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '@meltwater/mlabs-logger'
import { fromJson, renameKeys, toJson } from '@meltwater/phi'

export class S3Client {
  #client
  #reqId
  #log

  constructor({
    bucket,
    name = 's3',
    reqId = uuidv4(),
    log = createLogger(),
    S3 = AWS.S3,
    params = {}
  }) {
    const defaultParams = { Bucket: bucket, ...params }
    this.#client = new S3({ params: defaultParams })
    this.#reqId = reqId
    this.#log = log.child({
      defaultParams,
      client: name,
      class: 'S3Client',
      reqId
    })
  }

  async uploadJson(key, input, params = {}) {
    const log = this.#log.child({
      meta: { key, ...params },
      method: 'uploadJson'
    })
    try {
      log.info({ data: input }, 'start')

      const req = {
        Key: key,
        Body: toJson(input),
        ContentType: 'application/json',
        ...params,
        Metadata: {
          ...params.Metadata,
          'request-id': this.#reqId
        }
      }

      const res = await this.#client.upload(req).promise()

      const data = formatUploadResponse(res)

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
      method: 'getObjectJson'
    })
    try {
      log.info('start')

      const req = {
        Key: key,
        ...params
      }

      const res = await this.#client.getObject(req).promise()

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

const formatUploadResponse = (res) => ({
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
