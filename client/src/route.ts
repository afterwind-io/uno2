import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

import landing from './page/landing/landing.vue'
// import home from './pages/home.vue'
// import lobby from './pages/lobby.vue'
// import room from './pages/room.vue'
// import about from './pages/about.vue'
import p404 from './page/404/404.vue'

// import uno from './games/uno/index.vue'

const options: Router.RouterOptions = {
  scrollBehavior: () => ({ x: 0, y: 0 }),
  routes: [
    { path: '/', name: 'landing', component: landing },
    // { path: '/home',
    //   component: home,
    //   children: [
    //     { path: '', name: 'lobby', component: lobby },
    //     { path: '/room', name: 'room', component: room },
    //     { path: '/uno', name: 'uno', component: uno },
    //     { path: '/about', name: 'about', component: about }
    //   ]},
    { path: '/404', name: '404', component: p404 },
    { path: '*', redirect: '/404' }
  ]
}

export default new Router(options)
