<template>
  <div class="graphic">
    <svg id="graph"></svg>
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
      _rootNode: null,
      _areas: null,
      _meshes: null
    }
  },


  created () {
    this.setupListener()
  },


  mounted () {
    console.log('Compute SVG execution time')
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
    })
  },


  methods : {
    setupListener () {
      bus.$on('clearAll', _ => this.clearAll())
      bus.$on('clearGraphic', _ => this.clearGraphic())
      bus.$on('initGraph', _ => this.initGraph())
      bus.$on('draw', _ => this.draw())
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
      ).features

      console.timeEnd('populate')
    },


    initGraph () {
      console.time('initGraph')
      bus.$emit('statusUpdate', STATUS.INIT_GRAPHIC)

      this._projection = d3_composite.geoConicConformalFrance()
      .scale(2300)
      .translate([this.width / 2, this.height / 2])
      this._path = d3.geoPath().projection(this._projection)

      this._rootNode = d3.select('#graph')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')

      if (this.displayArea) {
        this._areas = this._rootNode
        .append('g')
        .classed('areas', true)
        .selectAll('.area')
        .data(this._cities)
        .enter()
        .append('path')
        .classed('area', true)
      }

      if (this.displayMesh) {
        this._meshes = this._rootNode
        .append('g')
        .classed('meshes', true)
        .append('path')
        .datum(topojson.mesh(
          this._topodata,
          this._topodata.objects[this.topofile.key])
        )
        .classed('mesh', true)
      }

      bus.$emit('statusUpdate', STATUS.GRAPHIC_READY)
      console.timeEnd('initGraph')
    },


    draw () {
      console.time('draw')
      bus.$emit('statusUpdate', STATUS.DRAWING)

      if (this.displayMesh) this._meshes.attr('d', this._path)
      if (this.displayArea) this._areas.attr('d', this._path)

      bus.$emit('statusUpdate', STATUS.COMPLETE)
      console.timeEnd('draw')
    },


    clearAll () {
      d3.select('#graph').selectAll('*').remove()

      this._projection = null
      this._path = null
      this._rootNode = null
      this._areas = null
      this._meshes = null

      bus.$emit('statusUpdate', STATUS.LOADED)
    },


    clearGraphic () {
      this._areas.selectAll('*').remove()
      this._meshes.selectAll('*').remove()

      bus.$emit('statusUpdate', STATUS.GRAPHIC_READY)
    }
  }
}
</script>

<style lang="scss">

</style>
