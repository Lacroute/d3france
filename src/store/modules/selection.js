import { SELECT_ID, UPDATE_CONTEXT_NAME, RESET_HISTORY_UNDER, UPDATE_COUNTRY_GEOKEY, HISTORY_CORRECTION } from '../mutation-types'
import { FETCH_DETAILS, ZOOM_UPDATED_BY_WEIGHT, ZOOM_UPDATED_BY_GEOKEY, UPDATE_ZOOM_MODE, GUARANTEE_HISTORY } from '../action-types'
import { GEO_KEYS, DEFAULT_ZOOM_LEVEL, COUNTRY_CONTEXT_WINNERS } from 'utils/constants.js'

const state = {
  history: {
    3: {
      geoId: null,
      geoKey: GEO_KEYS.CITY,
      featureName: null
    },
    2: {
      geoId: null,
      geoKey: GEO_KEYS.DEPARTMENT,
      featureName: null
    },
    1: {
      geoId: null,
      geoKey: GEO_KEYS.REGION,
      featureName: null
    },
    0: {
      geoId: DEFAULT_ZOOM_LEVEL.geoId,
      geoKey: DEFAULT_ZOOM_LEVEL.geoKey,
      featureName: DEFAULT_ZOOM_LEVEL.featureName
    }
  },

  borderCrossed: false,

  findHistoryByGeoKey (geoKey) {
    return Object.values(this.history).slice(1).find(level => level.geoKey === geoKey)
  }
}


const getters = {
  nextGeoKeys: (state, getters) => {
    let geoKeys = {}
    Object.entries(getters.nextZoomLevelWeights).map(entry => {
      geoKeys[entry[0]] = state.history[entry[1]] ? state.history[entry[1]].geoKey : null
    })
    return geoKeys
  },

  nextGeoKey: (state, getters, rootState) => getters.nextGeoKeys[rootState.zoomstate.currentZoomLevelWeight],

  prevGeoKeys: (state, getters) => getters.prevZoomLevelIds.map(levelId => state.history[levelId] ? state.history[levelId].geoKey : null),

  routeIds: (state, getters) => {
    // RULES:
    // Return an array of selected features ids
    // If this is country level, returns 'regions' or 'departements', function of state
    // else, remove the country level param from the routeIds
    let rough = Object.values(state.history).filter(h => h.geoId !== null).map(h => h.geoId)
    rough = rough.map(id => id === DEFAULT_ZOOM_LEVEL.geoId ? COUNTRY_CONTEXT_WINNERS[state.history[0].geoKey] : id)
    if (!getters.isFirstLevelWeight) rough.shift()
    return rough
  }
}


const actions = {
  [ZOOM_UPDATED_BY_GEOKEY] ({commit}, payload) {
    commit({
      type: RESET_HISTORY_UNDER,
      levelId: payload.levelId
    })
    commit({
      type: SELECT_ID,
      ...payload
    })
  },


  [ZOOM_UPDATED_BY_WEIGHT] ({commit, getters, dispatch}, payload) {
    commit({
      type: RESET_HISTORY_UNDER,
      ...payload
    })
    dispatch(FETCH_DETAILS)
  },


  [UPDATE_ZOOM_MODE] ({commit}, geoKey) {
    commit({
      type: UPDATE_COUNTRY_GEOKEY,
      geoKey: geoKey
    })
  },


  [GUARANTEE_HISTORY] ({commit, dispatch}, correction) {
    commit({
      type: HISTORY_CORRECTION,
      correction: correction
    })
    dispatch(FETCH_DETAILS)
  }
}


const mutations = {
  [SELECT_ID] (state, payload) {
    console.time(`[STORE SELECTION] mutation ${SELECT_ID}`)

    if (state.history[payload.levelId].geoId !== null && payload.zoomWay !== 0) {
      state.borderCrossed = true
    } else {
      state.borderCrossed = false
    }
    state.history[payload.levelId].geoId = payload.geoId

    console.timeEnd(`[STORE SELECTION] mutation ${SELECT_ID}`)
  },


  [UPDATE_CONTEXT_NAME] (state, payload) {
    console.time(`[STORE SELECTION] mutation ${UPDATE_CONTEXT_NAME}`)

    Object.entries(payload.names).map(entry => {
      state.findHistoryByGeoKey(entry[0]).featureName = entry[1]
    })

    console.timeEnd(`[STORE SELECTION] mutation ${UPDATE_CONTEXT_NAME}`)
  },


  [RESET_HISTORY_UNDER] (state, payload) {
    console.time(`[STORE SELECTION] mutation ${RESET_HISTORY_UNDER}`)

    Object.keys(state.history)
    .filter(levelWeight => payload.levelId < +levelWeight)
    .map(levelWeight => {
      state.history[levelWeight].geoId = null
      state.history[levelWeight].featureName = null
    })

    console.timeEnd(`[STORE SELECTION] mutation ${RESET_HISTORY_UNDER}`)
  },


  [UPDATE_COUNTRY_GEOKEY] (state, payload) {
    console.time(`[STORE SELECTION] mutation ${UPDATE_COUNTRY_GEOKEY}`)

    state.history[0].geoKey = payload.geoKey

    console.timeEnd(`[STORE SELECTION] mutation ${UPDATE_COUNTRY_GEOKEY}`)
  },


  [HISTORY_CORRECTION] (state, payload) {
    console.time(`[STORE SELECTION] mutation ${HISTORY_CORRECTION}`)

    let correction = payload.correction
    let geoId = correction.slice(4)
    let level = state.findHistoryByGeoKey(correction.slice(0, 3))
    if (level.geoId && level.geoId !== geoId) {
      state.borderCrossed = true
    } else {
      state.borderCrossed = false
    }
    level.geoId = geoId

    console.timeEnd(`[STORE SELECTION] mutation ${HISTORY_CORRECTION}`)
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
