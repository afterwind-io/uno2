const io = require('socket.io-client')
const CONFIG = require('../server/build/config.js')
const ConnectRedis = require('../server/build/util/redis').default
const Room = require('../server/build/model/room').Room

const redis_db = ConnectRedis(CONFIG.redis.db)
const redis_cache = ConnectRedis(CONFIG.redis.cache)

module.exports.redis_db = redis_db
module.exports.redis_cache = redis_cache

module.exports.boot = async function () {
  await redis_db.flushdb()
  await redis_cache.flushdb()
  await Room.init()
}

module.exports.cleanup = async function () {
  await redis_db.disconnect()
  await redis_cache.disconnect()
}

module.exports.MockWSClient = class MockWSClient {
  constructor(url) {
    this.token = ''
    this.ws = new io.Manager(url)
      .open()
      .socket('/api')
  }

  async send(api, param) {
    return new Promise((resolve, reject) => {
      let packet = { token: this.token, route: api, param }
      this.ws.emit('request', packet, data => {
        data.code === 0 ? resolve(data.payload) : reject(data)
      })
    })
  }

  setToken(token) {
    this.token = token
  }
}