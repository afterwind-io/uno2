import io from 'socket.io-client'

class WSAPIError extends Error { }

class WSAPIResponse<T> {
  public code: number
  public payload: T

  constructor(code: number, payload: T) {
    this.code = code
    this.payload = payload
  }

  get isOk() {
    return this.code === 0
  }
}

class WSAPI {
  private queue: Set<string> = new Set()
  private ws: SocketIOClient.Socket
  private token: string = ''

  public connect(): void {
    this.ws = io('localhost:13001/api')
  }

  public setToken(token: string) {
    this.token = token
  }

  public send<T>(api: string, payload: any = ''): Promise<T> {
    if (this.queue.has(api)) throw new WSAPIError()

    return new Promise((resolve, reject) => {
      this.queue.add(api)

      let packet = { token: this.token, route: api, payload }
      this.ws.emit('request', packet, (data: WSAPIResponse<T>) => {
        this.queue.delete(api)

        console.log(data)
        let res = new WSAPIResponse<T>(data.code, data.payload)
        res.isOk ? resolve(res.payload) : reject(res)
      })
    })
  }
}

export default new WSAPI()