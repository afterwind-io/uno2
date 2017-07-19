import * as CONFIG from '../config'
import ConnectRedis from '../util/redis'
import JSONify from '../util/jsonify'

const redis = ConnectRedis(CONFIG.redis.cache)
const REDIS_PLAYER_INDEX = 'player-index'

export enum PlayerStatus {
  idle = 'idle',
  pending = 'pending',
  ready = 'ready',
  busy = 'busy'
}

interface PlayerDetails {
  uid: string
  name: string
  status?: PlayerStatus
  roomId?: number
}

/**
 * 玩家数据类型，用于非持久化在线数据
 * 
 * @class Player
 */
export class Player extends JSONify {
  /**
   * 玩家账户名称，与对应用户uid一致
   * 
   * @type {string}
   * @memberof User
   */
  public uid: string

  /**
   * 玩家昵称，与对应用户name一致
   * 
   * @type {string}
   * @memberof User
   */
  public name: string

  /**
   * 玩家状态
   * 
   * @type {PlayerStatus}
   * @memberof Player
   */
  public status: PlayerStatus

  /**
   * 玩家所在房间编号
   * 
   * @type {number}
   * @memberof Player
   */
  public roomId: number

  static async fetch(uid: string): Promise<Player> {
    let detail = await redis.get(Player.getRedisKey(uid))
    return detail == null ? void 0 : new Player(detail)
  }

  static getRedisKey(uid: string): string {
    return `player:${uid}`
  }

  constructor(detail: PlayerDetails) {
    super()

    this.uid = detail.uid
    this.name = detail.name
    this.roomId = detail.roomId || 0
    this.status = detail.status || PlayerStatus.idle
  }

  async inqueue() {
    return redis.sadd(REDIS_PLAYER_INDEX, this.uid)
  }

  async dequeue() {
    return redis.srem(REDIS_PLAYER_INDEX, this.uid)
  }

  async save() {
    return redis.set(Player.getRedisKey(this.uid), this.toJson())
  }

  async destory() {
    return redis.del(Player.getRedisKey(this.uid))
  }
}