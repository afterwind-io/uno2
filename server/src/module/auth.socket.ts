import * as Ioredis from 'ioredis'

const redis: Ioredis.Redis = new Ioredis({
  port: 6379,
  host: '127.0.0.1',
  db: 0
})

/**
 * Socket层权限检测
 * 
 * @class AuthSocket
 */
class AuthSocket {
  /**
   * 关联登录用户与其当前连接的socket
   * 
   * @param {string} userId 用户id
   * @param {string} socketId socket id
   * 
   * @memberOf IAuthSocket
   */
  static async register(userId: string, socketId: string): Promise<void> {
    await redis.set(socketId, userId)
  }

  /**
   * 移除当前socket与登录用户的绑定
   * 
   * @param {string} socketId socket id
   * 
   * @memberOf IAuthSocket
   */
  static async remove(socketId: string): Promise<void> {
    await redis.del(socketId)
  }

  /**
   * 检查当前socket是否已绑定至某个已登录用户
   * 
   * @param {string} socketId socket id
   * @returns {boolean} 若该socket已绑定至某个用户则返回true，否则为false
   * 
   * @memberOf IAuthSocket
   */
  static async check(socketId: string): Promise<boolean> {
    let userId: string = await redis.get(socketId)
    return userId == null
  }
}

export default AuthSocket