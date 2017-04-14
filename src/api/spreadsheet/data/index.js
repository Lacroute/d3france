import Vue from 'vue'
import config from '../config'

export default {

  fetchDB (file) {
    return Vue.http.get(config.urlOf(file.filename))
    .then(response => {
      return {
        property: file.property,
        data: response.body
      }
    })
    .catch(error => {
      throw new Error('Cannot fetch ' + error.url)
    })
  }
}
