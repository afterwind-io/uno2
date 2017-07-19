import { Room, RoomStatus, RoomDetails } from '../model/room'

export async function create(details: RoomDetails): Promise<Room> {
  let room = await Room.create(details)
  await room.inqueue()
  await room.save()

  return room
}

export async function remove(uid: number): Promise<Room> {
  let room = await Room.fetch(uid)
  await room.dequeue()
  await room.destory()

  return room
}

export async function get(uid: number): Promise<Room> {
  return await Room.fetch(uid)
}

export async function addPlayer(uid: number, playerId: string): Promise<void> {
  let room = await Room.fetch(uid)

  room.addPlayer(playerId)
  return await room.save()
}

export async function removePlayer(uid: number, playerId: string): Promise<void> {
  let room = await Room.fetch(uid)

  room.removePlayer(playerId)
  return await room.save()
}