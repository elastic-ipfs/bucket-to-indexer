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
  const cases = [exampleTopicRealistic, exampleTopicFake]
  for (const { topic, region } of cases) {
    const config = createClientConfig({ topic })
    t.equal(config.region, region)
  }
})
