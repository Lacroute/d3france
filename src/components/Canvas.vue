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
  name: 'Canvas',

  props: {
    width: Number,
    height: Number,
    projection: String,
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
      _simplify: null,
      _path: null,
      _canvas: null,
      _ctx: null,
      _areas: null,
      _meshes: null,

      minZ: 0,
    }
  },


  computed: {
    simplify () {
      let minZ = this.minZ
      return d3.geoTransform({
        point: function(x, y, z) {
          if (z >= minZ)
          this.stream.point(x, y)
        }
      })
    },

    transform () {
      return d3.geoIdentity()
      .clipExtent([[0, 0], [this.width, this.height]])
    },
  },


  created () {
    this.setupListener()
  },


  mounted () {
    console.log('*****')
    console.log(`Compute Canvas execution time, displayMesh: ${this.displayMesh}, displayArea: ${this.displayArea}`)
    console.time('Total')

    this.loadData()
    .then( _ => {
      this.initGraph()
    })
    .then( _ => {
      this.handleZoom()
    })
    .then( _ => {
      this.center()
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
      topojson.presimplify(topojsonData)

      this._areas = topojson.feature(
        topojsonData,
        topojsonData.objects[this.topofile.key]
      )

      this._meshes = topojson.mesh(
        topojsonData,
        topojsonData.objects[this.topofile.key],
        (a, b) => a !== b // don't draw a border twice
      )

      console.timeEnd('populate')
    },


    initGraph () {
      console.time('initGraph')
      bus.$emit('statusUpdate', STATUS.INIT_GRAPHIC)

      this._canvas = d3.select('#graph')
      .attr('width', this.width)
      .attr('height', this.height)

      this._ctx = this._canvas.node().getContext('2d')

      this._path = d3.geoPath()
      .projection({
        stream: s => this.simplify.stream(this.transform.stream(s))
      })
      .context(this._ctx)

      bus.$emit('statusUpdate', STATUS.GRAPHIC_READY)
      console.timeEnd('initGraph')
    },


    handleZoom () {
      console.time('handleZoom')
      this._canvas.call(this.zoom())
      console.timeEnd('handleZoom')
    },


    zoom () {
      return d3.zoom()
      .scaleExtent([1 / (1 << 5), 1 << 4])
      .on('zoom', this.onZoom)
    },


    onZoom () {
      let t = d3.event.transform
      this.minZ = 1 / (t.k * t.k)
      this.transform.translate([t.x, t.y]).scale(t.k)

      this.draw()
    },


    center () {
      console.time('center')
      this._canvas
      .call(
        this.zoom().transform,
        d3.zoomIdentity
        .scale(0.5)
        .translate(this.width / 2, 0)
      )
      console.timeEnd('center')
    },


    draw () {
      console.time('draw')
      bus.$emit('statusUpdate', STATUS.DRAWING)
      this._ctx.clearRect(0, 0, this.width, this.height);

      // if (this.displayArea) {
          // this._ctx.beginPath()
          // this._path(this._areas)
          // this._ctx.fillStyle = '#3c3c3b'
          // this._ctx.fill()
      // }

      if (this.displayMesh) {
          this._ctx.beginPath()
          this._path(this._meshes)
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
      this._simplify = null
      this._path = null
      this._canvas = null,
      this._ctx = null
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
