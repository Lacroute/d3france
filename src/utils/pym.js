import Pym from 'pym.js'

let PymChild

/* eslint-disable no-new */
if(!PymChild) PymChild = new Pym.Child({ polling: 500 })

export default PymChild