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

  public connect(token: string): void {
    this.ws = io('localhost:13001/api', { query: { token } })
    this.token = token
  }

  public send<T>(api: string, payload: any): Promise<T> {
    if (this.queue.has(api)) throw new WSAPIError()

    return new Promise((resolve, reject) => {
      this.queue.add(api)

      let packet = { token: this.token, payload }
      this.ws.emit(api, packet, (data: any) => {
        this.queue.delete(api)

        let res = new WSAPIResponse<T>(data.code, data.payload)
        console.log(res);
        res.isOk ? resolve(res.payload) : reject(res)
      })
    })
  }
}

export default new WSAPI()