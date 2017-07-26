import * as CONFIG from '../config'
import * as Crypto from 'crypto'
import ConnectRedis from '../util/redis'
import JSONify from '../util/jsonify'

const redis = ConnectRedis(CONFIG.redis.user)

interface UserDetails {
  uid: string
  name?: string
  password: string
}

/**
 * 用户数据类型，用于持久化数据
 * 
 * @class User
 * @extends {JSONify}
 */
class User extends JSONify {
  /**
   * 用户账户名称
   * 
   * @type {string}
   * @memberof User
   */
  public uid: string

  /**
   * 用户昵称
   * 
   * @type {string}
   * @memberof User
   */
  public name: string

  /**
   * 账户密码
   * 
   * @type {string}
   * @memberof User
   */
  public password: string

  static async fetch(uid: string = ''): Promise<User> {
    let detail = await redis.get(User.getRedisKey(uid))
    return detail == null ? void 0 : User.parse(detail)
  }

  static getRedisKey(uid: string = ''): string {
    const hash = Crypto.createHash('sha256');

    hash.update(uid)
    return `user:${hash.digest('hex')}`
  }

  static parse(json: string): User {
    let detail = <UserDetails>JSON.parse(json)
    return new User(detail)
  }

  constructor(details: UserDetails) {
    super()

    this.uid = details.uid
    this.name = details.name || details.uid
    this.password = details.password
  }

  async save() {
    await redis.set(User.getRedisKey(this.name), this.toJson())
  }
}

export default User