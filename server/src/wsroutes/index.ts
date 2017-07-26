import wsrouter from '../util/router'
import * as userCtrl from '../controller/userCtrl'

wsrouter.of('/api')

wsrouter.on('Knock Knock', async packet => {
  return "Who's there?"
})

wsrouter.on('user/register', userCtrl.register)

wsrouter.on('user/login', userCtrl.login)

wsrouter.otherwise(async packet => {
  throw new Error('You shall not pass.')
})