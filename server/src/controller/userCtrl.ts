import * as JWT from 'jsonwebtoken'
import * as CONFIG from '../config'
import User from '../model/user'

export async function register(userInfo) {
  const test = await User.fetch(userInfo.name)
  if (test !== void 0) throw new Error('该用户名已被注册')

  const user = new User(userInfo)
  return await user.save()
}

export async function login(userInfo) {
  const user = await User.fetch(name)

  if (user === void 0 || userInfo.password === user.password) {
    throw new Error('用户名或密码错误')
  }

  const token = JWT.sign({
    uid: user.uid,
    r: Math.random()
  }, CONFIG.secret)

  return { token, user }
}

// TODO
export async function logout() {
  throw new Error('Not implemented.')
}