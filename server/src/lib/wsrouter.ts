import * as Socket from 'socket.io'
import { WSRouteHandler, WSRouteMiddleware, WSRouteInfo } from './wsrouter.type'

async function noop() { }

async function step(handlers: WSRouteMiddleware[], context: WSRouteInfo, pointer: number = 0) {
  if (pointer === handlers.length) return

  const next = async function () {
    await step(handlers, context, pointer + 1)
  }

  return await handlers[pointer](context, next)
}

const REQUEST_EVENT: string = 'request'
const FALLBACK_NAME: string = '__fallback__'

class WS {
  public server: SocketIO.Server
  private middlewares: WSRouteMiddleware[] = []
  private handlerMap: Map<string, WSRouteMiddleware> = new Map()
  private namespace: string = '/'

  constructor(...options: any[]) {
    this.server = Socket(options)
    this.initNamespace()
  }

  /**
   * 增加路由中间件
   * 
   * @param {WSRouteMiddleware} middleware 中间件定义
   * @memberof WS
   */
  use(middleware: WSRouteMiddleware) {
    return (this.middlewares.push(middleware), this)
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

    if (!this.hasInit(namespace)) {
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
  on(route: string, handler: WSRouteHandler): WS {
    return (this.handlerMap.set(route, this.wrapHandler(handler)), this)
  }

  otherwise(handler: WSRouteHandler): WS {
    return this.on(FALLBACK_NAME, handler)
  }

  private hasInit(namespace: string): boolean {
    const nsp = this.server.of(namespace)
    return nsp.eventNames().includes('connection')
  }

  private getHandler(route: string = FALLBACK_NAME): WSRouteMiddleware {
    let handlerName = this.handlerMap.has(route) ? route : FALLBACK_NAME
    return this.handlerMap.get(handlerName) || noop
  }

  private wrapHandler(handler: WSRouteHandler): WSRouteMiddleware {
    return async function handlerWrapper(context, next) {
      context.response = await handler(context.payload.param)
    }
  }

  private initNamespace() {
    const namespace = this.namespace
    const nsp = this.server.of(this.namespace)

    nsp.on('connection', socket => socket.on(REQUEST_EVENT, async (payload, cb) => {
      const { route } = payload
      const wrapper = this.getHandler(route)
      const handlerArr = [...this.middlewares, wrapper]

      try {
        let context = { namespace, route, payload, response: void 0 }
        await step(handlerArr, context)

        cb(context.response)
      } catch (error) {
        cb(error.message)
      }
    }))
  }
}

export default WS