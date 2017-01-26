import Vue from 'vue'
import apiConfig from 'utils/configApi'

export default {

  fetchDB (file) {
    return Vue.http.get(apiConfig._url((file.filename)))
    .then( response => {
      return {
        property : file.property,
        data: response.body
      }
    })
    .catch(error => {
      throw new Error('Cannot fetch ' + error.url)
    })
  }
}
