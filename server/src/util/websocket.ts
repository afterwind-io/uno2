import * as Socket from 'socket.io'
import * as JWT from 'jsonwebtoken'
import * as CONFIG from '../config'
import Response from './response'

/**
 * JWT验证
 * 
 * @param {string} token JWT字符串
 * @returns {boolean} 验证结果
 */
function jwtVerify(token: string): boolean {
  try {
    var decoded = JWT.verify(token, CONFIG.secret);
    return true
  } catch (err) {
    return false
  }
}

/**
 * 串联中间件的辅助方法
 * 
 * @param {any[]} middlewares 中间件函数
 * @returns 顺序执行所有中间件的辅助方法
 */
function chain(middlewares: any[]) {
  // context: 在中间件函数间传递的上下文对象
  return (context:any) => middlewares.reduceRight(
    (next: any, middleware: any) => async () => await middleware(context, next),
    async () => {}
  )
}

type WSRouteHandler = (packet: any) => Promise<any>
type WSRouteInfo = { namespace: string, route: string, packet: any }
type WSRouteMiddleware = (context: WSRouteInfo, next: () => void) => Promise<void>

class WS {
  private io: SocketIO.Server
  private namespace: string = '/'
  private skipAuth: boolean = false
  private middlewares: WSRouteMiddleware[] = []

  constructor() {
    this.io = Socket(CONFIG.port.websocket)
  }
  
  /**
   * 标识接下来的路由定义应跳过jwt验证
   * 
   * @readonly
   * @type {WS}
   * @memberof WS
   */
  get public(): WS {
    return (this.skipAuth = true, this)
  }

  /**
   * 增加路由中间件
   * 
   * @param {WSRouteMiddleware} middleware 中间件定义
   * @memberof WS
   */
  use(middleware: WSRouteMiddleware) {
    this.middlewares.push(middleware)
  }

  /**
   * 标识接下来的路由定义应归属于哪个命名空间下
   * 
   * @param {string} namespace 命名空间名称
   * @returns {WS} 当前的ws对象
   * @memberof WS
   */
  of(namespace: string): WS {
    return (this.namespace = namespace, this)
  }

  /**
   * 定义路由处理方法
   * 
   * @param {string} route 路由名称
   * @param {WSRouteHandler} handler 路由处理方法
   * @returns {WS} 当前的ws对象
   * @memberof WS
   */
  on(route: string, handler: WSRouteHandler): WS {
    const nsp = this.io.of(this.namespace)
    const skipAuth = this.skipAuth
    const middlewareChain = chain(this.middlewares)

    nsp.on('connection', socket => socket.on(route, async (packet, cb) => {
      const { token, payload } = packet

      if (skipAuth && !jwtVerify(token)) {
        return cb(Response.err('Authentication failed'))
      }

      try {
        await middlewareChain(payload)()
        cb(Response.ok(await handler(payload)))
      } catch (error) {
        cb(Response.err(error.message))
      }
    }))

    return (this.skipAuth = false, this)
  }
}

export default new WS()