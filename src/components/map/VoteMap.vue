<template>
  <div ref="voteMap" class="graphic">
    <div class="instruction" v-if="!mapIsUnderstood">
      <div class="wrapper-instruction">
        <ul v-if="isMobile">
          <li><img src="~assets/img/icons/touch-1.png"><span>{{ $t('map_info_zoom_mobile') }}</span></li>
          <li><img src="~assets/img/icons/touch-2.png"><span>{{ $t('map_info_move_mobile') }}</span></li>
          <li><img src="~assets/img/icons/touch-3.png"><span>{{ $t('map_info_click_mobile') }}</span></li>
        </ul>
        <ul v-else>
          <li><img src="~assets/img/icons/mouse-1.png"><span>{{ $t('map_info_zoom') }}</span></li>
          <li><img src="~assets/img/icons/mouse-2.png"><span>{{ $t('map_info_move') }}</span></li>
          <li><img src="~assets/img/icons/mouse-3.png"><span>{{ $t('map_info_click') }}</span></li>
        </ul>
        <button type="button" name="button" @click.prevent="understood">{{ $t('map_info_validate')}}</button>
      </div>
    </div>
    <div :class="['vote-fetching-status', {loading: isFetchingWinners}]">
      <div class="flag"></div>
    </div>
    <canvas id="graph" ref="graph"></canvas>
    <canvas id="hidden"></canvas>
  </div>
</template>

<script>
// import apiVote from 'api/vote'
import ids from 'assets/idStore.json'
import colorsStore from 'assets/colorStore.json'
import { ZOOM_LEVEL, COLORS, GEO_FILE } from 'utils/constants'

import bus from 'emitter'
import { ZOOM_TO_SELECTED, ZOOM_FOR_SEARCH, REFRESH_WINNERS } from 'emitter/config'
import * as d3 from 'd3'
import { geoConicConformalFrance } from 'd3-composite-projections'
import { mesh, feature, presimplify } from 'topojson'
import { UPDATE_SELECTED_ID, GUARANTEE_HISTORY, UPDATE_ZOOM_LEVEL, FETCH_WINNERS } from 'src/store/action-types'
import { MAP_UNDERSTOOD } from 'src/store/mutation-types'
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'


// Need global object because of shitty scope.
let visibleArea = null
let invisibleArea = null
let scale = 1
let translate = [0, 0]

