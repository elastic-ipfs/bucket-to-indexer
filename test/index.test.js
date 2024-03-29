'use strict'

const t = require('tap')
const { handler, createBucketToIndexerLambda } = require('../src/index')
const { createS3URL } = require('../src/aws')
const { trackSQSUsages, trackSNSUsages } = require('./utils/mock')
const config = require('../src/config')

t.test('lambda handles event', async t => {
  trackSQSUsages(t)
  trackSNSUsages(t)
  const eventsTopic = config.defaultEventsTopicArn
  const rand1 = Math.random().toString().slice(2)
  const s3Bucket = `${rand1}-bucket`
  const s3Key = `${rand1}-seg1/${rand1}-seg2.car`
  const event = createExampleLambdaEvent({ s3Bucket, s3Key })
  const handler = createBucketToIndexerLambda({ eventsTopic })

  await handler(event)

  t.equal(t.context.sns.publishes.length, 1)
  t.equal(t.context.sns.publishes[0].TopicArn, eventsTopic)
  const snsMessage = JSON.parse(t.context.sns.publishes[0].Message)
  t.equal(snsMessage.type, 'IndexerNotified')
  t.equal(snsMessage.uri, createS3URL(s3Bucket, s3Key).toString())
  t.equal(isNaN(Date.parse(snsMessage.startTime)), false, 'sns message startTime is a parseable date')
  t.equal(t.context.sqs.publishes.length, 1)
})

t.test('lambda doesnt error on event with unusual events', async t => {
  trackSQSUsages(t)
  trackSNSUsages(t)
  await handler(createExampleLambdaEvent({ eventSource: 'foo' }))
  await handler(createExampleLambdaEvent({ snsMessage: 'abc{x:' }))
  await handler(createExampleLambdaEvent({ snsMessage: '{}' }))
})

t.test('lambda logs error when sqsClient.send throws', async t => {
  trackSQSUsages(t)
  const event = createExampleLambdaEvent()
  const { logger, logs } = createStubbedLogger()
  const fakeSqsError = new Error('fake sqs error')
  const sqsClient = createErroringClient(fakeSqsError)
  const handler = createBucketToIndexerLambda({
    logger,
    sqsClient
  })
  try {
    await handler(event)
  } catch (error) {
    if (error.message !== fakeSqsError.message) {
      throw error
    }
  }
  t.match(logs.error[0][0], /Cannot send message .+ to indexerQueue:/)
})

t.test('lambda logs error when eventsTopicClient.send throws', async t => {
  trackSQSUsages(t)
  trackSNSUsages(t)
  const event = createExampleLambdaEvent()
  const { logger, logs } = createStubbedLogger()
  const fakeError = new Error('fake error ' + Math.random())
  const eventsTopicClient = createErroringClient(fakeError)
  const handler = createBucketToIndexerLambda({
    logger,
    eventsTopicClient
  })
  try {
    await handler(event)
  } catch (error) {
    if (error.message !== fakeError.message) {
      throw error
    }
  }
  t.match(logs.error[0][0], fakeError.message)
})

/**
 * Create an example event that the main lambda handler should work with
 */
function createExampleLambdaEvent({
  eventSource = 'aws:s3',
  s3Bucket = 'mys3bucket',
  s3Key = 'mys3key.car',
  snsMessage = JSON.stringify({
    Records: [{
      awsRegion: 'us-west-2',
      eventSource,
      eventName: 'ObjectCreated',
      s3: {
        bucket: {
          name: s3Bucket
        },
        object: {
          key: s3Key
        }
      }
    }]
  })
} = {}) {
  return {
    Records: [{
      Sns: {
        Message: snsMessage
      }
    }]
  }
}

/**
 * Create something that looks like an aws Client, but throws an error for each command send
 * @param {*} fakeError - error to be thrown on send
 * @returns {{ send: (command: any) => Promise<void> }}
 */
function createErroringClient(fakeError) {
  const client = {
    async send(command) {
      throw fakeError
    }
  }
  return client
}

/**
 * Create a stubbed logger that keeps track of all log calls
 * @returns {{
 *   logger: Record<LogLevel, (...args: any[]) => void>,
 *   logs: Record<LogLevel, Array<LogCallArguments>>
 * }}
 */
function createStubbedLogger() {
  const logs = {
    error: [],
    info: []
  }
  const makeStub = (level) => (...args) => {
    logs[level].push(args)
  }
  const logger = {
    error: makeStub('error'),
    info: makeStub('info')
  }
  return { logger, logs }
}
