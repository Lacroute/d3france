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
    mode: String,
    displayMesh: Boolean,
    displayArea: Boolean,
    topofile: Object,
  },

  // Prefix with '_' for data attribute disable the two way binding.
  data () {
    return {
      _projection: null,
      _simplify: null,
      _path: null,
      _canvas: null,
      _ctx: null,
      _zoom: null,

      _communes: null,
      _communesMeshes: null,
      _dpts: null,
      _dptsMeshes: null,
      _regs: null,
      _regsMeshes: null,

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


    // Current Stroke set in action.
    strokeWrapper () {
      let stroke
      if (this.mode === 'regions') {
        stroke = this._regsMeshes

      } else if (this.mode === 'departements') {
        stroke = this._dptsMeshes

      } else if (this.mode === 'communes') {
        stroke = this._communesMeshes

      } else if (this.mode === 'auto') {
        stroke = this._regsMeshes

        if (this.minZ <= 0.05) {
          stroke = this._communes

        } else if (this.minZ <= 0.5) {
          stroke = this._dptsMeshes
        }
      }

      return stroke
    },


    // Current Fill set in action.
    fillWrapper () {
      let fill
      if (this.mode === 'regions') {
        fill = this._regs
      } else if (this.mode === 'departements') {
        fill = this._dpts
      } else if (this.mode === 'communes') {
        fill = this._communes
      } else if (this.mode === 'auto') {
        fill = this._regs
      }

      return fill
    }
  },


  created () {
    this.setupListener()
  },


  // Global initiation
  mounted () {
    console.log('*****')
    console.log(`Compute Canvas execution time, displayMesh: ${this.displayMesh}, displayArea: ${this.displayArea}`)
    console.time('Total')

    this.loadData()
    .then( _ => {
      this.initGraph()
    })
    .then( _ => {
      this.center()
    })
    .then( _ => {
      console.timeEnd('Total')
      console.log('*****')
    })
  },


  watch: {
    mode () {
      this.draw()
    },
  },


  methods : {

    // Bus initialisation for interface event. See MapContainer.vue
    setupListener () {
      bus.$on('clearAll', _ => this.clearAll())
      bus.$on('clearGraphic', _ => this.clearGraphic())
      bus.$on('initGraph', _ => this.initGraph())
      bus.$on('draw', _ => this.draw())
    },


    // Need to remove listeners on destruct.
    removeListener () {
      bus.$off('clearAll', this.clearAll)
      bus.$off('clearGraphic', this.clearGraphic)
      bus.$off('initGraph', this.initGraph)
      bus.$off('draw', this.draw)
    },


    // Asynchronous loading of data file. See src/utils/fileConfig.js
    loadData () {
      bus.$emit('statusUpdate', STATUS.LOADING)
      return this.$http.get(this.topofile.url)
      .then( response => {
        bus.$emit('statusUpdate', STATUS.LOADED)
        this.populate(response.data)
      })
    },


    // Map loaded data with topojson and store it.
    populate (topojsonData) {
      console.time('populate')

      topojson.presimplify(topojsonData)

      this._communes = topojson.feature(
        topojsonData,
        topojsonData.objects[this.topofile.key]
      )

      this._communesMeshes = topojson.mesh(
        topojsonData,
        topojsonData.objects[this.topofile.key],
        (a, b) => a !== b // don't draw external borders
      )

      this._dpts = this.populateGroup(topojsonData, 'dpt')
      this._dptsMeshes = this.populateMeshes(topojsonData, 'dpt')

      this._regs = this.populateGroup(topojsonData, 'reg')
      this._regsMeshes = this.populateMeshes(topojsonData, 'reg')

      console.timeEnd('populate')
    },


    // Helper to group by a `keyFilter` and merge the polygons.
    populateGroup (topojsonData, keyFilter) {
      return d3.nest()
      .key(d => d[keyFilter])
      .rollup(group => topojson.merge(topojsonData, group))
      .entries(topojsonData.objects[this.topofile.key].geometries)
    },


    // Helper to group by a `keyFilter` and unify the meshes.
    populateMeshes (topojsonData, keyFilter) {
      return topojson.mesh(
        topojsonData,
        topojsonData.objects[this.topofile.key],
        (a, b) => a[keyFilter] !== b[keyFilter]
      )
    },


    // Main initialisation for d3
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

      this.handleZoom()

      bus.$emit('statusUpdate', STATUS.GRAPHIC_READY)
      console.timeEnd('initGraph')
    },


    // Zoom Handler.
    handleZoom () {
      console.time('handleZoom')
      this._zoom = d3.zoom()
      .scaleExtent([1 / (1 << 5), 1 << 5])
      .on('zoom', this.onZoom)

      this._canvas.call(this._zoom)
      console.timeEnd('handleZoom')
    },


    // Zoom function
    onZoom () {
      let t = d3.event.transform
      this.minZ = 1 / (t.k * t.k)
      this.transform.translate([t.x, t.y]).scale(t.k)

      this.draw()
    },


    // Subjective centering.
    center () {
      console.time('center')
      this._canvas
      .call(
        this._zoom.transform,
        d3.zoomIdentity
        .scale(0.5)
        .translate(this.width / 2, 0)
      )
      console.timeEnd('center')
    },


    // Main drawing function.
    draw () {
      console.time('draw')
      bus.$emit('statusUpdate', STATUS.DRAWING)
      this._ctx.clearRect(0, 0, this.width, this.height);

      this.fill(this.fillWrapper)
      this.stroke(this.strokeWrapper)

      bus.$emit('statusUpdate', STATUS.COMPLETE)
      console.timeEnd('draw')
    },


    // Fill the polygons.
    fill(fillWrapper) {
      this._ctx.beginPath()
      this._ctx.fillStyle = '#3c3c3b'
      if (fillWrapper.length !== undefined) {
        // GroupBy case (departements, regions)
        fillWrapper.map( group => {
          this._path(group.value)
        })
      } else {
        // Communes case
        this._path(fillWrapper)
      }
      this._ctx.fill()
    },


    // Draw the strokes.
    stroke (strokeWrapper) {
      if (this.displayMesh) {
        this._ctx.beginPath()
        this._path(strokeWrapper)
        this._ctx.lineWidth = '.2'
        this._ctx.strokeStyle = '#efad01'
        this._ctx.stroke()
      }
    },


    // Clear all objects.
    clearAll () {
      this._ctx.clearRect(0, 0, this.width, this.height)
      this._zoom.on('zoom', null)

      this._projection = null
      this._simplify = null
      this._path = null
      this._canvas = null,
      this._ctx = null

      bus.$emit('statusUpdate', STATUS.LOADED)
    },


    // Clear canvas only.
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
