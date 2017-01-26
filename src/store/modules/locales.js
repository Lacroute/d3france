import localeApi from 'api/localeApi'
import * as types from '../mutation-types'
import * as status from '../status-types'
import Vue from 'vue'

const state = {
  current: null, // Store wich locale is used.
  queued: null, // Queue the locale when the files will be ready.
  status: null // To display the status to the user (Loading component).
}

const getters = {
  // Expose locale in use.
  currentLocale: state => state.current,
  queuedLocale: state => state.queued
}

const actions = {
  // Fetch the global file and init the translation system.
  fetchLocale (store) {
    store.commit(types.LOAD_LOCALE)

    localeApi.fetchLocale(
      (json) => {
        // Init locales in vue-i18n system.
        Object.keys(json).forEach((lang) => {
          Vue.locale(lang, json[lang])
        })

        store.commit(types.LOCALE_LOADED)
        store.dispatch('updateLocale', store.state.queued)
      },
      () => {

        store.commit(types.LOCALE_ERROR)
      }
    )
  },

  // Main entry to update the locale, then update datas
  updateLocale (store, lang) {
    // If load cicle never started
    if (!store.state.status) {
      store.commit(types.QUEUE_LOCALE, lang)
      store.dispatch('fetchLocale')
    } else if (store.state.status === status.LOADED) {
      store.commit(types.UPDATE_LOCALE, lang)
      try {
        store.dispatch('fetchDbs', store.getters.filesLocalized)
      } catch (e) {
        store.dispatch('fetchDbs', store.getters.filesLocalized, true)
      }

    }
  },
}

const mutations = {

  [types.QUEUE_LOCALE] (state, lang) {
    state.queued = lang
  },

  [types.LOAD_LOCALE] (state) {
    state.status = status.LOADING
  },

  [types.LOCALE_LOADED] (state) {
    state.status = status.LOADED
  },

  [types.UPDATE_LOCALE] (state, lang) {
    state.current = lang
    Vue.config.lang = lang
  },

  [types.LOCALE_ERROR] (state) {
    state.status = status.LOAD_ERROR
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
