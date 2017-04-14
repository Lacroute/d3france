const storage = {
  'commons_data_file': { // Data for the common components
    data: true,
    fr: 'commons_fr',
    en: 'commons_en',
    es: 'commons_es',
    de: 'commons_de',
    it: 'commons_it'
  },
  'status_data_file': {
    data: false,
    u: {
      election_status: null,
      podium_data_mode: null,
      podium_explanation: null,
      map_explanation: null
    },
    fr: 'status',
    en: 'status',
    es: 'status',
    de: 'status',
    it: 'status'
  },
  'estimated_data_file': {
    data: true,
    fr: 'estimated',
    en: 'estimated',
    es: 'estimated',
    de: 'estimated',
    it: 'estimated'
  },
  'estimated_participation_data_file': {
    data: true,
    fr: 'estimated_participation',
    en: 'estimated_participation',
    es: 'estimated_participation',
    de: 'estimated_participation',
    it: 'estimated_participation'
  },
  'totalization_data_file': {
    data: true,
    fr: 'totalizations',
    en: 'totalizations',
    es: 'totalizations',
    de: 'totalizations',
    it: 'totalizations'
  },
  'participation_data_file': {
    data: true,
    fr: 'participations',
    en: 'participations',
    es: 'participations',
    de: 'participations',
    it: 'participations'
  }
}

export default storage
