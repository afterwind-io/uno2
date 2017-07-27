import Vue from 'vue'
import app from './app.vue'
import router from './route'

new Vue({
  el: '#app',
  router,
  render: h => h(app)
})