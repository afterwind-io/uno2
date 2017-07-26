import * as CONFIG from './config'
import ConnectRedis from './util/redis'
import { Room } from './model/room'

const redis = ConnectRedis(CONFIG.redis.cache)

export default async function boot() {
  await redis.flushdb()
  await Room.init()
}