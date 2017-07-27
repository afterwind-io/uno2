const io = require('socket.io-client')
const mgr = new io.Manager('http://localhost:13001')

mgr.open()
let ws = mgr.socket('/api')

let jwt = ''
async function send(api, param) {
  return new Promise((resolve, reject) => {
    let packet = { token: jwt, route: api, param }
    ws.emit('request', packet, data => {
      data.code === 0 ? resolve(data.payload) : reject(data)
    })
  })
}

(async function () {
  // await wsapi.send('user/register', { name: 'kitty', password: '123456' })
  let { token, player } = await send('user/login', {
    name: 'doge', password: '123456'
  })
  jwt = token

  await send('player/list')

  let { uid: roomId } = await send('room/create', {
    name: 'Doge!',
    owner: player.uid,
    maxPlayers: 6,
    isPrivate: true,
    password: '123456'
  })
  await send('room/to', { uid: player.uid, roomId, password: '123456' })

  await send('room/list')

  await send('user/logout', { uid: player.uid })
  // await send('fakeone')
})()
