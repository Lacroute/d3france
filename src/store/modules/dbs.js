import * as types from '../mutation-types'
import * as status from '../status-types'
import storage from 'utils/configStorage'
import dbApi from 'api/dbApi'
import Vue from 'vue'

const state = {
  status: null, // To display the status to the user (Loading component).
  storage // Main object containing, data and file urls by lang.
}

const getters = {

  // Return a set of files in the desired locale, if there isn't, throw an error.
  filesLocalized: (state, getters, fallbackLang = false) => {
    return Object.entries(state.storage).map( property => {
      let localized = {}
      localized.property = property[0]
      if (property[1][getters.currentLocale])
        localized.filename = property[1][getters.currentLocale]
      else {
        console.warn(`No ${property[0]} config found for locale '${getters.currentLocale}', serve fallbackLang '${Vue.config.fallbackLang}' instead.`)
        localized.filename = property[1][Vue.config.fallbackLang]
      }
      return localized
    })
  },

  dbs: state => state.storage
}

const actions = {

  // Fetch an array of localized files.
  fetchDbs (store, localized) {
    store.commit(types.LOAD_DB)

    Promise.all(localized.map( file => dbApi.fetchDB(file)))
    .then( response => {
      response.map( result => {
        let payload = {
          type     : types.UPDATE_DB,
          property : result.property,
          data     : result.data
        }

        let uniques = store.getters[result.property].u
        if(uniques) {
          Object.keys(uniques).map( u_get => {
            let found = result.data.find( db_row => {
              return u_get === db_row.title
            })
            uniques[u_get] = found.value
          })

          payload.u = uniques
        }

        store.commit(payload)
      })

      store.commit(types.DB_LOADED)
    })
    .catch( error => {
      store.commit(types.LOAD_DB_ERROR, error)
    })
  }
}

const mutations = {

  [types.LOAD_DB] (state, files) {
    state.status = status.LOADING
  },

  // When a db is loaded, replace the data entry in the storage object.
  [types.UPDATE_DB] (state, dbObject) {
    if(state.storage[dbObject.property].data) state.storage[dbObject.property].data = dbObject.data
    if (dbObject.u) state.storage[dbObject.property].u = dbObject.u
  },

  [types.DB_LOADED] (state) {
    state.status = status.LOADED
  },

  [types.LOAD_DB_ERROR] (state, error) {
    state.status = status.LOAD_ERROR
    console.warn(error)
  }
}

// Add dynamic getters with the config file.
// A single file will be wrapped following this scheme
// {
//   name: first_data_file,
//   data: Array[],
//   u: {}
// }
Object.entries(storage).map( entry => {
  Vue.set(getters, entry[0], () => {
    let gttrs = {name: entry[0], data: entry[1].data}
    if(entry[1].u) {
      gttrs.u = {}
      Object.entries(entry[1].u).map( row => {
        gttrs.u[row[0]] = row[1]
      })
    }
    return gttrs
  })
})

// Export the module
export default {
  state,
  getters,
  actions,
  mutations
}
