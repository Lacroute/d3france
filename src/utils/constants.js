export const ZOOM_LEVEL = {
  CITY: {weight: 3, geoKey: 'cit'},
  DEPARTMENT: {weight: 2, geoKey: 'dpt'},
  REGION: {weight: 1, geoKey: 'reg'},
  COUNTRY: {weight: 0, geoKey: 'reg'}
}

export const DEFAULT_ZOOM_LEVEL = {
  geoId: 'country',
  featureName: 'france',
  weight: ZOOM_LEVEL.COUNTRY.weight,
  geoKey: ZOOM_LEVEL.DEPARTMENT.geoKey,
  nextWeight: ZOOM_LEVEL.DEPARTMENT.weight
}

export const COUNTRY_CONTEXT_WINNERS = {reg: 'regions', dpt: 'departements'}

export const COLORS = {
  BORDER: 'rgba(196, 212, 220, 0.2)',
  MESH: 'rgba(35, 44, 50, 0.3)',
  BACKGROUND: '#fff',
  FEATURE_SELECTED: 'rgba(35, 44, 50, 0.7)',
  SHADOW: 'rgba(0, 0, 0, 0.15)'
}

export const GEO_FILE = {
  base: 'static/geodata/topojson/',
  country_file: {
    reg: 'reg_country.json',
    dpt: 'dpt_country.json'
  }
}

export const GEO_KEYS = {
  CITY: 'cit',
  DEPARTMENT: 'dpt',
  REGION: 'reg',
  COUNTRY_BY_REG: 'regions',
  COUNTRY_BY_DPT: 'departements'
}

export const ZOOM_LEVELS = {
  CITY: 'city',
  DEPARTMENT: 'department',
  REGION: 'region',
  COUNTRY: 'country'
}

export const PODIUM_MODES = {
  ROW: 0,
  SQUARE: 1
}

export const PODIUM_DATA_MODE = {
  real: {
    t: 'real',
    code: 0
  },
  estimated: {
    t: 'estimated_results',
    code: 1
  },
  default: {
    t: 'real',
    code: 0
  }
}

export const LOCAL_STORAGE_KEY = 'fr_presidential_2017'
export const LOCAL_STORAGE_MAP_UNDERSTOOD = `${LOCAL_STORAGE_KEY}_understood`

// in seconds
export const PODIUM_FETCH_INTERVAL = 120000
export const MAP_FETCH_INTERVAL = 120000
