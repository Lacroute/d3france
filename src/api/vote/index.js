import Vue from 'vue'
import * as config from './config'


export default {
  urlBuilder (params) {
    let url = `${config.BASE}/${config.POLLS}/${params.round}/`
    switch (params.route.code) {
      case config.ROUTES.details.code: {
        url += params.routeIds.join('/')

        break
      }

      case config.ROUTES.context_winners.code: {
        url += params.routeIds.join('/')
        url += '/'

        break
      }
    }

    url += params.route.url
    return url
  },


  fetchCandidates (routeRound) {
    let url = this.urlBuilder({
      route: config.ROUTES.candidates,
      ...routeRound
    })

    return Vue.http.get(url)
    .then(success => {
      return success.body
    })
    .catch(error => console.error('[API VOTE] cannot fetch', error.url))
  },


  // Get the percentage of cities counted.
  fetchCounting (routeRound) {
    let url = this.urlBuilder({
      route: config.ROUTES.city_count,
      round: routeRound
    })

    return Vue.http.get(url)
    .then(
      success => {
        if (success.status === 204) return 0
        return success.body.percentage.toFixed(2)
      },
      fail => {
        console.log(fail)
      }
    )
    .catch(error => console.error('[API VOTE] cannot fetch', error.url))
  },


  // Get the winners of areas.
  fetchWinners (params) {
    console.time('fetchWinners')

    let url = this.urlBuilder({
      route: config.ROUTES.context_winners,
      ...params
    })

    console.log('fetchWinners', url)

    return Vue.http.get(url)
    .then(
      success => {
        console.timeEnd('fetchWinners')
        if (success.status === 204) {
          return null
        }
        let candidates = new Map()

        success.body.map(zone => {
          let id
          if (zone.winners.length === 1) id = `${zone.winners[0].id}`
          else id = zone.winners.map(w => w.id).join('_')

          if (!candidates.has(id)) candidates.set(id, new Map())
          candidates.get(id).set(`${params.geoKey}_${zone.id}`, 1)
        })

        return {candidates: candidates, geoKey: params.geoKey}
      },
      error => {
        switch (error.status) {
          case 0:
          case 500: {
            console.error('[API VOTE] cannot fetch', error.url)
            break
          }
          default: {
            console.error(`[API VOTE] error ${error.status} occured in "fetchWinners"`)
            console.log(error)
          }
        }
        return null
      }
    )
  },


  // Get a detailled result by area.
  fetchResultsOf (params) {
    let url = this.urlBuilder({
      route: config.ROUTES.details,
      ...params
    })

    console.log('fetchResultsOf', url)

    return Vue.http.get(url)
    .then(
      success => {
        console.log(success.status)
        if (success.status === 204) {
          console.log(success)
          return Promise.reject()
        }
        return success.body
      },
      error => {
        console.error(`[API VOTE] error ${error.status} occured in "fetchResultsOf"`)
        return Promise.reject()
      }
    )
  }
}
