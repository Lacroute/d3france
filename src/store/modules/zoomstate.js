import { UPDATE_ZOOM_BY_LEVEL, UPDATE_COUNTRY_SPLIT } from '../mutation-types'
import { UPDATE_SELECTED_ID, UPDATE_ZOOM_LEVEL, ZOOM_UPDATED_BY_GEOKEY, ZOOM_UPDATED_BY_WEIGHT, UPDATE_ZOOM_MODE } from '../action-types'
import { DEFAULT_ZOOM_LEVEL } from 'utils/constants.js'

const state = {
  levels: {
    3: {
      id: 3,
      geoKey: 'cit',
      nextLevelWeight: null
    },
    2: {
      id: 2,
      geoKey: 'dpt',
      nextLevelWeight: 3
    },
    1: {
      id: 1,
      geoKey: 'reg',
      nextLevelWeight: 2
    },
    0: {
      id: DEFAULT_ZOOM_LEVEL.weight,
      geoKey: 'country',
      nextLevelWeight: DEFAULT_ZOOM_LEVEL.nextWeight
    }
  },

  currentZoomLevelWeight: 0,

  priorZoomLevelWeight: 0,

  way: 0,

  findLevelByGeoKey (geoKey) {
    return Object.values(this.levels).find(level => level.geoKey === geoKey)
  },

  findLevelById (levelId) {
    return Object.values(this.levels).find(level => level.id === levelId)
  }
}


const getters = {
  firstZoomLevelWeight: state => parseInt(Object.keys(state.levels).reduce((a, b) => a < b ? a : b)),

  lastZoomLevelWeight: state => parseInt(Object.keys(state.levels).reduce((a, b) => a > b ? a : b)),

  isFirstLevelWeight: (state, getters) => state.currentZoomLevelWeight === getters.firstZoomLevelWeight,

  isLastLevelWeight: (state, getters) => state.currentZoomLevelWeight === getters.lastZoomLevelWeight,

  currentZoomLevelName: state => state.levels[state.currentZoomLevelWeight].geoKey,

  nextZoomLevelWeights: state => {
    let nextIds = {}
    let i = 0
    while (i !== null) {
      nextIds[i] = state.levels[i].nextLevelWeight
      i = state.levels[i].nextLevelWeight
    }
    return nextIds
  },

  zoomWeightsOnView: state => {
    let onView = []
    let i = 0
    while (i <= state.currentZoomLevelWeight && i !== null) {
      onView.push(i)
      i = state.levels[i].nextLevelWeight
    }
    return onView
  },

  prevZoomLevelIds: state => Object.keys(state.levels).map(levelIdLoop => parseInt(Object.keys(state.levels).find(levelIdFind => state.levels[levelIdFind].nextLevelWeight === +levelIdLoop)))
}


const actions = {
  [UPDATE_SELECTED_ID] ({commit, dispatch, state}, newId) {
    commit({
      type: UPDATE_ZOOM_BY_LEVEL,
      level: state.findLevelByGeoKey(newId.slice(0, 3))
    })
    dispatch(
      ZOOM_UPDATED_BY_GEOKEY,
      { levelId: state.currentZoomLevelWeight, geoId: newId.slice(4), zoomWay: state.way }
    )
  },


  [UPDATE_ZOOM_LEVEL] ({commit, dispatch, state}, levelWeight) {
    commit({
      type: UPDATE_ZOOM_BY_LEVEL,
      level: state.levels[levelWeight]
    })
    dispatch(
      ZOOM_UPDATED_BY_WEIGHT,
      { levelId: state.currentZoomLevelWeight }
    )
  },


  [UPDATE_ZOOM_MODE] ({commit, dispatch}, geoKey) {
    commit({
      type: UPDATE_COUNTRY_SPLIT,
      geoKey: geoKey
    })
  }
}


const mutations = {
  [UPDATE_ZOOM_BY_LEVEL] (state, payload) {
    console.time(`[STORE ZOOM] mutation ${UPDATE_ZOOM_BY_LEVEL}`)

    let nextLevelWeight = payload.level ? payload.level.id : DEFAULT_ZOOM_LEVEL.id
    state.way = nextLevelWeight - state.currentZoomLevelWeight
    if (state.currentZoomLevelWeight !== nextLevelWeight) {
      state.priorZoomLevelWeight = state.currentZoomLevelWeight
      state.currentZoomLevelWeight = nextLevelWeight
    }

    console.timeEnd(`[STORE ZOOM] mutation ${UPDATE_ZOOM_BY_LEVEL}`)
  },


  [UPDATE_COUNTRY_SPLIT] (state, payload) {
    console.time(`[STORE ZOOM] mutation ${UPDATE_COUNTRY_SPLIT}`)

    let nextWeight = state.findLevelByGeoKey(payload.geoKey)
    state.levels[0].nextLevelWeight = nextWeight.id

    console.timeEnd(`[STORE ZOOM] mutation ${UPDATE_COUNTRY_SPLIT}`)
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
