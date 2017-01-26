import Vue from 'vue'
import apiConfig from 'utils/configApi'

export default {

  // Fetch remote global translation file.
  fetchLocale (resolve, reject) {
    Vue.http.get(apiConfig._url(apiConfig.globals)).then(
    (response) => {
      let json = response.body

      if (Object.keys(json).length === 0) {
        reject(new Error('locale empty !!'))
      } else {
        json = this.formatMultiData(json)

        resolve(json)
      }
    },
    (response) => {
      reject(new Error('fetchLocale rejected'))
    })
  },

  // Format data to follow the scheme
  // {
  //   en: {
  //     foo: 'foo-en'
  //     bar: 'bar-en'
  //   },
  //   fr: {
  //     foo: 'foo-fr'
  //     bar: 'bar-fr'
  //   }
  // }
  formatMultiData (raw) {
    let locales = {}
    let entries = Object.values(raw)

    entries.map((word) => {
      let items = Object.entries(word)
      let key = items.find( i => i[0] === 'title')[1]
      items.map((lang) => {
        if(lang[0] !== 'title' && locales[lang[0]] === undefined)
          locales[lang[0]] = {}

        if(lang[0] !== 'title')
          locales[lang[0]][key] = lang[1]
      })
    })

    return locales
  }
}