export default {
  name: 'VoteMap',

  props: {
    width: Number,
    height: Number
  },

  data () {
    return {
      candidates: new Map(), // features grouped by candidate

      timer: null, // the requestAnimationFrame id

      zoom: {
        percentage: 0.85, // the percentage of zoom feature in screen
        isAvailable: true, // If you can zoom to a feature again
        transitionTime: 750 // the time of a zoom transition
      },

      areaSelected: {
        cit: { fill: null, mesh: null, border: null }, // Store the city feature selected
        dpt: { fill: null, mesh: null, border: null }, // Store the dpt feature selected
        reg: { fill: null, mesh: null, border: null }, // Store the reg feature selected
        country: { fill: null, mesh: null, border: null } // The background
      },

      zoomQueue: [],

      canvas: null, // the map canvas
      ctx: null, // the map canvas context
      hiddenCtx: null, // the context of the hidden canvas (to get id from color)

      // Prefix with _ to pass plain object to vue, instead of observers,...
      _d3zoom: null, // d3 zoom
      _path: null, // main path generator
      _backedProjection: null, // the projection used to project the file
      _simplify: null // main simplificator
    }
  },


  computed: {
    ...mapState({
      currentZoomLevelWeight: ({zoomstate}) => zoomstate.currentZoomLevelWeight,
      currentZoomLevelName: ({zoomstate}) => zoomstate.currentZoomLevelName,
      priorZoomLevelWeight: ({zoomstate}) => zoomstate.priorZoomLevelWeight,
      borderCrossed: ({selection}) => selection.borderCrossed,
      zoomWay: ({zoomstate}) => zoomstate.way,
      selected: ({selection, zoomstate}) => selection.history[zoomstate.currentZoomLevelWeight],
      history: ({selection}) => selection.history,
      zoomMode: ({zoomstate}) => zoomstate.levels[0].nextLevelWeight,
      mapIsUnderstood: ({userActions}) => userActions.understood,
      politics: ({results}) => results.candidates,
      isFetchingWinners: ({results}) => results.isFetchingWinners
    }),

    // Needed to trigger the watcher.
    selectedGeoId () { return this.selected.geoId },

    selectedGeoKey () { return this.selected.geoKey },

    ...mapGetters([
      'isFirstLevelWeight',
      'isLastLevelWeight',
      'nextGeoKeys',
      'prevZoomLevelIds',
      'routeIds',
      'zoomWeightsOnView',
      'routeRound',
      'isLoaded'
    ]),

    // Reactive geodatafile path
    selectedFile () { return `${GEO_FILE.base}${this.selectedGeoKey}_${this.selectedGeoId}.json` },

    // Reactive pixelRatio
    pixelRatio () { return window.devicePixelRatio || 1 },

    isMobile () {
      return navigator.userAgent.match(/(android|iphone|blackberry|symbian|symbianos|symbos|netfront|model-orange|javaplatform|iemobile|windows phone|samsung|htc|opera mobile|opera mobi|opera mini|presto|huawei|blazer|bolt|doris|fennec|gobrowser|iris|maemo browser|mib|cldc|minimo|semc-browser|skyfire|teashark|teleca|uzard|uzardweb|meego|nokia|bb10|playbook)/gi)
    }
  },


  watch: {
    // When the width change, reinit the graph
    width () {
      if (this.timer) {
        this.timer.stop()
      }
      this.initGraph()
      this.timer = d3.timer(this.draw)
      this.zoomToSelected()
    },


    borderCrossed (status) {
      if (status) {
        this.resetBordersAbove(this.currentZoomLevelWeight)
      }
    },


    // When the zoom change, by a click or by other controls.
    selectedGeoId (geoId) {
      this.handleNewZoom()
    },


    zoomMode (weight) {
      this.resetToCountry()
      if (this.timer) {
        this.timer.stop()
        this.timer = null
      }
      this.mountCycle()
    },


    zoomQueue () {
      if (this.zoomQueue.length > 0) {
        this.lockClick()
        this.updateStore(this.zoomQueue[0])
      }
    },


    'zoom.isAvailable' (isRealised) {
      if (isRealised) {
        this.zoomQueue.shift()
      }
    },

    // Global initiation
    isLoaded () {
      this.setupListener()
      this.mountCycle()
    }
  },


  methods: {
    ...mapActions({
      updateSelectedId: UPDATE_SELECTED_ID,
      updateZoomLevel: UPDATE_ZOOM_LEVEL,
      guaranteeHistory: GUARANTEE_HISTORY,
      fetchWinners: FETCH_WINNERS
    }),


    ...mapMutations({
      understood: MAP_UNDERSTOOD
    }),


    mountCycle () {
      // Load geodata first so we can populate the winners features then.
      this.loadGeoData(this.selectedFile)
      .then(topodata => {
        this.areaSelected.country.fill = feature(topodata, topodata.objects.area)
        this.areaSelected.country.mesh = mesh(topodata, topodata.objects.area, (a, b) => a !== b)
        this.areaSelected.country.border = mesh(topodata, topodata.objects.area, (a, b) => a === b)
      })
      .then(_ => this.initGraph())
      .then(_ => {
        if (this.timer) this.timer.stop()
        this.timer = d3.timer(this.draw)
      })
      .then(_ => this.zoomToSelected())
      .then(_ => this.loadWinnersData())
    },


    // The listeners
    setupListener () {
      bus.$on(ZOOM_TO_SELECTED, this.zoomToSelected)
      bus.$on(ZOOM_FOR_SEARCH, this.zoomForSearch)
      bus.$on(REFRESH_WINNERS, this.loadWinnersData)
    },


    // Remove listeners on destruct.
    removeListener () {
      if (this._d3zoom) this._d3zoom.on('zoom', null)
      if (this.canvas) {
        this.canvas.on('click.zoom', null)
        // this.canvas.on('dblclick.zoom', null)
      }
      bus.$off(ZOOM_TO_SELECTED, this.zoomToSelected)
      bus.$off(ZOOM_FOR_SEARCH, this.zoomForSearch)
      bus.$off(REFRESH_WINNERS, this.loadWinnersData)
    },


    // Asynchronous geodata loading
    loadGeoData (file) {
      console.time('loadGeoData')
      return this.$http.get(file)
      .then(response => {
        console.timeEnd('loadGeoData')

        let topodata = response.data
        presimplify(topodata)
        return topodata
      })
    },


    // Load winners or equalities for a selected feature in a specific zoomLevel
    loadWinnersData () {
      console.time('loadWinnersData')

      if (this.isLastLevelWeight) return Promise.resolve()

      return this.fetchWinners()
      .then(response => {
        if (!response) return

        // The winners
        response.candidates.forEach((winner, id) => {
          // console.log(winner)
          if (!this.candidates.has(id)) {
            // If the winner entry don't exist yet.
            this.candidates.set(id, new Map())
            let ids = id.split('_')
            if (ids.length === 1) {
              // Simple winner
              this.candidates.get(id).set('color', this.politics[id].color)
            } else {
              // Equalities
              this.candidates.get(id).set('color', this.createPattern(ids.map(id => this.politics[id].color)))
            }
            this.candidates.get(id).set('zones', {})
          }

          let zones = this.candidates.get(id).get('zones')
          if (!zones[this.currentZoomLevelWeight]) {
            zones[this.currentZoomLevelWeight] = []
          }

          // Disable the selected zone
          let prevLevel = this.prevZoomLevelIds[this.currentZoomLevelWeight]
          if (!isNaN(prevLevel) && zones[prevLevel] !== undefined) {
            zones[prevLevel].map(f => {
              if (f.properties[this.selectedGeoKey] === `${this.selectedGeoKey}_${this.selectedGeoId}`) {
                // console.log(id, 'disable', f.properties[this.selected.geoKey])
                f.properties.display = false
              } else {
                f.properties.display = true
              }
            })
          }

          let features
          if (this.isFirstLevelWeight) {
            features = this.areaSelected.country.fill.features
          } else {
            features = this.areaSelected[this.selectedGeoKey].fill.features
          }

          // Looking for the associated features
          zones[this.currentZoomLevelWeight] = features.filter(f => winner.has(f.properties[response.geoKey]))

          zones[this.currentZoomLevelWeight].map(f => (f.properties.display = true))

          this.candidates.get(id).set('zones', zones)
        })
        console.timeEnd('loadWinnersData')
      })
    },


    cleanWinners () {
      console.time('cleanWinners')

      // Remove the winners under the last level and redisplay the associated features.
      let lastWeightOnView = this.zoomWeightsOnView.length - 1
      let levelRemove = this.zoomWeightsOnView[lastWeightOnView]
      let criteria = w => w > levelRemove
      let levelRedisplay = levelRemove

      // If you're going on the same level or you cross borders (another reg,...) remove also the last level and redisplay the upper one.
      if (this.zoomWay === 0 || this.borderCrossed) {
        criteria = w => w >= levelRemove
        levelRedisplay = this.zoomWeightsOnView[lastWeightOnView - 1] || 0
      }

      // Remove uneeded features.
      if (this.zoomWay <= 0) {
        this.candidates.forEach((c, cId) => {
          Object.keys(c.get('zones'))
          .filter(weight => criteria(+weight))
          .map(weight => {
            delete c.get('zones')[weight]
            if (Object.keys(c.get('zones')).length === 0) {
              this.candidates.delete(cId)
            }
          })
        })
      }

      // Display the properties hidden before to avoid a blank feature during loading
      this.candidates.forEach(c => {
        if (!isNaN(levelRedisplay) && c.get('zones')[levelRedisplay]) {
          c.get('zones')[levelRedisplay].map(f => {
            f.properties.display = true
          })
        }
      })

      console.timeEnd('cleanWinners')
    },


    // Create diag pattern, function of equalities colors
    createPattern (colorSet) {
      let bandWidth = 4
      let patternWidth = 2 * colorSet.length * bandWidth
      let patternHeight = patternWidth
      var canvasPattern = document.createElement('canvas')
      canvasPattern.width = patternWidth
      canvasPattern.height = patternHeight
      var contextPattern = canvasPattern.getContext('2d')

      contextPattern.lineWidth = bandWidth
      contextPattern.lineCap = 'square'

      let drawDiag = (dx, color) => {
        contextPattern.strokeStyle = color
        contextPattern.beginPath()
        contextPattern.moveTo(dx, 0)
        contextPattern.lineTo(patternWidth + dx, patternWidth)
        contextPattern.stroke()
      }

      let j = 0
      for (let i = 0; i <= 2 * patternWidth; i++) {
        let origin = -patternWidth + 2 * i * bandWidth
        drawDiag(origin, colorSet[j])
        drawDiag(origin + bandWidth, 'white')
        j = j < colorSet.length - 1 ? j + 1 : 0
      }

      return this.ctx.createPattern(canvasPattern, 'repeat')
    },


    // Helper for standard canvas config (visible and hidden)
    setCanvas (cnv) {
      return cnv.attr('width', this.width * this.pixelRatio)
      .attr('height', this.height * this.pixelRatio)
      .style('width', `${this.width}px`)
      .style('height', `${this.height}px`)
    },


    // Main initialisation for d3
    initGraph () {
      this.canvas = this.setCanvas(d3.select('#graph'))
      this.ctx = this.canvas.node().getContext('2d')
      this.ctx.scale(this.pixelRatio, this.pixelRatio)
      this.ctx.lineCap = 'round'
      this.ctx.miterLimit = 1

      let hiddenCanvas = this.setCanvas(d3.select('#hidden'))
      this.hiddenCtx = hiddenCanvas.node().getContext('2d')
      this.hiddenCtx.scale(this.pixelRatio, this.pixelRatio)

      let w = this.width
      let h = this.height
      // See https://bl.ocks.org/Lacroute/af1b46da4cb4579f93986b0119635ec2
      this._simplify = d3.geoTransform({
        point (x, y, z) {
          if (z < visibleArea) return

          x = x * scale + translate[0]
          y = y * scale + translate[1]
          if (x >= -10 && x <= w + 10 && y >= -10 && y <= h + 10 || z >= invisibleArea) {
            this.stream.point(x, y)
          }
        }
      })

      // Needed to retrieve the LAT/LNG of the selected feature's bounds
      this._simplify.invert = (u) => [(u[0] - translate[0]) / scale, (u[1] - translate[1]) / scale]

      this._path = d3.geoPath()
      .projection(this._simplify)
      .context(this.ctx)

      this._d3zoom = d3.zoom().scaleExtent([0.5, 100]).on('zoom', this.onZoom)

      this.canvas.call(this._d3zoom)
      .on('click.zoom', this.onClick)
      .on('dblclick.zoom', null)

      // linked to reproject.js
      this._backedProjection = geoConicConformalFrance()
    },


    // Zoom function
    onZoom () {
      var z = d3.event.transform
      translate = [z.x, z.y]
      scale = z.k
      visibleArea = 1 / scale / scale
      invisibleArea = 200 * visibleArea
    },


    // Zoom and fit to bounds of the last selected feature.
    zoomToSelected () {
      let zoomP = this.isLastLevelWeight ? 0.2 : this.zoom.percentage

      let feature = this.areaSelected[this.selectedGeoKey].fill
      if (!feature) feature = this.areaSelected.country.fill

      // If data isn't loaded, ie. when width watcher fire first time.
      if (!feature) return Promise.resolve()

      let bounds = this._path.bounds(feature)

      let dx = bounds[1][0] - bounds[0][0]
      let dy = bounds[1][1] - bounds[0][1]
      let x = (bounds[0][0] + bounds[1][0]) / 2
      let y = (bounds[0][1] + bounds[1][1]) / 2

      let factor = Math.min(this.width / dx, this.height / dy)
      let sc = factor * scale * zoomP

      let target = this._backedProjection.invert(this._simplify.invert([x, y]))
      target = this._backedProjection(target)

      return new Promise((resolve, reject) => {
        try {
          this.canvas.transition('zoomTo')
          .duration(this.zoom.transitionTime)
          .call(
            this._d3zoom.transform,
            d3.zoomIdentity
            .translate(
              this.width / 2 - target[0] * sc,
              this.height / 2 - target[1] * sc
            )
            .scale(sc)
          )
          .on('end', _ => {
            resolve()
          })
        } catch (e) {
          console.error('ERREUR')
          console.error(e)
          reject()
        }
      })
    },


    // Queue the zoom requests
    zoomForSearch (history) {
      this.zoomQueue.push(...history)
    },


    // Click handler
    onClick () {
      console.log('____')
      if (this.zoom.isAvailable) {
        // Avoid the concurrency during the load of data.
        this.lockClick()

        console.time('Click cycle')
        this.getIdFeature()
        .then(id => {
          if (id) this.updateStore(id)
          else this.resetToCountry()

          if (this.isLastLevelWeight || this.isFirstLevelWeight) this.releaseClick()
          console.timeEnd('Click cycle')
        })
      }
    },


    lockClick () {
      this.canvas.on('click.zoom', null)
      this.zoom.isAvailable = false
    },


    releaseClick () {
      this.canvas.on('click.zoom', this.onClick)
      this.zoom.isAvailable = true
    },


    // Dedicated to get the geoId of the clicked pixel.
    getIdFeature () {
      this.drawHiddenData()
      return Promise.resolve(this.getAreaId())
    },


    // Draw encoded data on an hidden canvas
    drawHiddenData () {
      console.time('drawHiddenData')
      this.hiddenCtx.clearRect(0, 0, this.width, this.height)
      this._path.context(this.hiddenCtx)

      // Helper
      let fillr = (feature, key) => {
        this.hiddenCtx.beginPath()
        this._path(feature)
        this.hiddenCtx.fillStyle = ids[feature.properties[key]].color
        this.hiddenCtx.fill()
      }

      // Only paint necessary hidden feature.
      this.zoomWeightsOnView.map(levelWeight => {
        switch (+levelWeight) {
          case ZOOM_LEVEL.COUNTRY.weight: {
            this.areaSelected.country.fill.features.map(f => fillr(f, this.nextGeoKeys[levelWeight]))
            break
          }
          case ZOOM_LEVEL.REGION.weight: {
            this.areaSelected.reg.fill.features.map(f => fillr(f, this.nextGeoKeys[levelWeight]))
            break
          }
          case ZOOM_LEVEL.DEPARTMENT.weight: {
            this.areaSelected.dpt.fill.features.map(f => fillr(f, this.nextGeoKeys[levelWeight]))
            break
          }
        }
      })

      // Back to normal TODO: dedicated path is better ?
      this._path.context(this.ctx)
      console.timeEnd('drawHiddenData')
    },


    // Retrieve the id of the clicked pixel.
    getAreaId () {
      console.time('getAreaId')

      // Need to scale the mouse result because of the different pixel ratio.
      let mouse = d3.mouse(this.$refs.graph).map(x => Math.round(x * this.pixelRatio))
      // 1 pixel is not enought, if you click on borders,
      // canvas doesn't respond with the good color.
      let size = 3
      let middle = Math.floor(size / 2)
      let data = this.hiddenCtx.getImageData(mouse[0] - middle, mouse[1] - middle, size, size).data

      // Find the dominant color
      let colors = {}
      for (let i = 0; i < data.length; i += 4) {
        let c = [data[i], data[i + 1], data[i + 2]].join(',')
        colors[c] = colors[c] ? colors[c] + 1 : 1
      }

      let dominant = Object.keys(colors).reduce((a, b) => colors[a] > colors[b] ? a : b)


      // If there is no dominant color
      if (colors[dominant] === 1) {
        console.error('no dominant')
        console.timeEnd('getAreaId')
        return
      }

      let localSelectedId = colorsStore[`rgb(${dominant})`]
      // If the user clicked outside
      if (localSelectedId === undefined) {
        console.error('outside click')
        console.timeEnd('getAreaId')
        return
      }

      console.timeEnd('getAreaId')
      return localSelectedId
    },


    // Update the store for others components
    updateStore (localSelectedId) {
      return this.updateSelectedId(localSelectedId)
    },


    // Callback when the zoom change, after a click, or elsewhere in the app
    handleNewZoom () {
      console.time('handleNewZoom')
      this.resetSelectionUnder()
      this.findSelectedFeature()
      .then(_ => {
        this.cleanWinners()
        return this.loadWinnersData()
      })
      .then(_ => {
        this.zoomToSelected()
        .then(_ => this.releaseClick())
        .catch(e => console.error(e))
        console.timeEnd('handleNewZoom')
      })
    },


    // Find or load the geoData corresponding to the found id.
    findSelectedFeature () {
      let geoPromise

      if (this.isFirstLevelWeight || this.isLastLevelWeight) {
        // Need to find
        if (this.isLastLevelWeight) {
          if (!this.areaSelected.cit.fill || this.areaSelected.cit.fill.properties.cit !== this.selectedGeoId) {
            // First click or clik on a new city
            let cityFeature = this.areaSelected.dpt.fill.features.find(f => f.properties.cit === `${this.selectedGeoKey}_${this.selectedGeoId}`)
            this.areaSelected.cit.fill = cityFeature
            this.areaSelected.cit.mesh = cityFeature
            this.areaSelected.cit.border = cityFeature
            this.guaranteeHistory(cityFeature.properties.cit)
          } else {
            // Click on the same city
          }
        }

        geoPromise = Promise.resolve()
      } else {
        // Need to load
        geoPromise = this.loadGeoData(this.selectedFile)
        .then(topodata => {
          let features = feature(topodata, topodata.objects.area)
          this.guaranteeHistory(features.features[0].properties.reg)

          this.areaSelected[this.selectedGeoKey].fill = features
          this.areaSelected[this.selectedGeoKey].border = mesh(topodata, topodata.objects.area, (a, b) => a === b)
          this.areaSelected[this.selectedGeoKey].mesh = mesh(topodata, topodata.objects.area, (a, b) => a !== b)
          return
        })
      }

      return geoPromise
    },


    // Reset Selection and set zoom to country
    resetToCountry () {
      if (this.currentZoomLevelWeight === ZOOM_LEVEL.COUNTRY.weight) {
        this.zoomToSelected()
      } else {
        this.updateZoomLevel(ZOOM_LEVEL.COUNTRY.weight)
        this.resetSelection()
        this.cleanWinners()
        this.loadWinnersData()
      }
    },


    // Reset selection
    resetSelection (geoKey = null) {
      if (geoKey) {
        this.areaSelected[geoKey].fill = null
        this.areaSelected[geoKey].mesh = null
        this.areaSelected[geoKey].border = null
      } else {
        this.areaSelected.cit = {fill: null, mesh: null, border: null}
        this.areaSelected.dpt = {fill: null, mesh: null, border: null}
        this.areaSelected.reg = {fill: null, mesh: null, border: null}
      }
    },


    // Reset borders
    resetBordersAbove (weight) {
      Object.keys(this.history)
      .filter(w => w < weight && w > 0)
      .map(w => {
        this.areaSelected[this.history[w].geoKey].border = null
      })
    },


    // Reset selection under the current zoom weight
    resetSelectionUnder () {
      Object.keys(this.history).filter(weight => this.history[weight].geoId === null).map(weight => {
        let level = this.history[weight]
        this.areaSelected[level.geoKey].fill = null
        this.areaSelected[level.geoKey].mesh = null
        this.areaSelected[level.geoKey].border = null
      })
    },


    /***********************/
    /** DRAWING FUNCTIONS **/
    /***********************/


    // Main drawing function.
    draw () {
      // Reset canvas
      this.ctx.clearRect(0, 0, this.width, this.height)
      this.paintBackground()
      if (this.candidates.size > 0) this.paintCandidates(this.candidates)
      this.meshBackground()
    },


    // display the country
    paintBackground () {
      // initStyle for background
      this.ctx.fillStyle = COLORS.BACKGROUND
      this.ctx.strokeStyle = COLORS.BORDER
      this.ctx.lineWidth = 10

      // display land external borders
      // Coast = 3fps
      this.ctx.beginPath()
      this._path(this.areaSelected.country.border)
      this.ctx.stroke()

      this.ctx.beginPath()
      this._path(this.areaSelected.country.fill)
      this.ctx.fill()
    },


    // Draw borders
    meshBackground () {
      // initStyle for meshes
      this.ctx.strokeStyle = COLORS.MESH
      this.ctx.lineWidth = 0.5

      // display land internal borders
      this.ctx.beginPath()
      this._path(this.areaSelected.country.mesh)
      this.ctx.stroke()

      // Coast = 1fps
      this.ctx.beginPath()
      this._path(this.areaSelected.reg.mesh)
      this._path(this.areaSelected.dpt.mesh)
      this._path(this.areaSelected.cit.mesh)
      this.ctx.stroke()

      // Coast = 4fps
      this.ctx.lineWidth = 1.5
      this.ctx.strokeStyle = COLORS.FEATURE_SELECTED
      this.ctx.beginPath()
      this._path(this.areaSelected.reg.border)
      this._path(this.areaSelected.dpt.border)
      this._path(this.areaSelected.cit.border)
      this.ctx.stroke()
    },


    // Paint color by color
    // Coast = 17fps
    paintCandidates (candidateSet) {
      candidateSet.forEach(candidate => {
        this.ctx.beginPath()
        this.ctx.fillStyle = candidate.get('color')
        Object.values(candidate.get('zones')).map(features => {
          features.map(f => { if (f.properties.display) this._path(f) })
        })
        this.ctx.fill()
      })
    }
  },

  // When the component his destroyed
  destroyed () {
    this.removeListener()
    // TODO clean stores
    if (this.timer) this.timer.stop()
    this.resetToCountry()
  }
}
</script>

