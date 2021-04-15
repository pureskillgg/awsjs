import test from 'ava'
import * as td from 'testdouble'
import { createLogger } from '@meltwater/mlabs-logger'
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'

import { registerTestdoubleMatchers } from '../../testdouble-matchers.js'
import { S3Client } from './s3.js'

test.before(() => {
  registerTestdoubleMatchers(td)
})

test.beforeEach((t) => {
  t.context.AwsS3Client = td.constructor(['send'])

  t.context.createClient = (t) => {
    const client = new S3Client({
      AwsS3Client: t.context.AwsS3Client,
      bucket,
      reqId,
      log: createLogger({ t })
    })

    return client
  }
})

test('constructor: passes params to AWS S3', (t) => {
  const { AwsS3Client } = t.context
  const params = { foo: 'bar' }
  const client = new S3Client({
    AwsS3Client,
    bucket,
    params,
    log: createLogger({ t })
  })
  td.verify(new AwsS3Client(params))
  t.truthy(client)
})

test('putObjectJson: returns response', async (t) => {
  const { AwsS3Client, createClient } = t.context
  const client = createClient(t)
  const key = 'mock-key'
  const input = { foo: 2 }

  const Body = JSON.stringify(input)
  td.when(
    AwsS3Client.prototype.send(
      td.matchers.isAwsSdkCommand(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body,
          ContentType: 'application/json',
          Metadata: { 'req-id': reqId }
        })
      )
    )
  ).thenResolve(putObjectResponse)

  const data = await client.putObjectJson(key, input)

  t.deepEqual(data, putObjectResponseFormatted)
})

test('putObjectJson: passes params', async (t) => {
  const { AwsS3Client, createClient } = t.context
  const client = createClient(t)
  const key = 'mock-key'
  const input = { foo: 2 }

  const Body = JSON.stringify(input)
  td.when(
    AwsS3Client.prototype.send(
      td.matchers.isAwsSdkCommand(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body,
          ContentType: 'application/json',
          Bar: 2,
          Metadata: { 'req-id': reqId, baz: '5' }
        })
      )
    )
  ).thenResolve(putObjectResponse)

  const data = await client.putObjectJson(key, input, {
    Bar: 2,
    Metadata: { baz: '5' }
  })

  t.deepEqual(data, putObjectResponseFormatted)
})

test('putObjectJson: throws client error', async (t) => {
  const { AwsS3Client, createClient } = t.context
  const client = createClient(t)
  const err = new Error('foo')

  td.when(AwsS3Client.prototype.send(td.matchers.anything())).thenReject(err)

  await t.throwsAsync(() => client.putObjectJson({}), { is: err })
})

test('getObjectJson: returns response', async (t) => {
  const { AwsS3Client, createClient } = t.context
  const client = createClient(t)
  const key = 'mock-key'

  td.when(
    AwsS3Client.prototype.send(
      td.matchers.isAwsSdkCommand(
        new GetObjectCommand({ Bucket: bucket, Key: key })
      )
    )
  ).thenResolve(getObjectResponse)

  const data = await client.getObjectJson(key)

  t.deepEqual(data, {
    ...getObjectResponseFormatted,
    data: { foo: 2 }
  })
})

test('getObjectJson: passes params', async (t) => {
  const { AwsS3Client, createClient } = t.context
  const client = createClient(t)
  const key = 'mock-key'

  td.when(
    AwsS3Client.prototype.send(
      td.matchers.isAwsSdkCommand(
        new GetObjectCommand({ Bucket: bucket, Key: key, Bar: 2 })
      )
    )
  ).thenResolve(getObjectResponse)

  const data = await client.getObjectJson(key, { Bar: 2 })

  t.deepEqual(data, {
    ...getObjectResponseFormatted,
    data: { foo: 2 }
  })
})

test('getObjectJson: throws client error', async (t) => {
  const { AwsS3Client, createClient } = t.context
  const client = createClient(t)
  const err = new Error('foo')

  td.when(AwsS3Client.prototype.send(td.matchers.anything())).thenReject(err)

  await t.throwsAsync(() => client.getObjectJson({}), { is: err })
})

const bucket = 'mock-bucket'
const reqId = 'mock-req-id'

const putObjectResponse = {
  Location: 'mock-location',
  ETag: 'mock-etag',
  Bucket: 'mock-bucket',
  Key: 'mock-key'
}

const putObjectResponseFormatted = {
  location: 'mock-location',
  eTag: 'mock-etag',
  bucket: 'mock-bucket',
  key: 'mock-key'
}

const getObjectResponse = {
  Body: Buffer.from('{"foo":2}'),
  DeleteMarker: true,
  AcceptRanges: 'mock-accept-ranges',
  Expiration: 'mock-expiration',
  Restore: 'mock-restore',
  LastModified: new Date(0),
  ContentLength: 33,
  ETag: 'mock-etag',
  MissingMeta: 3,
  VersionId: 'mock-version-id',
  CacheControl: 'mock-cache-control',
  ContentDisposition: 'mock-content-disposition',
  ContentEncoding: 'mock-content-encoding',
  ContentLanguage: 'mock-content-language',
  ContentRange: 'mock-content-range',
  ContentType: 'mock-content-type',
  Expires: new Date(1),
  WebsiteRedirectLocation: 'mock-website-redirect-location',
  ServerSideEncryption: 'mock-server-side-encryption',
  Metadata: { 'req-id': 'res-req-id' },
  SSECustomerAlgorithm: 'mock-sse-customer-algorithm',
  SSECustomerKeyMD5: 'mock-sse-customer-key-md5',
  SSEKMSKeyId: 'mock-sse-kms-key-id',
  BucketKeyEnabled: false,
  StorageClass: 'mock-storage-class',
  RequestCharged: 'mock-request-charged',
  ReplicationStatus: 'mock-replication-status',
  PartsCount: 4,
  TagCount: 7,
  ObjectLockMode: 'mock-object-lock-mode',
  ObjectLockRetainUntilDate: new Date(1),
  ObjectLockLegalHoldStatus: 'mock-object-lock-legal-hold-status'
}

const getObjectResponseFormatted = {
  body: Buffer.from('{"foo":2}'),
  deleteMarker: true,
  acceptRanges: 'mock-accept-ranges',
  expiration: 'mock-expiration',
  restore: 'mock-restore',
  lastModified: new Date(0),
  contentLength: 33,
  eTag: 'mock-etag',
  missingMeta: 3,
  versionId: 'mock-version-id',
  cacheControl: 'mock-cache-control',
  contentDisposition: 'mock-content-disposition',
  contentEncoding: 'mock-content-encoding',
  contentLanguage: 'mock-content-language',
  contentRange: 'mock-content-range',
  contentType: 'mock-content-type',
  expires: new Date(1),
  websiteRedirectLocation: 'mock-website-redirect-location',
  serverSideEncryption: 'mock-server-side-encryption',
  metadata: { 'req-id': 'res-req-id' },
  sseCustomerAlgorithm: 'mock-sse-customer-algorithm',
  sseCustomerKeyMd5: 'mock-sse-customer-key-md5',
  sseKmsKeyId: 'mock-sse-kms-key-id',
  bucketKeyEnabled: false,
  storageClass: 'mock-storage-class',
  requestCharged: 'mock-request-charged',
  replicationStatus: 'mock-replication-status',
  partsCount: 4,
  tagCount: 7,
  objectLockMode: 'mock-object-lock-mode',
  objectLockRetainUntilDate: new Date(1),
  objectLockLegalHoldStatus: 'mock-object-lock-legal-hold-status'
}
