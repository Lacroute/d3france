import Vue from 'vue'
import './utils/pym'
import VueRouter from 'vue-router'
import VueResource from 'vue-resource'
import VueI18n from 'vue-i18n'
import MapContainer from './components/MapContainer'
import PodiumContainer from './components/PodiumContainer'
import FullContainer from './components/FullContainer'
import store from './store'
import { sync } from 'vuex-router-sync'


Vue.use(VueRouter)
Vue.use(VueResource)
Vue.use(VueI18n)

const router = new VueRouter({
  routes: [
    {
      path: '/', redirect: '/fr'
    },
    {
      path: '/:lang',
      name: 'full',
      component: FullContainer
    },
    {
      path: '/:lang/map',
      name: 'map',
      component: MapContainer
    },
    {
      path: '/:lang/podium',
      name: 'podium',
      component: PodiumContainer
    }
  ]
})

// Global guard for dynamic translation
router.beforeEach((to, from, next) => {
  let dest
  if (to.params.lang && to.params.lang !== Vue.config.lang) {
    try {
      store.dispatch('updateLocale', to.params.lang)
    } catch (error) {
      console.warn(error)
      console.warn(`Reroute to fallback lang: ${Vue.config.fallbackLang}.`)
      dest = {
        name: to.name,
        params: {
          lang: Vue.config.fallbackLang
        }
      }
    }
  }

  next(dest)
})
sync(store, router)

/* global window */
/* eslint no-undef: "error" */
Vue.config.fallbackLang = 'fr'
Vue.config.lang = '' // Init to nothing to force update cicle.
require('./utils/googleAnalytics')('UA-64253904-2')

/* eslint-disable no-new */
new Vue({
  router,
  store,
  el: '#app',
  render: h => h(require('./App'))
})
