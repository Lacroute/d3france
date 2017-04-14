<template>
  <div ref="container" class="map-container">
    <h1>{{$t('partial_results')}}</h1>
    <p class="info">{{$t(status.u.map_explanation)}}</p>
    <vote-map-controls></vote-map-controls>
    <div class="wrapper-graph">
      <div class="map-container">
        <vote-map ref="map" :width="mapWidth" :height="mapHeight" class="vote-map"></vote-map>
        <search></search>
      </div>
      <podium-context ref="podium" class="podium-context"></podium-context>
    </div>
    <participation-context></participation-context>
  </div>

</template>

<script>
import VoteMap from 'components/map/VoteMap'
import VoteMapControls from 'components/map/VoteMapControls'
import PodiumContext from 'components/map/PodiumContext'
import ParticipationContext from 'components/map/ParticipationContext'
import Search from 'components/map/Search'
import { mapGetters, mapActions } from 'vuex'
import { FETCH_MAP_UPDATE } from 'src/store/action-types'
import { MAP_FETCH_INTERVAL } from 'utils/constants'
import bus from 'emitter'
import { REFRESH_WINNERS } from 'emitter/config'
export default {
  name: 'MapContainer',

  components: {VoteMap, PodiumContext, ParticipationContext, VoteMapControls, Search},

  data () {
    return {
      mapWidth: 0,
      mapHeight: 0
    }
  },


  computed: {
    ...mapGetters({
      status: 'status_data_file',
      isLoaded: 'isLoaded'
    })
  },

  watch: {
    isLoaded () {
      this.regularUpdate()
    }
  },

  mounted () {
    this.setupListener()
    this.$nextTick(_ => {
      this.handleResize()
    })
  },

  beforeDestroy () {
    this.removeListener()
  },

  methods: {
    ...mapActions({
      fetchMapUpdate: FETCH_MAP_UPDATE
    }),

    regularUpdate () {
      if (this.intervalId) clearInterval(this.intervalId)

      this.intervalId = setInterval(_ => {
        console.log('UPDATE')
        this.fetchMapUpdate()
        bus.$emit(REFRESH_WINNERS)
      }, MAP_FETCH_INTERVAL * 1000)
    },


    setupListener () {
      window.addEventListener('resize', this.handleResize)
    },

    removeListener () {
      window.removeEventListener('resize', this.handleResize)
    },

    // Needed because canvas need to know his width.
    handleResize () {
      this.$nextTick(_ => {
        let difference = this.$refs.container.clientWidth - this.$refs.podium.$el.clientWidth

        this.mapWidth = difference === 0 ? this.$refs.container.clientWidth : difference

        let x = window.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName('body')[0].clientWidth
        if (x <= 500) this.mapHeight = 284
        else if (x <= 980) this.mapHeight = 480
        else this.mapHeight = 610
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import "~styles/global";
h1{
  text-align: left;
}
.podium-context{
  margin-top: 24px;
}
.map-container{
  position: relative;
}

@media #{$break-medium} {
  .wrapper-graph{
    display: flex;
  }

  .podium-context{
    min-width: 33.33%;
    margin-top: 0px;
  }

}
</style>
