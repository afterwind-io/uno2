declare namespace SocketIO {
  interface Socket extends NodeJS.EventEmitter {
    use(fn: ( packet?: any, next?: ( err?: any ) => void ) => void)
  }
}