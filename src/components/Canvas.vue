<template>
  <div class="graphic">
    <canvas id="graph" moz-opaque></canvas>
  </div>
</template>

<script>
import * as d3 from 'd3'
import * as d3_composite from 'd3-composite-projections'
import * as topojson from 'topojson'
import * as STATUS from 'utils/graphicStatus'
import bus from 'emitter'


export default {
  name: 'Svg',

  props: {
    width: Number,
    height: Number,
    displayMesh: Boolean,
    displayArea: Boolean,
    topofile: Object,
  },

  // Prefix with '_' for data attribute disable the two way binding.
  data () {
    return {
      _topodata: null,
      _cities: null,

      _projection: null,
      _path: null,
      _ctx: null,
      _areas: null,
      _meshes: null
    }
  },


  created () {
    this.setupListener()
  },


  mounted () {
    console.log('*****')
    console.log('Compute canvas execution time')
    console.time('Total')

    this.loadData()
    .then( _ => {
      this.initGraph()
    })
    .then( _ => {
      this.draw()
    })
    .then( _ => {
      console.timeEnd('Total')
      console.log('*****')
    })
  },


  methods : {
    setupListener () {
      bus.$on('clearAll', _ => this.clearAll())
      bus.$on('clearGraphic', _ => this.clearGraphic())
      bus.$on('initGraph', _ => this.initGraph())
      bus.$on('draw', _ => this.draw())
    },


    removeListener () {
      bus.$off('clearAll', this.clearAll)
      bus.$off('clearGraphic', this.clearGraphic)
      bus.$off('initGraph', this.initGraph)
      bus.$off('draw', this.draw)
    },


    loadData () {
      bus.$emit('statusUpdate', STATUS.LOADING)
      return this.$http.get(this.topofile.url)
      .then( response => {
        bus.$emit('statusUpdate', STATUS.LOADED)
        this.populate(response.data)
      })
    },

    populate (topojsonData) {
      console.time('populate')

      this._topodata = topojsonData
      this._cities = topojson.feature(
        topojsonData,
        topojsonData.objects[this.topofile.key]
      )

      console.timeEnd('populate')
    },

    initGraph () {
      console.time('initGraph')
      bus.$emit('statusUpdate', STATUS.INIT_GRAPHIC)

      let canvas = d3.select('#graph')
      .attr('width', this.width)
      .attr('height', this.height)


      this._projection = d3_composite.geoConicConformalFrance()
      .scale(2300)
      .translate([this.width / 2, this.height / 2])

      this._ctx = canvas.node().getContext('2d')

      this._path = d3.geoPath()
      .projection(this._projection)
      .context(this._ctx)

      bus.$emit('statusUpdate', STATUS.GRAPHIC_READY)
      console.timeEnd('initGraph')
    },


    draw () {
      console.time('draw')
      bus.$emit('statusUpdate', STATUS.DRAWING)

      this._ctx.beginPath()
      if (this.displayMesh && this.displayArea){
        this._path(this._cities)
      } else if (this.displayMesh) {
        this._path(topojson.mesh(this._topodata))
      }

      if (this.displayArea) {
        this._ctx.fillStyle = '#3c3c3b'
        this._ctx.fill()
      }

      if (this.displayMesh) {
        this._ctx.lineWidth = '.2'
        this._ctx.strokeStyle = '#efad01'
        this._ctx.stroke()
      }


      bus.$emit('statusUpdate', STATUS.COMPLETE)
      console.timeEnd('draw')
    },


    clearAll () {
      this.clearGraphic()

      this._projection = null
      this._path = null
      this._rootNode = null
      this._areas = null
      this._meshes = null

      bus.$emit('statusUpdate', STATUS.LOADED)
    },

    clearGraphic () {
      this._ctx.clearRect(0, 0, this.width, this.height)

      bus.$emit('statusUpdate', STATUS.GRAPHIC_READY)
    }
  },


  destroyed () {
    this.removeListener()
  }
}
</script>

<style lang="scss">

</style>
