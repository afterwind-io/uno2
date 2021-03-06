import * as JWT from 'jsonwebtoken'
import * as CONFIG from '../config'
import User from '../model/user'

export async function register(userInfo) {
  const test = await User.fetchByName(userInfo.name)
  if (test !== void 0) throw new Error('该用户名已被注册')

  return await User.create(userInfo)
}

export async function login(userInfo) {
  const user = await User.fetchByName(userInfo.name)

  if (user === void 0 || userInfo.password !== user.password) {
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