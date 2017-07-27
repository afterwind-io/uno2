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

  static getRedisKey(uid: string): string {
    return `player:${uid}`
  }

  static async fetch(uid: string): Promise<Player> {
    let detail = await redis.get(Player.getRedisKey(uid))
    return detail == null ? void 0 : Player.parse(detail)
  }

  static async fetchRange(start: number = 0, end: number = -1): Promise<Player[]> {
    let uids = await redis.lrange(REDIS_PLAYER_INDEX, start, end)
    let keys = uids.map(uid => Player.getRedisKey(uid))
    let details: string[] = await redis.mget(...keys)

    return details.map(detail => Player.parse(detail))
  }

  static async create(detail: PlayerDetails): Promise<Player> {
    let player = new Player(detail)
    await player.inqueue()
    await player.save()

    return player
  }

  static async remove(uid: string): Promise<Player> {
    let player = await Player.fetch(uid)
    await player.dequeue()
    await player.destory()

    return player
  }

  static parse(json: string): Player {
    let detail = <PlayerDetails>JSON.parse(json)
    return new Player(detail)
  }

  constructor(detail: PlayerDetails) {
    super()

    this.uid = detail.uid
    this.name = detail.name
    this.roomId = detail.roomId || 0
    this.status = detail.status || PlayerStatus.idle
  }

  async inqueue() {
    return await redis.lpush(REDIS_PLAYER_INDEX, this.uid)
  }

  async dequeue() {
    return await redis.lrem(REDIS_PLAYER_INDEX, 0, this.uid)
  }

  async save() {
    return await redis.set(Player.getRedisKey(this.uid), this.toJson())
  }

  async destory() {
    return await redis.del(Player.getRedisKey(this.uid))
  }

  changeRoom(uid: string, roomId: number): number {
    if (roomId === this.roomId) {
      throw new Error('您已经加入了该房间')
    }

    if (this.status !== PlayerStatus.idle) {
      throw new Error('当前状态无法切换房间')
    }

    let oldRoomId = this.roomId
    this.roomId = roomId
    return oldRoomId
  }
}