<style lang="scss">
@import "~styles/global";

.graphic {
  border-radius: 2px;
  background: white;
  background-image: radial-gradient(circle, rgba(#c4d4dc, 1) 0%, rgba(#c4d4dc, .5) 50%, rgba(#e5ecef, 1) 100%);
  font-size: 0;
  position: relative;

  .instruction{
    position: absolute;
    width: 100%;
    height: 100%;
    font-size: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;

    .wrapper-instruction {
      max-width: 75%;
      background: rgba(255, 255, 255, .9);
      padding: 18px 12px;
      border-radius: 2px;
      box-shadow: 0 0 2em rgba($font-color-main, .3);

      ul{
        text-align: left;
        padding: 0;
        margin: 0 0 15px 0;
        list-style: none;

        li{
          display: flex;
          align-items: center;
          font-size: 13px;
          color: $grey-cold-6;
        }

        li + li{
          padding-top: 10px;
        }

        li img{
          max-width: 48px;
        }
      }
      button{
        border: 1px solid $link-color;
        color: $link-color;
        font-size: 13px;
        background: none;
        border-radius: 3px;
        font-weight: 400;
        padding: 9px 12px;
        font-family: $source_sans_pro
      }
    }
  }

  .vote-fetching-status{
    position: absolute;
    top: 0;
    width: 100%;

    .flag{
      position: relative;
      background-color: white;
      width: 100%;
      height: $height_flag_bar;
    }

    .flag:before,
    .flag:after{
      content: " ";
      width: $width_flag_bar;
      height: 100%;
      position: absolute;
      top: 0;
      right: 100%;
      opacity: 0;
      animation: 500ms fade;
    }
  }

  .vote-fetching-status.loading{
    .flag:before,
    .flag:after{
      opacity: 1;
      // transition: opacity 200ms ease;
    }
    .flag:before{
      background-color: #5681ba;
      animation: 1500ms infinite walk 100ms;
    }
    .flag:after{
      background-color: #c5595f;
      animation: 1500ms infinite walk;
    }
  }

  canvas{
    width: 0;
    background: transparent;
    cursor: pointer;
  }

  input{
    display: block
  }
}

#hidden{
  display: none;
}
@keyframes fade {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
@keyframes walk {
  0% {
    right: 100%;
    width: 0;
  }
  10% {
    width: $width_flag_bar;
  }
  90% {
    width: $width_flag_bar;
  }
  100% {
    width: 0;
    right: 0%;
  }

}
@media #{$break-small} {
  .graphic{
    .instruction{
      .wrapper-instruction {
        background: white;
        padding: 18px 24px;
      }
    }
  }
}
@media #{$break-medium} {
  .graphic{
    .instruction{
      // background: rgba(255, 255, 255, .75);

      .wrapper-instruction {
        padding: 36px 24px;

        ul li, button{
          font-size: 1rem;
        }
        button{
          padding: 18px 24px;
        }
      }
    }
  }
}
</style>
