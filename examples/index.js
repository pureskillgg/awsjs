import path from 'path'

import { createExamples } from '@meltwater/examplr'

import { invoke } from './invoke.js'

process.env.AWS_SDK_LOAD_CONFIG = 'true'

const examples = {
  invoke
}

const envVars = ['LOG_LEVEL', 'LOG_FILTER', 'LOG_OUTPUT_MODE']

const defaultOptions = {}

const { runExample } = createExamples({
  examples,
  envVars,
  defaultOptions
})

runExample({
  local: path.resolve('examples', 'local.json')
})
