import AWS from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '@meltwater/mlabs-logger'
import { fromJson, toJson } from '@meltwater/phi'

export class S3Client {
  #client
  #reqId
  #log

  constructor({
    bucket,
    name = 's3',
    reqId = uuidv4(),
    log = createLogger(),
    S3,
    params = {}
  }) {
    const defaultParams = { Bucket: bucket, ...params }
    const Client = S3 || AWS.S3
    this.#client = new Client({ params: defaultParams })
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

const formatGetObjectRes = (res) => ({
  body: res.Body,
  deleteMarker: res.DeleteMarker,
  acceptRanges: res.AcceptRanges,
  expiration: res.Expiration,
  restore: res.Restore,
  lastModified: res.LastModified,
  contentLength: res.ContentLength,
  eTag: res.ETag,
  missingMeta: res.MissingMeta,
  versionId: res.VersionId,
  cacheControl: res.CacheControl,
  contentDisposition: res.ContentDisposition,
  contentEncoding: res.ContentEncoding,
  contentLanguage: res.ContentLanguage,
  contentRange: res.ContentRange,
  contentType: res.ContentType,
  expires: res.Expires,
  websiteRedirectLocation: res.WebsiteRedirectLocation,
  serverSideEncryption: res.ServerSideEncryption,
  metadata: res.Metadata,
  sseCustomerAlgorithm: res.SSECustomerAlgorithm,
  sseCustomerKeyMd5: res.SSECustomerKeyMD5,
  sseKmsKeyId: res.SSEKMSKeyId,
  bucketKeyEnabled: res.BucketKeyEnabled,
  storageClass: res.StorageClass,
  requestCharged: res.RequestCharged,
  replicationStatus: res.ReplicationStatus,
  partsCount: res.PartsCount,
  tagCount: res.TagCount,
  objectLockMode: res.ObjectLockMode,
  objectLockRetainUntilDate: res.ObjectLockRetainUntilDate,
  objectLockLegalHoldStatus: res.ObjectLockLegalHoldStatus
})
