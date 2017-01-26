import * as status from './status-types'

export const localesStatus = state => state.locales.status
export const dbsStatus     = state => state.dbs.status
export const isLoaded      = state => (state.locales.status === status.LOADED && state.dbs.status === status.LOADED && true)
