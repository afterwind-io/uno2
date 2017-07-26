import * as Koa from 'koa'
import boot from './boot'
import './wsroutes'

const app = new Koa()
app.listen(13000)

boot()
