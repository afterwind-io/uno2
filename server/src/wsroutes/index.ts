import * as JWT from 'jsonwebtoken'
import * as CONFIG from '../config'
import User from '../model/user'
import WSRouter from '../lib/wsrouter'
import logger from '../lib/wsrouter.logger'
import resWrapper from '../lib/wsrouter.response'
import jwtVerify from '../lib/wsrouter.jwt'

const ws = new WSRouter(CONFIG.port.websocket)

ws.use(logger)
ws.use(resWrapper)
ws.use(jwtVerify({
  secret: CONFIG.secret,
  excludes: ['user/register', 'user/login']
}))

ws.of('/api')

ws.on('Knock Knock', async packet => {
  return "Who's there?"
})

ws.on('user/register', async packet => {
  return await User.register(packet)
})

ws.on('user/login', async packet => {
  const user = await User.login(packet)
  const token = JWT.sign({
    uid: user.uid,
    r: Math.random()
  }, CONFIG.secret)

  return { token, user }
})

ws.otherwise(async packet => {
  throw new Error('You shall not pass.')
})