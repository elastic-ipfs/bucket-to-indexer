/**
 * @typedef {object} ParsedTopic
 * @property {string|undefined} region - aws region of topic
 */

/**
 * Parse an AWS SNS TopicArn
 * @param {string} topicArn - e.g. arn:aws:sns:us-east-2:foo:topicName
 * @returns {ParsedTopic}
 */
function parseTopic(topicArn) {
  const pattern = /arn:aws:sns:([^:]*)/i
  const region = topicArn.match(pattern)?.[1]
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

module.exports = {
  parseTopic,
  createClientConfig
}