import Vue from 'vue'
import app from './app.vue'
import router from './route'

new Vue({
  el: '#app',
  router,
  render: h => h(app)
})

import io from 'socket.io-client'
import wsapi from './lib/wsapi'

(async function () {
  wsapi.connect()

  try {
    // await wsapi.send('user/register', { name: 'doge', password: '123456' })
    // let { token } = await wsapi.send<any>('user/login', { name: 'doge', password: '123456' })
    // wsapi.setToken(token)
    await wsapi.send('Knock Knock')
    await wsapi.send('fakeone')
  } catch (error) {
    console.error(error);
  }
})()