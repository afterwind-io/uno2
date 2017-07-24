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

function hasHandler(eventEmitter: NodeJS.EventEmitter, name: string): boolean {
  return eventEmitter.eventNames().indexOf(name) !== -1
}

enum WSRouteAccessibility {
  private = 'private',
  public = 'public'
}

type WSRouteHandler = (packet: any) => Promise<any>
type WSRouteHandlerEntry = {
  handler: WSRouteHandler,
  accessibility: WSRouteAccessibility
}
type WSRouteMiddleware = (context: WSRouteInfo, next: () => Promise<void>) => Promise<void>
type WSRouteInfo = {
  namespace: string,
  route: string,
  payload: any,
  response: Response<any>
}

const REQUEST_EVENT: string = 'request'
const FALLBACK_NAME: string = '__fallback__'

class WS {
  private io: SocketIO.Server
  private middlewares: WSRouteMiddleware[] = []
  private handlerMap: Map<string, WSRouteHandlerEntry> = new Map()
  private namespace: string = '/'
  private accessibility: WSRouteAccessibility = WSRouteAccessibility.private

  constructor() {
    this.io = Socket(CONFIG.port.websocket)
    this.of(this.namespace)
  }

  /**
   * 标识接下来的路由定义应跳过jwt验证
   * 
   * @readonly
   * @type {WS}
   * @memberof WS
   */
  get public(): WS {
    return (this.accessibility = WSRouteAccessibility.public, this)
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
    this.namespace = namespace

    const nsp = this.io.of(namespace)
    if (!hasHandler(nsp, 'connection')) {
      this.initNamespace()
    }

    return this
  }

  /**
   * 定义路由处理方法
   * 
   * @param {string} route 路由名称
   * @param {WSRouteHandler} handler 路由处理方法
   * @returns {WS} 当前的ws对象
   * @memberof WS
   */
  on(route: string, handler: WSRouteHandler, accessibility?: WSRouteAccessibility): WS {
    this.handlerMap.set(route, {
      handler,
      accessibility: this.accessibility
    })

    this.accessibility = WSRouteAccessibility.private

    return this
  }

  otherwise(handler: WSRouteHandler): WS {
    return this.on(FALLBACK_NAME, handler)
  }

  private initNamespace() {
    const namespace = this.namespace
    const nsp = this.io.of(this.namespace)

    nsp.on('connection', socket => socket.on(REQUEST_EVENT, async (packet, cb) => {
      const { token, route, payload } = packet
      const handler = this.handlerMap.get(this.handlerMap.has(route) ? route : FALLBACK_NAME)
      const accessibility = handler !== void 0 ? handler.accessibility : WSRouteAccessibility.private

      if (accessibility === WSRouteAccessibility.private && !jwtVerify(token)) {
        return cb(Response.err('Authentication failed'))
      }

      const wrapper: WSRouteMiddleware = async function handlerWrapper(info, next) {
        try {
          info.response = Response.ok(await handler.handler(payload))
        } catch (error) {
          info.response = Response.err(error.message)
        }
      }

      const handlerArr = [...this.middlewares, wrapper]

      try {
        let context = { namespace, route, payload, response: void 0 }
        await step(handlerArr, context)

        cb(context.response)
      } catch (error) {
        cb(Response.err(error.message))
      }
    }))
  }
}

async function step(handlers: WSRouteMiddleware[], context: WSRouteInfo, pointer: number = 0) {
  if (pointer === handlers.length) return

  const next = async function () {
    await step(handlers, context, pointer + 1)
  }

  return await handlers[pointer](context, next)
}

export default new WS()