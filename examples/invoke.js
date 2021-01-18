import fs from 'fs'
import path from 'path'

import { LambdaClient } from '../index.js'

export const invoke = ({ log }) => async (functionName, req) => {
  const input = await readJson('tmp', `${req}.json`)
  const client = new LambdaClient({
    functionName,
    log
  })
  return client.invokeJson(input)
}

const readJson = async (...args) => {
  const src = path.resolve(...args)
  const data = await fs.promises.readFile(src)
  return JSON.parse(data.toString())
}
