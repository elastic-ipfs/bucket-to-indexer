const utilArnParser = require('@aws-sdk/util-arn-parser')
const { logger: defaultLogger } = require('./logging')

/**
 * @typedef {object} ParsedTopic
 * @property {string|undefined} region - aws region of topic
 */

/**
 * Parse an AWS SNS TopicArn
 * @param {string} topicArn - e.g. arn:aws:sns:us-east-2:foo:topicName
 * @returns {ParsedTopic}
 */
function parseTopic(topicArn, logger = defaultLogger.child('parseTopic')) {
  logger.debug('parsing', { topicArn })
  const awsParsed = utilArnParser.parse(topicArn)
  logger.debug('parseTopic', { awsParsed, topicArn })
  const region = awsParsed.region
  return { region }
}

/**
 * Given a TopicArn, return appropriate config to use to create an SNSClient
 * @returns {Pick<import("@aws-sdk/client-sns").SNSClientConfig, 'region'>}
 */
function createClientConfig({ topic }) {
  const parsedTopic = parseTopic(topic)
  const config = {
    region: parsedTopic.region
  }
  return config
}

/**
 * Create a URL that identifies an AWS S3 Bucket/Key
 * @param {string} bucket - aws s3 bucket name
 * @param {string} [key] - key in bucket
 * @returns {URL} URL of key in bucket
 */
function createS3URL(bucket, key) {
  return new URL([`s3://${bucket}`, key].filter(Boolean).join('/'))
}

module.exports = {
  parseTopic,
  createClientConfig,
  createS3URL
}
