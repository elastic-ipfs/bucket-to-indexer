const t = require('tap')
const { createClientConfig } = require('../src/aws')

const exampleTopicRealistic = {
  topic: 'arn:aws:sns:us-east-2:foo:topicName',
  region: 'us-east-2'
}

const exampleTopicFake = {
  topic: 'fakeTopic',
  region: undefined
}

t.test('createSNSClient uses region of topic', async t => {
  const cases = [exampleTopicRealistic]
  for (const { topic, region } of cases) {
    const config = createClientConfig({ topic })
    t.equal(config.region, region)
  }
})

t.test('createClientConfig throws with non-arn topic', async t => {
  const cases = [exampleTopicFake]
  for (const { topic } of cases) {
    t.throws(() => createClientConfig({ topic }), 'Malformed ARN', 'expect createClientConfig to throw if topic is not an arn')
  }
})
