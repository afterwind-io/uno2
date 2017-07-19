import ws from '../util/websocket'
import Response from '../util/response'

ws.of('/api')

ws.on('ping', async packet => {
  return Response.ok('pong')
})