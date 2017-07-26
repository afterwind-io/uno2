import * as CONFIG from '../config'
import ConnectRedis from '../util/redis'
import JSONify from '../util/jsonify'

const redis = ConnectRedis(CONFIG.redis.cache)
const REDIS_ROOM_GEN = 'roomIdGen'
const REDIS_ROOM_INDEX = 'room-index'

const LOBBY_ID = 0
const LOBBY_NAME = 'Lobby'
const LOBBY_MAX_PLAYER = 1000

const ROOM_MIN_PLAYER = 2
const ROOM_MAX_PLAYER = 10

export enum RoomStatus {
  idle = 'idle',
  busy = 'busy'
}

export interface RoomDetails {
  uid: number,
  name?: string,
  onwer?: string,
  players?: string[],
  limit?: number,
  isPublic?: boolean,
  password?: string,
  status?: RoomStatus
}

export class Room extends JSONify {
  /**
   * 房间id，大厅默认为0
   * 
   * @type {number}
   * @memberof Room
   */
  public uid: number

  /**
   * 房间名称
   * 
   * @type {string}
   * @memberof Room
   */
  public name: string

  /**
   * 房主名称
   * 
   * @type {string}
   * @memberof Room
   */
  public owner: string

  /**
   * 玩家列表
   * 
   * @type {string[]}
   * @memberof Room
   */
  public players: string[]

  /**
   * 房间人数限制
   * 
   * @type {number}
   * @memberof Room
   */
  public limit: number

  /**
   * 指示房间是否公开
   * 
   * @type {boolean}
   * @memberof Room
   */
  public isPublic: boolean

  /**
   * 房间密码
   * 
   * @type {string}
   * @memberof Room
   */
  public password: string

  /**
   * 房间状态
   * 
   * @type {RoomStatus}
   * @memberof Room
   */
  public status: RoomStatus

  static async init() {
    await redis.set(REDIS_ROOM_GEN, 0)
    await redis.set(LOBBY_ID, (new Room({ uid: LOBBY_ID, name: LOBBY_NAME })).toJson())
  }

  static async create(detail: RoomDetails): Promise<Room> {
    let uid = await redis.incr(REDIS_ROOM_GEN)

    let room = new Room({ ...detail, uid })
    await room.inqueue()
    await room.save()

    return room
  }

  static async remove(roomId: number): Promise<Room> {
    let room = await Room.fetch(roomId)
    await room.dequeue()
    await room.destory()

    return room
  }

  static async fetch(uid: number): Promise<Room> {
    let detail = redis.get(Room.getRedisKey(uid))
    return detail == null ? void 0 : Room.parse(detail)
  }

  static async fetchRange(start: number = 0, end: number = -1): Promise<Room[]> {
    let uids = await redis.lrange(REDIS_ROOM_INDEX, start, end)
    let details: string[] = await redis.mget(uids)

    return details.map(detail => Room.parse(detail))
  }

  static getRedisKey(uid: number): string {
    return `room:${uid}`
  }

  static parse(json: string): Room {
    let detail = <RoomDetails>JSON.parse(json)
    return new Room(detail)
  }

  constructor(detail: RoomDetails) {
    super()

    this.uid = detail.uid
    this.name = detail.name || `Room #${detail.uid}`
    this.owner = detail.onwer || ''
    this.players = detail.players || []
    this.limit = detail.limit || (this.uid === LOBBY_ID ? LOBBY_MAX_PLAYER : ROOM_MAX_PLAYER)
    this.isPublic = detail.isPublic || false
    this.password = detail.password || ''
    this.status = detail.status || RoomStatus.idle
  }

  get playerCount() {
    return this.players.length
  }

  async inqueue() {
    return redis.lpush(REDIS_ROOM_INDEX, this.uid)
  }

  async dequeue() {
    return redis.lrem(REDIS_ROOM_INDEX, 0, this.uid)
  }

  async save() {
    let index = await redis.incr(REDIS_ROOM_GEN)
    return redis.set(Room.getRedisKey(this.uid), this.toJson())
  }

  async destory() {
    return redis.del(Room.getRedisKey(this.uid))
  }

  async destoryIfEmpty(): Promise<void> {
    if (this.playerCount === 0) {
      await this.dequeue()
      await this.destory()
    }

    return
  }

  addPlayer(uid: string) {
    if (this.playerCount === this.limit) {
      throw new Error('该房间人数已满')
    }

    this.players.push(uid)
  }

  removePlayer(uid: string) {
    let index = this.players.indexOf(uid)
    this.players.splice(index, 1)
  }
}
