import * as Ioredis from 'ioredis'

export default function ConnectRedis(index: number): Ioredis.Redis {
  return new Ioredis({
    port: 6379,
    host: '127.0.0.1',
    db: 0
  })
}