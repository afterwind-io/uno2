import * as JWT from 'jsonwebtoken'
import * as CONFIG from '../config'
import User from '../model/user'

export async function register(userInfo) {
  return await User.register(userInfo)
}

export async function login(userInfo) {
  const user = await User.login(userInfo)
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