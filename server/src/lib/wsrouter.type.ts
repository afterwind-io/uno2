export type WSRouteInfo = {
  namespace: string,
  route: string,
  payload: any,
  response: any
}
export type WSRouteMiddleware = (context: WSRouteInfo, next: () => Promise<void>) => Promise<void>
export type WSRouteHandler = (param: any) => Promise<any>
export type WSRouteHandlerMap = { [nsp: string]: { [route: string]: WSRouteMiddleware } }