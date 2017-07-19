import * as JWT from 'jsonwebtoken'
import User from '../model/user'
import router from '../util/router'
import Response from "../util/response";

router.post('/user/register', async (ctx, next) => {
  try {
    const info = ctx.request.body
    const user = await User.register(info)

    ctx.body = Response.ok(user)
  } catch (error) {
    ctx.body = Response.err(error.massage)
    ctx.status = 500
  }
})

router.post('/user/login', async (ctx, next) => {
  try {
    const info = ctx.request.body
    const user = await User.login(info)

    const token = JWT.sign({
      uid: user.uid,
      r: Math.random()
    }, 'DogeWoW')

    ctx.body = Response.ok({ token, user })
  } catch (error) {
    ctx.body = Response.err(error.massage)
    ctx.status = 500
  }
})

// TODO
router.post('/user/logout', async (ctx, next) => {
  try {
    const { token } = ctx.request.body

  } catch (error) {
    ctx.body = Response.err(error.massage)
    ctx.status = 500
  }
})