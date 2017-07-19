import router from './util/router'

import './controller/userCtrl'

router.post('/ping', async (ctx, next) => {
  ctx.body = 'pong'
})

export default router.routes()