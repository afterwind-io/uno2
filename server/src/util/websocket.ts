import * as Socket from 'socket.io'
import * as JWT from 'jsonwebtoken'
import * as CONFIG from '../config'
import Response from './response'

function jwtVerify(token: string): boolean {
  try {
    var decoded = JWT.verify(token, CONFIG.secret);
    return true
  } catch (err) {
    return false
  }
}

type WSRouteHandler = (packet: any) => Promise<any>

class WS {
  private io: SocketIO.Server
  private namespace: string = '/'

  constructor() {
    this.io = Socket(CONFIG.port.websocket)
  }

  of(namespace: string): WS {
    this.namespace = namespace
    return this
  }

  on(route: string, handler: WSRouteHandler, skipAuth: boolean = false): WS {
    const nsp = this.io.of(this.namespace)

    nsp.on('connection', socket => socket.on(route, async (packet, cb) => {
      const { token, payload } = packet

      if (!skipAuth && !jwtVerify(token)) {
        cb(Response.err('Authentication failed'))
        return socket.disconnect()
      }

      try {
        cb(Response.ok(await handler(payload)))
      } catch (error) {
        cb(Response.err(error.message))
      }
    }))

    return this
  }
}

export default new WS()