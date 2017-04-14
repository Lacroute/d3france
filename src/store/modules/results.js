import { RESULTS_FETCHING, UPDATE_CONTEXT_NAME, RESULTS_FETCHED, RESET_RESULTS, CANDIDATES_FETCHED, DB_LOADED, FETCHING_WINNERS } from '../mutation-types'
import { FETCH_DETAILS, FETCH_CANDIDATES, FETCH_COUNTRY_DETAILS, COUNTRY_FETCHED, INIT_AFTER_LOADING, FETCH_ESTIMATED, FETCH_REAL, FETCH_MAP_UPDATE, FETCH_WINNERS } from '../action-types'
import { PODIUM_DATA_MODE } from 'utils/constants'
import apiVote from 'api/vote'

const state = {
  candidates: {},
  country: {
    ranking: [],
    abstention: {
      absolute: null,
      percentage: null
    },
    noVote: {
      absolute: null,
      percentage: null
    },
    voting: {
      absolute: null,
      percentage: null
    }
  },
  ranking: [],
  abstention: {
    absolute: null,
    percentage: null
  },
  noVote: {
    absolute: null,
    percentage: null
  },
  voting: {
    absolute: null,
    percentage: null
  },
  isFetching: false,
  isFetchingWinners: false
}


const getters = {

}


const actions = {
  [FETCH_DETAILS] ({commit, getters}) {
    commit({
      type: RESULTS_FETCHING,
      status: true
    })

    let routeIds = getters.isFirstLevelWeight ? getters.routeIds.slice(1) : getters.routeIds
    let params = {
      round: getters.routeRound,
      routeIds: routeIds
    }
    apiVote.fetchResultsOf(params)
    .then(
      success => {
        if (success.names) {
          commit({
            type: UPDATE_CONTEXT_NAME,
            names: success.names
          })
        }
        commit({
          type: RESULTS_FETCHING,
          status: false
        })
        if (!success.data) return
        let votes = success.data ? success.data : success
        commit({
          type: RESULTS_FETCHED,
          votes: votes
        })
      },
      fail => {
        commit({
          type: RESULTS_FETCHING,
          status: false
        })
      }
    )
  },


  [FETCH_CANDIDATES] ({commit, getters}) {
    let params = {
      round: getters.routeRound
    }
    return apiVote.fetchCandidates(params)
    .then(
      success => {
        commit({
          type: CANDIDATES_FETCHED,
          candidates: success
        })
      },
      fail => {
        console.error(FETCH_CANDIDATES, 'failed')
        console.log(fail)
      }
    )
  },


  [INIT_AFTER_LOADING] ({getters, dispatch, commit}) {
    dispatch(FETCH_CANDIDATES)
    .then(_ => {
      commit(DB_LOADED)
      dispatch(FETCH_DETAILS)
      dispatch(FETCH_COUNTRY_DETAILS)
    })
  },


  [FETCH_WINNERS] ({commit, getters, rootState}) {
    let params = {
      round: getters.routeRound,
      currentZoomLevelWeight: rootState.zoomstate.currentZoomLevelWeight,
      geoKey: getters.nextGeoKey,
      routeIds: getters.routeIds
    }

    commit({
      type: FETCHING_WINNERS,
      status: true
    })
    return apiVote.fetchWinners(params)
    .then(response => {
      commit({
        type: FETCHING_WINNERS,
        status: false
      })
      return response
    })
  },


  [FETCH_COUNTRY_DETAILS] ({commit, getters, dispatch}) {
    let mode = PODIUM_DATA_MODE[getters.status_data_file.u.podium_data_mode]
    if (mode === undefined) {
      console.error('unknown mode')
      return
    }

    switch (mode) {
      case PODIUM_DATA_MODE.real: {
        dispatch(FETCH_REAL)
        break
      }
      case PODIUM_DATA_MODE.estimated: {
        dispatch(FETCH_ESTIMATED)
        break
      }
    }
  },


  [FETCH_MAP_UPDATE] ({dispatch}) {
    dispatch(FETCH_DETAILS)
  }
}


const mutations = {
  [RESULTS_FETCHING] (state, payload) {
    console.time(`[STORE RESULTS] mutation ${RESULTS_FETCHING}`)

    state.isFetching = payload.status

    console.timeEnd(`[STORE RESULTS] mutation ${RESULTS_FETCHING}`)
  },


  [RESULTS_FETCHED] (state, payload) {
    console.time(`[STORE RESULTS] mutation ${RESULTS_FETCHED}`)


    state.ranking = payload.votes.resultats
    state.abstention.percentage = payload.votes.abstention.rapportinscrit.toFixed(2)
    state.abstention.absolute = payload.votes.abstention.nombre
    state.voting.percentage = payload.votes.votants.rapportinscrit.toFixed(2)
    state.voting.absolute = payload.votes.votants.nombre
    state.noVote.percentage = (payload.votes.blancs.rapportvotant + payload.votes.nuls.rapportvotant).toFixed(2)
    state.noVote.absolute = (payload.votes.blancs.nombre + payload.votes.nuls.nombre)

    console.timeEnd(`[STORE RESULTS] mutation ${RESULTS_FETCHED}`)
  },


  [RESET_RESULTS] (state) {
    console.time(`[STORE RESULTS] mutation ${RESET_RESULTS}`)

    state.ranking = []
    state.abstention = null
    state.voting = null
    state.noVote = null

    console.timeEnd(`[STORE RESULTS] mutation ${RESET_RESULTS}`)
  },


  [CANDIDATES_FETCHED] (state, payload) {
    console.time(`[STORE RESULTS] mutation ${CANDIDATES_FETCHED}`)

    payload.candidates.map(c => (state.candidates[c.id] = c))

    console.timeEnd(`[STORE RESULTS] mutation ${CANDIDATES_FETCHED}`)
  },


  [COUNTRY_FETCHED] (state, payload) {
    console.time(`[STORE RESULTS] mutation ${COUNTRY_FETCHED}`)

    console.log(payload)

    state.country.ranking = payload.votes.resultats
    state.country.abstention.percentage = payload.votes.abstention.rapportinscrit.toFixed(2)
    state.country.abstention.absolute = payload.votes.abstention.nombre
    state.country.voting.percentage = payload.votes.votants.rapportinscrit.toFixed(2)
    state.country.voting.absolute = payload.votes.votants.nombre
    state.country.noVote.percentage = (payload.votes.blancs.rapportvotant + payload.votes.nuls.rapportvotant).toFixed(2)
    state.country.noVote.absolute = (payload.votes.blancs.nombre + payload.votes.nuls.nombre)

    console.timeEnd(`[STORE RESULTS] mutation ${COUNTRY_FETCHED}`)
  },


  [FETCHING_WINNERS] (state, payload) {
    state.isFetchingWinners = payload.status
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
