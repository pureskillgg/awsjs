import test from 'ava'

import { createCache } from './cache.js'

test('createCache: returns input', (t) => {
  const foo = Symbol('foo')
  const create = () => foo
  const cache = createCache()
  t.is(cache('foo', create), foo)
})

test('createCache: returns cached input', (t) => {
  const create = () => Symbol('foo')
  const cache = createCache()
  const data = cache('foo', create)
  t.is(cache('foo', create), data)
})

test('createCache: returns cached input by key', (t) => {
  const create = () => Symbol('foo')
  const cache = createCache()
  const data = cache('foo', create)
  t.false(cache('bar', create) === data)
})
