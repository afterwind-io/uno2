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
    await wsapi.send('user/login', { name: 'doge', password: '123456' })
    // await wsapi.send('Knock Knock')
  } catch (error) {
    console.error(error);
  }
})()