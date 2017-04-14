import { MAP_UNDERSTOOD, UPDATE_VOTE_DISPLAY } from '../mutation-types'
import { LOCAL_STORAGE_MAP_UNDERSTOOD } from 'utils/constants'

const state = {
  understood: (localStorage.getItem(LOCAL_STORAGE_MAP_UNDERSTOOD) === 'true'),
  voteAsPercents: true
}

const mutations = {
  [MAP_UNDERSTOOD] (state) {
    state.understood = true
    localStorage.setItem(LOCAL_STORAGE_MAP_UNDERSTOOD, true)
  },


  [UPDATE_VOTE_DISPLAY] (state) {
    state.voteAsPercents = !state.voteAsPercents
  }
}

export default {
  state,
  mutations
}
