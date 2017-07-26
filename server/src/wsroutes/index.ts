import wsrouter from '../util/router'
import { Player } from '../model/player'
import { Room } from '../model/room'
import * as userCtrl from '../controller/userCtrl'

wsrouter.of('/api')

wsrouter.on('Knock Knock', async packet => {
  return "Who's there?"
})

wsrouter.on('user/register', userCtrl.register)

wsrouter.on('user/login', async packet => {
  let { token, user } = await userCtrl.login(packet)
  let player = await Player.create(user)

  return { token, user, player }
})

wsrouter.on('user/logout', async packet => {
  let uid = packet
  let player = await Player.remove(uid)

  let room = await Room.fetch(player.roomId)
  room.removePlayer(uid)
  await room.destoryIfEmpty()

  return 'ok'
})

wsrouter.on('player/list', async packet => {
  let { start, end } = packet
  return await Player.fetchRange(start, end)
})

wsrouter.on('room/to', async packet => {
  let { uid, roomId } = packet

  try {
    let player = await Player.fetch(uid)
    let oldRoomId = player.changeRoom(uid, roomId)

    let newRoom = await Room.fetch(roomId)
    let oldRoom = await Room.fetch(oldRoomId)
    newRoom.addPlayer(uid)
    oldRoom.removePlayer(uid)

    await oldRoom.destoryIfEmpty()
    await player.save()
    await newRoom.save()
  } catch (error) {
    return error
  }
})

wsrouter.on('room/list', async packet => {
  let { start, end } = packet
  return await Room.fetchRange(start, end)
})

wsrouter.otherwise(async packet => {
  throw new Error('You shall not pass.')
})