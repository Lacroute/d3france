import * as status from './status-types'
import { ROUNDS } from 'api/vote/config'

export const localesStatus = state => state.locales.status
export const dbsStatus = state => state.dbs.status
export const isLoaded = state => (state.locales.status === status.LOADED && state.dbs.status === status.LOADED && true)
export const routeRound = state => ROUNDS[state.route.query.round] ? ROUNDS[state.route.query.round] : ROUNDS.default
