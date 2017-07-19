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

wsapi.connect('doge')

try {
  wsapi.send('login', { key: 'a' })
  wsapi.send('test', { key: 'a' })
} catch (error) {
  console.error(error);
}