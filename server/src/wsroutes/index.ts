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
  try {
    await next()

    if (context.response.constructor !== Response) {
      context.response = Response.ok(context.response)
    }
  } catch (error) {
    context.response = Response.err(error.message)
    console.error(error)
  }
})

ws.use(async (context, next) => {
  // /**
  //  * JWT验证
  //  * 
  //  * @param {string} token JWT字符串
  //  * @returns {boolean} 验证结果
  //  */
  // function jwtVerify(token: string): boolean {
  //   try {
  //     var decoded = JWT.verify(token, CONFIG.secret);
  //     return true
  //   } catch (err) {
  //     return false
  //   }
  // }

  // if (accessibility === WSRouteAccessibility.private && !jwtVerify(token)) {
  //       return cb(Response.err('Authentication failed'))
  //     }
})

ws.use(async (context, next) => {
  const { namespace, route, payload } = context
  // throw new Error(`${namespace} is under construction.`)
  await next()
})

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