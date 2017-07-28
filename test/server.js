const { expect } = require('chai')
const { boot, cleanup, MockWSClient, redis_db, redis_cache } = require('./server.lib.js')
const { default: User } = require('../server/build/model/user.js')
const { Player, REDIS_PLAYER_INDEX } = require('../server/build/model/player.js')
const { Room, RoomStatus, REDIS_ROOM_GEN, REDIS_ROOM_INDEX, LOBBY_ID } = require('../server/build/model/room.js')

const wsUrl = 'http://localhost:13001'
const USER_DOGE = new MockWSClient(wsUrl)
const USER_KITTY = new MockWSClient(wsUrl)
const REG_DOGE = {
  name: 'doge',
  password: '123456'
}
const REG_KITTY = {
  name: 'kitty',
  password: '123456'
}

before(async () => {
  await boot()
})

after(async () => {
  await cleanup()
})

describe('#Server Init State -- ', async () => {
  it('Cache should have a room id generator which equals 0', async () => {
    let index = await redis_cache.get(REDIS_ROOM_GEN)

    expect(index).not.to.be.undefined
    expect(index).to.eq(LOBBY_ID.toString())
  })

  it('Lobby should be ready', async () => {
    let lobby = await Room.fetch(LOBBY_ID)

    expect(lobby).not.to.be.undefined
    expect(lobby).to.deep.eq({
      "uid": 0,
      "name": "Lobby",
      "owner": "",
      "players": [],
      "minPlayers": 0,
      "maxPlayers": 1000,
      "isPrivate": false,
      "password": "",
      "status": "idle"
    })
  })

  it('Room index should be empty', async () => {
    let index = await redis_cache.lrange(REDIS_ROOM_INDEX, 0, -1)

    expect(index).to.be.empty
  })

  it('Player index should be empty, too', async () => {
    let index = await redis_cache.lrange(REDIS_PLAYER_INDEX, 0, -1)

    expect(index).to.be.empty
  })
})

describe('#Register -- ', async () => {
  it('Register user "doge", and should have user info in db', async () => {
    await USER_DOGE.send('user/register', REG_DOGE)

    let doge = await User.fetchByName('doge')
    expect(doge).not.undefined
    expect(doge.name).to.eq('doge')
    expect(doge.nickname).to.eq('doge')
  })

  it('...And a map of "name-uid"', async () => {
    let doge = await User.fetchByName('doge')
    let uid = await redis_db.get(doge.name)

    expect(uid).to.eq(doge.uid)
  })
})

describe('#Basic Login & Logout -- ', async () => {
  let uid_doge = ''

  it('"Doge" logged in', async () => {
    let { token, user, player } = await USER_DOGE.send('user/login', REG_DOGE)
    USER_DOGE.setToken(token)
    uid_doge = user.uid

    let doge = await Player.fetch(player.uid)
    expect(doge).not.undefined
    expect(doge.name).to.eq(REG_DOGE.name)
    expect(doge.roomId).to.eq(0)
  })

  it('Now we have 1 player in the lobby', async () => {
    let lobby = await Room.fetch(LOBBY_ID)

    expect(lobby.playerCount).to.eq(1)
    expect(lobby.players[0]).to.eq(uid_doge)
  })

  it('And we have "Doge" indexed', async () => {
    let index = await redis_cache.lrange(REDIS_PLAYER_INDEX, 0, -1)

    expect(index.length).to.eq(1)
    expect(index[0]).to.eq(uid_doge)
  })

  it('"Doge" logged out', async () => {
    await USER_DOGE.send('user/logout', { uid: uid_doge })

    let doge = await Player.fetch(uid_doge)
    expect(doge).to.be.undefined
  })

  it('The lobby should now be empty', async () => {
    let lobby = await Room.fetch(LOBBY_ID)

    expect(lobby.playerCount).to.eq(0)
  })

  it('...And "Doge" is removed from the player index', async () => {
    let index = await redis_cache.lrange(REDIS_PLAYER_INDEX, 0, -1)

    expect(index).to.be.empty
  })
})

