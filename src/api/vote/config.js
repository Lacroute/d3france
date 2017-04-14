// Base url of vote api
export const BASE = process.env.NODE_ENV === 'development' ? 'http://dev-api-elections.eu-central-1.elasticbeanstalk.com' : 'https://d3450cbchwiscc.cloudfront.net'

// The polls
export const FR_2012 = 'PR2012'
export const FR_ESSAI_2017 = 'EssaiPR2017'
export const FR_2017 = 'PR2017'
export const POLLS = FR_2017 // MAIN POLLS CONTROL

// The rounds
export const ROUNDS = {
  1: 'resultatsT1',
  2: 'resultatsT2',
  default: 'resultatsT1'
}

// The routes, "code" is for urlBuilder in ./index.js
export const ROUTES = {
  details: {
    code: 0,
    url: ''
  },
  context_winners: {
    code: 1,
    url: 'contextWinners'
  },
  city_count: {
    code: 2,
    url: 'nbCommunes'
  },
  candidates: {
    code: 3,
    url: 'candidates'
  }
}

// The status of the election
export const STATUS = {
  live: {
    code: 0,
    t: 'totalized_results'
  },
  waiting_approval: {
    code: 1,
    t: 'totalized_results'
  },
  approuved: {
    code: 2,
    t: 'final_results'
  },
  rejected: {
    code: 3,
    t: 'false_results'
  },
  default: {
    code: 0,
    t: 'totalized_results'
  }
}
