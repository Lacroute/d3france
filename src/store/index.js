import Vue from 'vue'
import Vuex from 'vuex'
import * as actions from './actions'
import * as getters from './getters'
import locales from './modules/locales'
import dbs from './modules/dbs'
import zoomstate from './modules/zoomstate'
import selection from './modules/selection'
import results from './modules/results'
import userActions from './modules/userActions'

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  actions,
  getters,
  modules: {
    locales,
    dbs,
    zoomstate,
    selection,
    results,
    userActions
  },
  strict: debug
})