describe('#Create a Room -- ', async () => {
  let uid_doge = ''
  let uid_kitty = ''

  let reg_home = {
    name: 'Zoo',
    owner: '',
    maxPlayers: 6,
    isPrivate: true,
    password: '123456'
  }

  before(async () => {
    await USER_KITTY.send('user/register', REG_KITTY)

    let { token: token_kitty, player: player_kitty } = await USER_KITTY.send('user/login', REG_KITTY)
    USER_KITTY.setToken(token_kitty)
    uid_kitty = player_kitty.uid

    let { token: token_doge, player: player_doge } = await USER_DOGE.send('user/login', REG_DOGE)
    USER_DOGE.setToken(token_doge)
    uid_doge = player_doge.uid
  })

  it('"Doge" creates a room first', async () => {
    reg_home.owner = uid_doge
    await USER_DOGE.send('room/create', reg_home)

    let room = await Room.fetch(1)
    expect(room.uid).to.eq(1)
    expect(room.name).to.eq(reg_home.name)
    expect(room.owner).to.eq(uid_doge)
    expect(room.playerCount).to.eq(0)
    expect(room.minPlayers).to.eq(2)
    expect(room.maxPlayers).to.eq(reg_home.maxPlayers)
    expect(room.isPrivate).to.eq(reg_home.isPrivate)
    expect(room.status).to.eq(RoomStatus.idle)
  })

  it('Then "Doge" dives into it, and we should have 1 player in room #1', async () => {
    await USER_DOGE.send('room/join', { uid: uid_doge, roomId: 1, password: reg_home.password })

    let room = await Room.fetch(1)

    expect(room.playerCount).to.eq(1)
    expect(room.players[0]).to.eq(uid_doge)
  })

  it('"Kitty" follows in, but inputs the wrong password', async () => {
    try {
      await USER_KITTY.send('room/join', { uid: uid_kitty, roomId: 1, password: 'wrong password' })
      fail('Login should fail.')
    } catch (error) {
      expect(error.payload).to.eq('房间密码不匹配')
    }
  })

  it('"Kitty" logs with the right password, and we should have 2 players in room #1', async () => {
    await USER_KITTY.send('room/join', { uid: uid_kitty, roomId: 1, password: reg_home.password })

    let room = await Room.fetch(1)

    expect(room.playerCount).to.eq(2)
    expect(room.players[1]).to.eq(uid_kitty)
  })

  it('By the way the lobby should be empty now', async () => {
    let lobby = await Room.fetch(LOBBY_ID)

    expect(lobby.playerCount).to.eq(0)
  })

  it('...And we can see room #1 on the list, sure without the lobby itself', async () => {
    let list = await redis_cache.lrange(REDIS_ROOM_INDEX, 0, -1)

    expect(list.length).to.eq(1)
    expect(list[0]).to.eq('1')
  })

  // TODO
  it('"Doge" changes some detail about the room')

  it('"Doge" transfers the ownership to the "Kitty"', async () => {
    await USER_DOGE.send('room/transfer', { roomId: 1, ownerId: uid_kitty })

    let room = await Room.fetch(1)
    expect(room.owner).to.eq(uid_kitty)
  })

  describe('"Kitty" then leaves the room', async () => {
    before(async () => {
      await USER_KITTY.send('room/join', { uid: uid_kitty, roomId: LOBBY_ID })
    })

    it('"Kitty" should be in the lobby now', async () => {
      let kitty = await Player.fetch(uid_kitty)
      expect(kitty.roomId).to.eq(LOBBY_ID)

      let lobby = await Room.fetch(LOBBY_ID)
      expect(lobby.playerCount).to.eq(1)
      expect(lobby.players[0]).to.eq(uid_kitty)
    })

    it('...And since owner leave the room, "Doge" should be the owner again', async () => {
      let room = await Room.fetch(1)
      expect(room.playerCount).to.eq(1)
      expect(room.players[0]).to.eq(uid_doge)
      expect(room.owner).to.eq(uid_doge)
    })
  })

  describe('"Doge" then leaves the room', async () => {
    before(async () => {
      await USER_DOGE.send('room/join', { uid: uid_doge, roomId: LOBBY_ID })
    })

    it('...And since no one in the roon #1, the room should be deleted', async () => {
      let room = await Room.fetch(1)
      expect(room).to.be.undefined
    })

    it('...And removed from the room index', async () => {
      let list = await redis_cache.lrange(REDIS_ROOM_INDEX, 0, -1)

      expect(list.length).to.eq(0)
    })
  })
})
