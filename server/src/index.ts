import * as Koa from 'koa'
import * as KoaJWT from 'koa-jwt'
import * as BodyParser from 'koa-bodyparser'
import * as Socket from 'socket.io'
import * as CONFIG from './config'
import router from './router'
import './wsroutes'

const app = new Koa()

app.use(KoaJWT({ secret: CONFIG.secret }).unless({ path: /login/ }))
app.use(BodyParser())
app.use(router)

app.listen(13000);