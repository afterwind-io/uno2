import * as JWT from 'jsonwebtoken'
import User from '../model/user'
import ws from '../util/websocket'
import Response from '../util/response'

ws.of('/api')

ws.on('Knock Knock', async packet => {
  return "Who's there?"
})

ws.on('user/register', async packet => {
  return await User.register(packet)
}, true)

ws.on('user/login', async packet => {
  const user = await User.login(packet)
  const token = JWT.sign({
    uid: user.uid,
    r: Math.random()
  }, 'DogeWoW')

  return { token, user }
}, true)