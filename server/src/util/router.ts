import * as CONFIG from '../config'
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

export default ws
