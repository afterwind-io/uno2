import { WSRouteMiddleware, WSRouteInfo } from './wsrouter.type'
import Response from '../util/response'

const resWrapper: WSRouteMiddleware = async (context, next) => {
  try {
    await next()

    if (context.response.constructor !== Response) {
      context.response = Response.ok(context.response)
    }
  } catch (error) {
    context.response = Response.err(error.message)
    // console.error(error)
  }
}

export default resWrapper