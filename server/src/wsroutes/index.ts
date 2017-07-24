import * as JWT from 'jsonwebtoken'
import * as CONFIG from '../config'
import User from '../model/user'
import ws from '../util/websocket'
import Response from '../util/response'

ws.use(async (context, next) => {
  const { namespace, route, payload } = context
  console.log(`[ws] <= ${namespace}/${route} -- "${JSON.stringify(payload)}"`)

  await next()

  const { response } = context
  console.log(`[ws] => ${namespace}/${route} -- "${JSON.stringify(response)}"`)
})

ws.use(async (context, next) => {
  const { namespace, route, payload } = context
  throw new Error(`${namespace} is under construction.`)
  // console.log('[ws] Such Doge Much Wow.')
  // await next()
})

ws.of('/api')

ws.public.on('Knock Knock', async packet => {
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

ws.otherwise(async packet => {
  throw new Error('You shall not pass.')
})