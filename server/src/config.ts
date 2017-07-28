export const port = {
  websocket: 13001
}

export const secret = 'doge'

const redisIndex = {
  db: {
    dev: 10,
    test: 10,
    prod: 0
  },
  cache: {
    dev: 11,
    test: 11,
    prod: 1
  }
}
export const redis = {
  db: redisIndex.db[process.env.NODE_ENV || 'test'],
  cache: redisIndex.cache[process.env.NODE_ENV || 'test']
}