import { idGen } from '../util/common'
import * as CONFIG from '../config'
import ConnectRedis from '../util/redis'
import JSONify from '../util/jsonify'

const redis = ConnectRedis(CONFIG.redis.user)

interface UserDetails {
  uid: string
  password: string
  name: string
  nickname?: string
}

/**
 * 用户数据类型，用于持久化数据
 * 
 * @class User
 * @extends {JSONify}
 */
class User extends JSONify {
  /**
   * 用户id
   * 
   * @type {string}
   * @memberof User
   */
  public uid: string

  /**
   * 用户账户名称
   * 
   * @type {string}
   * @memberof User
   */
  public name: string

  /**
   * 用户昵称
   * 
   * @type {string}
   * @memberof User
   */
  public nickname: string

  /**
   * 账户密码
   * 
   * @type {string}
   * @memberof User
   */
  public password: string

  static async create(details: UserDetails): Promise<User> {
    let user = new User(details)
    redis.set(user.name, user.uid)

    await user.save()
    return user
  }

  static async fetch(uid: string = ''): Promise<User> {
    let detail = await redis.get(User.getRedisKey(uid))
    return detail == null ? void 0 : User.parse(detail)
  }

  static async fetchByName(name: string = ''): Promise<User> {
    let uid = await redis.get(name)
    return uid == null ? void 0 : User.fetch(uid)
  }

  static getRedisKey(uid: string = ''): string {
    return `user:${uid}`
  }

  static parse(json: string): User {
    let detail = <UserDetails>JSON.parse(json)
    return new User(detail)
  }

  constructor(details: UserDetails) {
    super()

    this.uid = details.uid || idGen()
    this.password = details.password
    this.name = details.name || details.uid
    this.nickname = details.nickname || details.name
  }

  async save() {
    await redis.set(User.getRedisKey(this.uid), this.toJson())
  }
}

export default User