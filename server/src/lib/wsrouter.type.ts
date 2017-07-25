export type WSRouteHandler = (param: any) => Promise<any>
export type WSRouteMiddleware = (context: WSRouteInfo, next: () => Promise<void>) => Promise<void>
export type WSRouteInfo = {
  namespace: string,
  route: string,
  payload: any,
  response: any
}