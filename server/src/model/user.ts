import * as CONFIG from '../config'
import * as Crypto from 'crypto'
import { idGen } from '../util/common'
import ConnectRedis from '../util/redis'
import JSONify from '../util/jsonify'

const redis = ConnectRedis(CONFIG.redis.user)

interface UserDetails {
  uid?: string
  name: string
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

  static async login({ name, password }: { name: string, password: string }): Promise<User> {
    let user = await User.fetch(name)

    if (user !== void 0 && password === user.password) {
      return user
    } else {
      throw new Error('用户名或密码错误')
    }
  }

  static async register(ctx: { name: string, password: string }): Promise<User> {
    let test = await User.fetch(ctx.name)
    if (test !== void 0) throw new Error('该用户名已被注册')

    let user = new User(ctx)
    await user.save()
    return user
  }

  static async fetch(name: string): Promise<User> {
    let detail = await redis.get(User.getRedisKey(name))
    return detail == null ? void 0 : User.parse(detail)
  }

  static getRedisKey(name: string): string {
    const hash = Crypto.createHash('sha256');

    hash.update(`user:${name}`)
    return `user:${hash.digest('hex')}`
  }

  static parse(json: string): User {
    let detail = <UserDetails>JSON.parse(json)
    return new User(detail)
  }

  constructor(details: UserDetails) {
    super()

    this.uid = details.uid || idGen()
    this.name = details.name
    this.password = details.password
  }

  async save() {
    await redis.set(User.getRedisKey(this.name), this.toJson())
  }
}

export default User