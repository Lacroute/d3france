const config = {
  SPREADSHEET_ID: 'presidentialfr17-livemap',
  SERVER: 'https://graphics.afpforum.com',
  FILE_EXTENSION: '.json',
  globals: 'globals',

  // Automatique switch between data function of
  get BASE () {
    return process.env.NODE_ENV === 'development' ? `${this.SERVER}/data/${this.SPREADSHEET_ID}/preprod/` : `${this.SERVER}/data/${this.SPREADSHEET_ID}/`
  },

  // Helper to build clean url.
  urlOf (filename) {
    return this.BASE + filename + this.FILE_EXTENSION
  }
}

export default config
