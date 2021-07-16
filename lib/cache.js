export const createCache = (namespace) => {
  const cache = {}
  return (key, create) => {
    if (!cache[key]) cache[key] = create()
    return cache[key]
  }
}
