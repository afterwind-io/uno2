import ws from '../util/router'
import * as userCtrl from '../controller/userCtrl'

ws.of('/api')

ws.on('Knock Knock', async packet => {
  return "Who's there?"
})

ws.on('user/register', userCtrl.register)
ws.on('user/login', userCtrl.login)


ws.otherwise(async packet => {
  throw new Error('You shall not pass.')
})