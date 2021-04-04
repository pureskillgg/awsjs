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
  const key = 'some-key'
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
  const key = 'some-key'
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
  const key = 'some-key'

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
  const key = 'some-key'

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

const bucket = 'some-bucket'
const reqId = 'some-req-id'

const putObjectResponse = {
  Location: 'some-location',
  ETag: 'some-etag',
  Bucket: 'some-bucket',
  Key: 'some-key'
}

const putObjectResponseFormatted = {
  location: 'some-location',
  eTag: 'some-etag',
  bucket: 'some-bucket',
  key: 'some-key'
}

const getObjectResponse = {
  Body: Buffer.from('{"foo":2}'),
  DeleteMarker: true,
  AcceptRanges: 'some-accept-ranges',
  Expiration: 'some-expiration',
  Restore: 'some-restore',
  LastModified: new Date(0),
  ContentLength: 33,
  ETag: 'some-etag',
  MissingMeta: 3,
  VersionId: 'some-version-id',
  CacheControl: 'some-cache-control',
  ContentDisposition: 'some-content-disposition',
  ContentEncoding: 'some-content-encoding',
  ContentLanguage: 'some-content-language',
  ContentRange: 'some-content-range',
  ContentType: 'some-content-type',
  Expires: new Date(1),
  WebsiteRedirectLocation: 'some-website-redirect-location',
  ServerSideEncryption: 'some-server-side-encryption',
  Metadata: { 'req-id': 'res-req-id' },
  SSECustomerAlgorithm: 'some-sse-customer-algorithm',
  SSECustomerKeyMD5: 'some-sse-customer-key-md5',
  SSEKMSKeyId: 'some-sse-kms-key-id',
  BucketKeyEnabled: false,
  StorageClass: 'some-storage-class',
  RequestCharged: 'some-request-charged',
  ReplicationStatus: 'some-replication-status',
  PartsCount: 4,
  TagCount: 7,
  ObjectLockMode: 'some-object-lock-mode',
  ObjectLockRetainUntilDate: new Date(1),
  ObjectLockLegalHoldStatus: 'some-object-lock-legal-hold-status'
}

const getObjectResponseFormatted = {
  body: Buffer.from('{"foo":2}'),
  deleteMarker: true,
  acceptRanges: 'some-accept-ranges',
  expiration: 'some-expiration',
  restore: 'some-restore',
  lastModified: new Date(0),
  contentLength: 33,
  eTag: 'some-etag',
  missingMeta: 3,
  versionId: 'some-version-id',
  cacheControl: 'some-cache-control',
  contentDisposition: 'some-content-disposition',
  contentEncoding: 'some-content-encoding',
  contentLanguage: 'some-content-language',
  contentRange: 'some-content-range',
  contentType: 'some-content-type',
  expires: new Date(1),
  websiteRedirectLocation: 'some-website-redirect-location',
  serverSideEncryption: 'some-server-side-encryption',
  metadata: { 'req-id': 'res-req-id' },
  sseCustomerAlgorithm: 'some-sse-customer-algorithm',
  sseCustomerKeyMd5: 'some-sse-customer-key-md5',
  sseKmsKeyId: 'some-sse-kms-key-id',
  bucketKeyEnabled: false,
  storageClass: 'some-storage-class',
  requestCharged: 'some-request-charged',
  replicationStatus: 'some-replication-status',
  partsCount: 4,
  tagCount: 7,
  objectLockMode: 'some-object-lock-mode',
  objectLockRetainUntilDate: new Date(1),
  objectLockLegalHoldStatus: 'some-object-lock-legal-hold-status'
}
