import * as types from '../mutation-types'
import { INIT_AFTER_LOADING, FETCH_ESTIMATED, FETCH_REAL } from '../action-types'
import * as status from '../status-types'
import storage from 'api/spreadsheet/data/config'
import data from 'api/spreadsheet/data'
import Vue from 'vue'

const state = {
  status: null, // To display the status to the user (Loading component).
  storage // Main object containing, data and file urls by lang.
}

const getters = {

  // Return a set of files in the desired locale, if there isn't, throw an error.
  filesLocalized: (state, getters, fallbackLang = false) => {
    return Object.entries(state.storage).map(property => {
      let localized = {}
      localized.property = property[0]
      if (property[1][getters.currentLocale]) {
        localized.filename = property[1][getters.currentLocale]
      } else {
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

    Promise.all(localized.map(file => data.fetchDB(file)))
    .then(response => {
      response.map(result => {
        let payload = {
          type: types.UPDATE_DB,
          property: result.property,
          data: result.data
        }

        let uniques = store.getters[result.property].u
        if (uniques) {
          Object.keys(uniques).map(uGet => {
            let found = result.data.find(dbRow => {
              return uGet === dbRow.title
            })
            uniques[uGet] = found.value
          })

          payload.u = uniques
        }

        store.commit(payload)
      })

      store.dispatch(INIT_AFTER_LOADING)
    })
    .catch(error => {
      store.commit(types.LOAD_DB_ERROR, error)
    })
  },


  [FETCH_ESTIMATED] ({state, commit, getters}) {
    let file = state.storage.estimated_data_file[getters.currentLocale]

    return data.fetchDB({property: 'estimated_data_file', filename: file})
    .then(response => {
      response.data = response.data.map(c => {
        for (var item in c) {
          if (c.hasOwnProperty(item)) {
            let institue = item.split('-')
            if (institue.length === 2) {
              if (c.estimations === undefined) c.estimations = {}
              if (c.estimations[institue[0]] === undefined) c.estimations[institue[0]] = {}
              c.estimations[institue[0]][institue[1]] = c[item]
              delete c[item]
            }
          }
        }
        let max = Object.keys(c.estimations).reduce((a, b) => {
          if (c.estimations[b].max === null) return a
          return c.estimations[a].max > c.estimations[b].max ? a : b
        })
        c.estimations[max].isMax = true
        let min = Object.keys(c.estimations).reduce((a, b) => {
          if (c.estimations[b].min === null) return a
          return c.estimations[a].min < c.estimations[b].min ? a : b
        })
        c.estimations[min].isMin = true
        return c
      })
      commit({
        type: types.UPDATE_DB,
        property: response.property,
        data: response.data
      })
    })
  },


  [FETCH_REAL] ({state, commit, getters}) {
    let file = state.storage.totalization_data_file[getters.currentLocale]

    return data.fetchDB({property: 'totalization_data_file', filename: file})
    .then(response => {
      commit({
        type: types.UPDATE_DB,
        property: response.property,
        data: response.data
      })
    })
  }
}

const mutations = {

  [types.LOAD_DB] (state, files) {
    state.status = status.LOADING
  },

  // When a db is loaded, replace the data entry in the storage object.
  [types.UPDATE_DB] (state, dbObject) {
    if (state.storage[dbObject.property].data) state.storage[dbObject.property].data = dbObject.data
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
Object.entries(storage).map(entry => {
  Vue.set(getters, entry[0], () => {
    let gttrs = {name: entry[0], data: entry[1].data}
    if (entry[1].u) {
      gttrs.u = {}
      Object.entries(entry[1].u).map(row => {
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
