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

  let lobby = await Room.fetch(0)
  lobby.addPlayer(player.uid)
  lobby.save()

  return { token, user, player }
})

wsrouter.on('user/logout', async packet => {
  let { uid } = packet

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

wsrouter.on('room/create', async packet => {
  let roomDetail = packet

  let room = await Room.create(roomDetail)
  return room
})

wsrouter.on('room/to', async packet => {
  let { uid, roomId, password } = packet

  let player = await Player.fetch(uid)

  let newRoom = await Room.fetch(roomId)
  if (newRoom.isPrivate && newRoom.password !== password) {
    throw new Error('房间密码不匹配')
  } else {
    newRoom.addPlayer(uid)
  }

  let oldRoomId = player.roomId
  let oldRoom = await Room.fetch(oldRoomId)
  if (oldRoom) {
    oldRoom.removePlayer(uid)
    await oldRoom.destoryIfEmpty() && await oldRoom.save()
  }

  player.changeRoom(uid, roomId)
  await player.save()
  await newRoom.save()

  return 'ok'
})

wsrouter.on('room/list', async packet => {
  let { start, end } = packet
  return await Room.fetchRange(start, end)
})

wsrouter.otherwise(async packet => {
  throw new Error('You shall not pass.')
})