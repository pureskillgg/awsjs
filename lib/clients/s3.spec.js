import test from 'ava'
import * as td from 'testdouble'
import { createLogger } from '@meltwater/mlabs-logger'

import { S3Client } from './s3.js'

test.beforeEach((t) => {
  t.context.S3 = td.constructor(['getObject', 'upload'])

  t.context.createClient = (t) => {
    const client = new S3Client({
      S3: t.context.S3,
      reqId,
      log: createLogger({ t })
    })

    return client
  }
})

test('constructor: passes functionName to AWS S3', (t) => {
  const { S3 } = t.context
  const bucket = 'some-bucket'
  const client = new S3Client({
    S3,
    bucket,
    log: createLogger({ t })
  })
  td.verify(new S3({ params: { Bucket: bucket } }))
  t.truthy(client)
})

test('constructor: passes params to AWS S3', (t) => {
  const { S3 } = t.context
  const bucket = 'some-bucket'
  const params = { foo: 'bar' }
  const client = new S3Client({
    S3,
    bucket,
    params,
    log: createLogger({ t })
  })
  td.verify(new S3({ params: { ...params, Bucket: bucket } }))
  t.truthy(client)
})

test('uploadJson: returns response', async (t) => {
  const { S3, createClient } = t.context
  const client = createClient(t)
  const promise = td.func()
  const key = 'some-key'
  const input = { foo: 2 }

  const Body = JSON.stringify(input)
  td.when(
    S3.prototype.upload({
      Key: key,
      Body,
      ContentType: 'application/json',
      Metadata: { 'request-id': reqId }
    })
  ).thenReturn({ promise })

  td.when(promise()).thenResolve(uploadResponse)

  const data = await client.uploadJson(key, input)

  t.deepEqual(data, uploadResponseFormatted)
})

test('uploadJson: passes params', async (t) => {
  const { S3, createClient } = t.context
  const client = createClient(t)
  const promise = td.func()
  const key = 'some-key'
  const input = { foo: 2 }

  const Body = JSON.stringify(input)
  td.when(
    S3.prototype.upload({
      Key: key,
      Body,
      ContentType: 'application/json',
      Bar: 2,
      Metadata: { 'request-id': reqId, baz: '5' }
    })
  ).thenReturn({ promise })

  td.when(promise()).thenResolve(uploadResponse)

  const data = await client.uploadJson(key, input, {
    Bar: 2,
    Metadata: { baz: '5' }
  })

  t.deepEqual(data, uploadResponseFormatted)
})

test('uploadJson: throws client error', async (t) => {
  const { S3, createClient } = t.context
  const client = createClient(t)
  const promise = td.func()
  const err = new Error('foo')

  td.when(S3.prototype.upload(td.matchers.anything())).thenReturn({
    promise
  })
  td.when(promise()).thenReject(err)

  await t.throwsAsync(() => client.uploadJson({}), { is: err })
})

test('getObjectJson: returns response', async (t) => {
  const { S3, createClient } = t.context
  const client = createClient(t)
  const promise = td.func()
  const key = 'some-key'

  td.when(S3.prototype.getObject({ Key: key })).thenReturn({ promise })

  td.when(promise()).thenResolve(getObjectResponse)

  const data = await client.getObjectJson(key)

  t.deepEqual(data, {
    ...getObjectResponseFormatted,
    data: { foo: 2 }
  })
})

test('getObjectJson: passes params', async (t) => {
  const { S3, createClient } = t.context
  const client = createClient(t)
  const promise = td.func()
  const key = 'some-key'

  td.when(S3.prototype.getObject({ Key: key, Bar: 2 })).thenReturn({ promise })

  td.when(promise()).thenResolve(getObjectResponse)

  const data = await client.getObjectJson(key, { Bar: 2 })

  t.deepEqual(data, {
    ...getObjectResponseFormatted,
    data: { foo: 2 }
  })
})

test('getObjectJson: throws client error', async (t) => {
  const { S3, createClient } = t.context
  const client = createClient(t)
  const promise = td.func()
  const err = new Error('foo')

  td.when(S3.prototype.getObject(td.matchers.anything())).thenReturn({
    promise
  })
  td.when(promise()).thenReject(err)

  await t.throwsAsync(() => client.getObjectJson({}), { is: err })
})

const reqId = 'some-req-id'

const uploadResponse = {
  Location: 'some-location',
  ETag: 'some-etag',
  Bucket: 'some-bucket',
  Key: 'some-key'
}

const uploadResponseFormatted = {
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
  Metadata: { 'request-id': 'res-req-id' },
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
  metadata: { 'request-id': 'res-req-id' },
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
