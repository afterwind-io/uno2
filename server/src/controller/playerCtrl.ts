import User from '../model/user'
import { Player, PlayerStatus } from '../model/player'

export async function create(user: User): Promise<Player> {
  let player = new Player(user)
  await player.inqueue()
  await player.save()

  return player
}

export async function remove(uid: string): Promise<Player> {
  let player = await Player.fetch(uid)
  await player.dequeue()
  await player.destory()

  return player
}

export async function get(uid: string): Promise<Player> {
  return await Player.fetch(uid)
}

export async function changeRoom(uid: string, roomId: number): Promise<void> {
  let player = await Player.fetch(uid)

  player.roomId = roomId
  return await player.save()
}

export async function changeStatus(uid: string, status: PlayerStatus): Promise<void> {
  let player = await Player.fetch(uid)

  player.status = status
  return await player.save()
}