import * as JWT from 'jsonwebtoken'
import * as CONFIG from '../config'
import User from '../model/user'
import ws from '../util/websocket'
import Response from '../util/response'

ws.use(async ({ namespace, route, packet }, next) => {
  console.log(`[ws] Incoming: ${namespace}/${route} -- ${packet}`)
  await next()
})

ws.of('/api')

ws.on('Knock Knock', async packet => {
  return "Who's there?"
})

ws.public.on('user/register', async packet => {
  return await User.register(packet)
})

ws.public.on('user/login', async packet => {
  const user = await User.login(packet)
  const token = JWT.sign({
    uid: user.uid,
    r: Math.random()
  }, CONFIG.secret)

  return { token, user }
})