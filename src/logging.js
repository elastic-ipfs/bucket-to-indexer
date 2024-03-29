'use strict'

const pino = require('pino')
let destination
let level = 'info'

try {
  if (process.env.NODE_ENV !== 'production') {
    destination = require('pino-pretty')()
  }
  /* c8 ignore next 3 */
} catch (e) {
  console.debug('error requiring pino-pretty as logging destination')
  // No-op
}

if (process.env.LOG_LEVEL) {
  level = process.env.LOG_LEVEL
  /* c8 ignore next 3 */
} else if (process.env.NODE_DEBUG) {
  level = 'debug'
}

const logger = pino(
  {
    level,
    base: undefined,
    timestamp: pino.stdTimeFunctions.isoTime
  },
  destination
)

function serializeError(e) {
  return `[${e.code || e.constructor.name}] ${e.message}`
}

module.exports = {
  logger,
  serializeError
}
