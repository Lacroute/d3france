<template>
  <div class="graphic">
    <canvas id="graph" moz-opaque></canvas>
  </div>
</template>

<script>
import bus from 'emitter'
import * as d3 from 'd3'
import * as d3_composite from 'd3-composite-projections'
import * as topojson from 'topojson'
import * as STATUS from 'utils/graphicStatus'
import * as politicsList from 'utils/politicsConfig'


export default {
  name: 'Canvas',

  props: {
    width: Number,
    height: Number,
    projection: String,
    mode: Number,
    displayMesh: Boolean,
    displayArea: Boolean,
    topofile: Object,
  },

  // Prefix with '_' for data attribute disable the two way binding.
  data () {
    return {
      _topojsonData: null,

      _projection: null,
      _simplify: null,
      _path: null,
      _canvas: null,
      _ctx: null,
      _zoom: null,
      minZ: 0,

      _communesMeshes: null,
      _dptsMeshes: null,
      _regsMeshes: null,

      politics: null,
    }
  },


  computed: {
    simplify () {
      let minZ = this.minZ
      return d3.geoTransform({
        point (x, y, z) {
          if (z >= minZ)
          this.stream.point(x, y)
        }
      })
    },


    //
    transform () {
      return d3.geoIdentity()
      .clipExtent([[0, 0], [this.width, this.height]])
    },


    // Reactive mode function of scroll depth
    currentMode () {
      let m = this.mode
      if (m === STATUS.MODE.AUTO) {
        m = STATUS.MODE.REGION
        if (this.minZ <= 0.05) {
          m = STATUS.MODE.TOWN

        } else if (this.minZ <= 0.5) {
          m = STATUS.MODE.DEPARTMENT
        }
      }

      return m
    },


    // Current Stroke set in action.
    strokeWrapper () {
      let stroke = this._regsMeshes

      if (this.currentMode === STATUS.MODE.DEPARTMENT) {
        stroke = this._dptsMeshes

      } else if (this.currentMode === STATUS.MODE.TOWN) {
        stroke = this._communesMeshes

      }

      return stroke
    },


    // Current Fill set in action.
    fillWrapper () {
      let fill
      if (this.mode === STATUS.MODE.REGION) {
        fill = this._regs
      } else if (this.mode === STATUS.MODE.DEPARTMENT) {
        fill = this._dpts
      } else if (this.mode === STATUS.MODE.TOWN) {
        fill = this._communes
      } else if (this.mode === STATUS.MODE.AUTO) {
        fill = this._regs
      }

      return fill
    },


    background () {
      return topojson.merge(this._topojsonData, this._topojsonData.objects[this.topofile.key].geometries)
    }
  },


  created () {
    this.setupListener()
    this.initPolitics()
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


  // If the mode change, do a draw cycle.
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
      bus.$on('result', this.handleResult)
    },


    // Need to remove listeners on destruct.
    removeListener () {
      bus.$off('clearAll', this.clearAll)
      bus.$off('clearGraphic', this.clearGraphic)
      bus.$off('initGraph', this.initGraph)
      bus.$off('draw', this.draw)
      bus.$off('result', this.handleResult)
    },


    // Init data storage.
    initPolitics () {
      this.politics = new Map()
      Object.keys(politicsList).map( p => {
        let test = politicsList[p]
        test = politicsList[p]
        test.communes = d3.set()
        test.dpts = []
        test.regs = []
        test.communesFill = []
        this.politics.set(p, test)
      })
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
      this._topojsonData = topojsonData

      this._communesMeshes = topojson.mesh(
        topojsonData,
        topojsonData.objects[this.topofile.key],
        (a, b) => a !== b // don't draw external borders
      )

      this._dptsMeshes = this.populateMeshes(
        topojsonData,
        (a, b) => a.dpt !== b.dpt
      )

      this._regsMeshes = this.populateMeshes(
        topojsonData,
        (a, b) => a.reg !== b.reg
      )

      // TODO: store areas for each candidate
      // this._communes = topojson.feature(
      //   topojsonData,
      //   topojsonData.objects[this.topofile.key]
      // )

      // this._dpts = this.populateGroup(topojsonData, 'dpt')

      // this._regs = this.populateGroup(topojsonData, 'reg')

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
    populateMeshes (topojsonData, filterFunction) {
      return topojson.mesh(
        topojsonData,
        topojsonData.objects[this.topofile.key],
        filterFunction
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
      // this.stroke(this.strokeWrapper)

      bus.$emit('statusUpdate', STATUS.COMPLETE)
      console.timeEnd('draw')
    },


    // Fill the polygons.
    fill(fillWrapper) {
      this._ctx.beginPath()
      this._path(this.background)
      this._ctx.fillStyle = 'white'
      this._ctx.fill()

      this.politics.forEach((p, key) => {
        this._ctx.beginPath()
        this._ctx.fillStyle = p.color
        this._path(p.communesFill)
        this._ctx.fill()
      })
    },


    // Draw the strokes.
    stroke (strokeWrapper, color = STATUS.COLORS.BORDER, width = '.2') {
      this._ctx.beginPath()
      this._path(strokeWrapper)
      this._ctx.lineWidth = width
      this._ctx.strokeStyle = color
      this._ctx.stroke()
    },


    // Main result handler
    handleResult (vote) {
      console.log('vote received')

      let key = 'id'
      if (this.currentMode === STATUS.MODE.REGION){
        key = 'reg'
      } else if (this.currentMode === STATUS.MODE.DEPARTMENT) {
        key = 'dpt'
      }

      let resultArea = topojson.merge(
        this._topojsonData,
        this._topojsonData.objects[this.topofile.key].geometries.filter(d => d[key] === vote.selected[key])
      )

      this.updateCandidate(vote.winner, vote.selected)

      this.blink(resultArea, this.politics.get(vote.winner).color, '.4')
    },


    // Store new commune for a candidate
    updateCandidate (candidate, commune) {
      let updated = this.politics.get(candidate)
      updated.communes.add(commune.id)

      updated.communesFill = topojson.merge(
        this._topojsonData,
        this._topojsonData.objects[this.topofile.key].geometries.filter(d => updated.communes.has(d.id))
      )

      this.politics.set(candidate, updated)
    },


    // Paint a stroke, wait, and then do a draw cycle
    blink (resultArea, color, width) {
      let pStroke = _ => {
        return new Promise( (resolve, reject) => {
          this.stroke(resultArea, color, width)
          resolve()
        })
      }

      let pReset = _ => {
        return new Promise( (resolve, reject) => {
          setTimeout( _ => {
            this.draw()
            resolve()
          }, 200)
        })
      }

      pStroke().then(_ => pReset())
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
